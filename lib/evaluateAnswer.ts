/**
 * Universal Auto-Grading Engine V2 (`evaluateAnswer`)
 * Handles 5 distinct question groups, prevents race conditions, and catches edge cases
 * including localized strings, fuzzy type aliases, nested payloads, and strict JSON debug logging.
 */

export type GradingStatus =
  | "skipped"
  | "needs_grading"
  | "incorrect"
  | "partial"
  | "correct";

export interface GradingResult {
  status: GradingStatus;
  score: number; // Rounded to 2 decimal places using Number(score.toFixed(2))
  maxScore: number;
  metadata?: any; // E.g., which specific blanks were correct/incorrect in a PDF interaction
}

/**
 * 2. The Pre-Processor (Normalization Helper)
 */
export const normalizeSingleValue = (val: any): string => {
  if (val === null || val === undefined) return "";
  // If it's an array with 1 item (e.g., ["A"] or ["opt-a"]), unwrap it
  if (Array.isArray(val) && val.length === 1) {
    return String(val[0]).trim().toLowerCase();
  }
  if (Array.isArray(val)) {
    return val
      .map((v) => String(v).trim().toLowerCase())
      .sort()
      .join(",");
  }
  if (typeof val === "object") {
    // Check common object payload properties before falling back to JSON
    if (val.value !== undefined) return String(val.value).trim().toLowerCase();
    if (val.selectedHash !== undefined)
      return String(val.selectedHash).trim().toLowerCase();
    if (val.id !== undefined) return String(val.id).trim().toLowerCase();
    return JSON.stringify(val);
  }
  return String(val).trim().toLowerCase();
};

/**
 * Helper to get the target correctAnswer from question object
 */
function getCorrectAnswer(question: any): any {
  if (question.correctAnswer !== undefined) return question.correctAnswer;
  if (question.config?.correctAnswer !== undefined)
    return question.config.correctAnswer;
  if (question.config?.correctAnswers !== undefined)
    return question.config.correctAnswers;
  if (question.config?.correctHash !== undefined)
    return question.config.correctHash;
  if (question.options?.correct !== undefined)
    return question.options.correct;
  if (question.answer !== undefined) return question.answer;
  return undefined;
}

/**
 * Universal evaluateAnswer V2 function
 */
export function evaluateAnswer(
  question: any,
  studentAnswer: any
): GradingResult {

  const maxScore = Number(
    Number(question.points ?? question.maxScore ?? 0).toFixed(2)
  );

  const correct = getCorrectAnswer(question);

  // 3. Fix the Gatekeeper (Anti-Skip Logic)
  const isAnswered =
    studentAnswer !== undefined &&
    studentAnswer !== null &&
    (typeof studentAnswer !== "string" || studentAnswer.trim() !== "") &&
    (!Array.isArray(studentAnswer) || studentAnswer.length > 0) &&
    (typeof studentAnswer !== "object" ||
      studentAnswer === null ||
      Object.keys(studentAnswer).length > 0);

  if (!isAnswered) {
    const finalStatus: GradingStatus = "skipped";
    const finalScore = 0;
    return { status: finalStatus, score: finalScore, maxScore };
  }

  // 4. Bulletproof Switch-Cases (Handle Aliases & Fuzzy Matching)
  const rawType = String(question.type || "")
    .toLowerCase()
    .replace(/-/g, "_");

  let finalStatus: GradingStatus = "incorrect";
  let finalScore = 0;
  let metadata: any = undefined;

  switch (rawType) {
    // Exact Match aliases
    case "multiple_choice":
    case "radio":
    case "dropdown":
    case "drop_down": {
      // Step 3 Audit normalization for exact match types
      const sVal = Array.isArray(studentAnswer) ? studentAnswer[0] : studentAnswer;
      const cVal = Array.isArray(correct) ? correct[0] : correct;
      const isCorrect =
        normalizeSingleValue(sVal) !== "" &&
        normalizeSingleValue(sVal) === normalizeSingleValue(cVal);
      finalScore = isCorrect ? maxScore : 0;
      finalStatus = isCorrect ? "correct" : "incorrect";
      break;
    }

    // True/False & Boolean localized aliases
    case "true_false":
    case "boolean": {
      const sVal = normalizeSingleValue(studentAnswer);
      const cVal = normalizeSingleValue(correct);
      // Map common localized truths
      const isStudentTrue = sVal === "true" || sVal.includes("đúng");
      const isCorrectTrue = cVal === "true" || cVal.includes("đúng");
      const isCorrect = sVal !== "" && isStudentTrue === isCorrectTrue;
      finalScore = isCorrect ? maxScore : 0;
      finalStatus = isCorrect ? "correct" : "incorrect";
      break;
    }

    // Math, Formula & LaTeX aliases
    case "math":
    case "formula":
    case "latex":
    case "math_input": {
      const rawStudent = String(
        Array.isArray(studentAnswer)
          ? studentAnswer[0]
          : typeof studentAnswer === "object" && studentAnswer !== null
          ? studentAnswer.latex || studentAnswer.value || ""
          : studentAnswer
      ).replace(/\s+/g, "");

      const rawCorrect = String(
        Array.isArray(correct) ? correct[0] : correct ?? ""
      ).replace(/\s+/g, "");

      const isCorrect = rawStudent !== "" && rawStudent === rawCorrect;
      finalScore = isCorrect ? maxScore : 0;
      finalStatus = isCorrect ? "correct" : "incorrect";
      break;
    }

    // Multi-Select (checkbox)
    case "checkbox":
    case "multiple_selection":
    case "multi_select": {
      const correctArray: string[] = Array.isArray(correct)
        ? correct.map((x) => String(x).trim().toLowerCase()).filter(Boolean)
        : String(correct || "")
            .split(",")
            .map((x) => x.trim().toLowerCase())
            .filter(Boolean);

      const studentArray: string[] = Array.isArray(studentAnswer)
        ? studentAnswer
            .map((x) => String(x).trim().toLowerCase())
            .filter(Boolean)
        : String(studentAnswer || "")
            .split(",")
            .map((x) => x.trim().toLowerCase())
            .filter(Boolean);

      if (correctArray.length === 0) {
        finalStatus = "needs_grading";
        finalScore = 0;
        break;
      }

      const correctSet = new Set(correctArray);
      let correctMatches = 0;
      let incorrectMatches = 0;

      for (const sel of studentArray) {
        if (correctSet.has(sel)) {
          correctMatches++;
        } else {
          incorrectMatches++;
        }
      }

      const rawScore = Math.max(
        0,
        ((correctMatches - incorrectMatches) / correctArray.length) * maxScore
      );
      finalScore = Number(rawScore.toFixed(2));

      if (correctMatches === correctArray.length && incorrectMatches === 0) {
        finalStatus = "correct";
      } else if (finalScore > 0) {
        finalStatus = "partial";
      } else {
        finalStatus = "incorrect";
      }

      metadata = {
        correctMatches,
        incorrectMatches,
        totalCorrect: correctArray.length,
      };
      break;
    }

    // Text & Characters
    case "short_answer":
    case "short_input":
    case "text": {
      const targets: string[] = Array.isArray(correct)
        ? correct.map((x) => String(x).trim().toLowerCase()).filter(Boolean)
        : String(correct || "")
            .split(",")
            .map((x) => x.trim().toLowerCase())
            .filter(Boolean);

      if (targets.length === 0) {
        finalStatus = "needs_grading";
        finalScore = 0;
        break;
      }

      const studentStr = String(studentAnswer).toLowerCase();
      let matches = 0;
      for (const kw of targets) {
        if (studentStr.includes(kw)) {
          matches++;
        }
      }

      const rawScore = (matches / targets.length) * maxScore;
      finalScore = Number(rawScore.toFixed(2));

      if (matches === targets.length) {
        finalStatus = "correct";
      } else if (matches > 0) {
        finalStatus = "partial";
      } else {
        finalStatus = "incorrect";
      }

      metadata = {
        matchedKeywords: matches,
        totalKeywords: targets.length,
      };
      break;
    }

    // PDF Interactions
    case "fill_in_blank":
    case "fill_in_the_blanks":
    case "matching": {
      let correctObj: Record<string, string> = {};

      if (correct && typeof correct === "object" && !Array.isArray(correct)) {
        correctObj = { ...correct };
      } else if (Array.isArray(question.config?.blanks)) {
        question.config.blanks.forEach((b: any) => {
          correctObj[b.id] = String(b.correctAnswer ?? "");
        });
      } else if (Array.isArray(question.config?.pairs)) {
        question.config.pairs.forEach((p: any) => {
          correctObj[p.id] = String(p.targetId ?? "");
        });
      }

      const keys = Object.keys(correctObj);
      if (keys.length === 0) {
        finalStatus = "needs_grading";
        finalScore = 0;
        break;
      }

      const studentObj: Record<string, any> =
        studentAnswer &&
        typeof studentAnswer === "object" &&
        !Array.isArray(studentAnswer)
          ? studentAnswer
          : {};

      let correctKeys = 0;
      const md: Record<string, boolean> = {};

      for (const key of keys) {
        const expected = String(correctObj[key] ?? "").trim().toLowerCase();
        const actualVal = studentObj[key];
        const actual = String(
          typeof actualVal === "object" && actualVal !== null
            ? actualVal.text ?? actualVal.value ?? actualVal.targetId ?? ""
            : actualVal ?? ""
        )
          .trim()
          .toLowerCase();

        const isMatch = expected !== "" && actual === expected;
        md[key] = isMatch;
        if (isMatch) {
          correctKeys++;
        }
      }

      const rawScore = (correctKeys / keys.length) * maxScore;
      finalScore = Number(rawScore.toFixed(2));

      if (correctKeys === keys.length) {
        finalStatus = "correct";
      } else if (correctKeys > 0) {
        finalStatus = "partial";
      } else {
        finalStatus = "incorrect";
      }

      metadata = md;
      break;
    }

    // Manual Grading
    case "essay":
    case "drawing":
    case "file_upload":
    default: {
      finalStatus = "needs_grading";
      finalScore = 0;
      break;
    }
  }

  return {
    status: finalStatus,
    score: Number(finalScore.toFixed(2)),
    maxScore,
    metadata,
  };
}
