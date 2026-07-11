/**
 * Auto-Grading Engine for Pascal Assessment
 * Supports exact, partial, and manual grading across 14+ question types.
 * Short-input supports partial scoring when multiple correct answers exist.
 */

import type { Item, Section } from "@/types/assignment";

export interface GradedAnswer {
  itemId: string;
  itemName: string;
  itemType: string;
  status: "correct" | "incorrect" | "partial" | "skipped" | "ungraded";
  earnedPoints: number;
  maxPoints: number;
}

export interface ScoreResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  gradedAnswers: Record<string, GradedAnswer>;
}

/**
 * Flatten all items from assignment sections into a single array
 */
function flattenItems(sections: Section[]): Item[] {
  return sections.flatMap((sec) => sec.items || []);
}

/**
 * Normalize string for comparison: trim, lowercase, collapse whitespace
 */
function normalize(s: string): string {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Grade a single multiple-choice question (single correct answer)
 */
function gradeMultipleChoice(
  answer: any,
  config: any,
  points: number
): GradedAnswer {
  const base: Omit<GradedAnswer, "status" | "earnedPoints"> = {
    itemId: "",
    itemName: "",
    itemType: "multiple-choice",
    maxPoints: points,
  };

  if (!answer || !answer.selectedHash) {
    return { ...base, status: "skipped", earnedPoints: 0 };
  }

  const isCorrect = answer.selectedHash === config.correctHash;
  return {
    ...base,
    status: isCorrect ? "correct" : "incorrect",
    earnedPoints: isCorrect ? points : 0,
  };
}

/**
 * Grade a multiple-selection question (partial scoring)
 * Formula: (correct selections - wrong selections) / total correct * points
 * Minimum 0 points (no negative)
 */
function gradeMultipleSelection(
  answer: any,
  config: any,
  points: number
): GradedAnswer {
  const base: Omit<GradedAnswer, "status" | "earnedPoints"> = {
    itemId: "",
    itemName: "",
    itemType: "multiple-selection",
    maxPoints: points,
  };

  const selected: string[] = answer?.selectedHashes || [];
  const correct: string[] = config.correctHashes || [];

  if (selected.length === 0) {
    return { ...base, status: "skipped", earnedPoints: 0 };
  }

  const correctSelections = selected.filter((h: string) =>
    correct.includes(h)
  ).length;
  const wrongSelections = selected.filter(
    (h: string) => !correct.includes(h)
  ).length;

  const rawScore = Math.max(0, correctSelections - wrongSelections);
  const earned =
    correct.length > 0
      ? Math.round((rawScore / correct.length) * points * 100) / 100
      : 0;

  if (correctSelections === correct.length && wrongSelections === 0) {
    return { ...base, status: "correct", earnedPoints: points };
  }
  if (rawScore > 0) {
    return { ...base, status: "partial", earnedPoints: earned };
  }
  return { ...base, status: "incorrect", earnedPoints: 0 };
}

/**
 * Grade a true/false question
 */
function gradeTrueFalse(
  answer: any,
  config: any,
  points: number
): GradedAnswer {
  const base: Omit<GradedAnswer, "status" | "earnedPoints"> = {
    itemId: "",
    itemName: "",
    itemType: "true-false",
    maxPoints: points,
  };

  if (answer === null || answer === undefined) {
    return { ...base, status: "skipped", earnedPoints: 0 };
  }

  // answer can be boolean or { value: boolean }
  const studentAnswer =
    typeof answer === "boolean" ? answer : answer?.value ?? answer?.selectedHash;

  const isCorrect = studentAnswer === config.correctAnswer;
  return {
    ...base,
    status: isCorrect ? "correct" : "incorrect",
    earnedPoints: isCorrect ? points : 0,
  };
}

/**
 * Grade a short-input question with PARTIAL SCORING
 * If correctAnswers = ["CaO", "MnO", "CuO"] and student types "CaO",
 * they get 1/3 of points (partial).
 * If student types "CaO; MnO; CuO" (semicolon-separated), check each token.
 */
function gradeShortInput(
  answer: any,
  config: any,
  points: number
): GradedAnswer {
  const base: Omit<GradedAnswer, "status" | "earnedPoints"> = {
    itemId: "",
    itemName: "",
    itemType: "short-input",
    maxPoints: points,
  };

  const studentText: string =
    typeof answer === "string" ? answer : answer?.text || answer?.value || "";

  if (!studentText.trim()) {
    return { ...base, status: "skipped", earnedPoints: 0 };
  }

  const correctAnswers: string[] = config.correctAnswers || [];
  if (correctAnswers.length === 0) {
    return { ...base, status: "ungraded", earnedPoints: 0 };
  }

  // Split student input by semicolons, commas, or newlines to support multiple answers
  const studentTokens = studentText
    .split(/[;,\n]+/)
    .map((t: string) => normalize(t))
    .filter((t: string) => t.length > 0);

  const caseSensitive = config.caseSensitive || false;
  const normalizedCorrect = correctAnswers.map((a: string) =>
    caseSensitive ? a.trim() : normalize(a)
  );

  // Count how many correct answers the student provided
  const matchedCorrect = new Set<number>();
  for (const token of studentTokens) {
    const compareToken = caseSensitive ? token : normalize(token);
    const idx = normalizedCorrect.findIndex(
      (c: string, i: number) => !matchedCorrect.has(i) && c === compareToken
    );
    if (idx !== -1) {
      matchedCorrect.add(idx);
    }
  }

  const matchCount = matchedCorrect.size;
  const totalCorrect = normalizedCorrect.length;

  if (matchCount === totalCorrect) {
    return { ...base, status: "correct", earnedPoints: points };
  }
  if (matchCount > 0) {
    const earned =
      Math.round((matchCount / totalCorrect) * points * 100) / 100;
    return { ...base, status: "partial", earnedPoints: earned };
  }

  // Single-answer legacy mode: check if entire input matches any single correct answer
  const wholeNormalized = caseSensitive
    ? studentText.trim()
    : normalize(studentText);
  if (normalizedCorrect.includes(wholeNormalized)) {
    return { ...base, status: "correct", earnedPoints: points };
  }

  return { ...base, status: "incorrect", earnedPoints: 0 };
}

/**
 * Grade a dropdown question
 */
function gradeDropdown(
  answer: any,
  config: any,
  points: number
): GradedAnswer {
  const base: Omit<GradedAnswer, "status" | "earnedPoints"> = {
    itemId: "",
    itemName: "",
    itemType: "drop-down",
    maxPoints: points,
  };

  if (!answer || !answer.selectedHash) {
    return { ...base, status: "skipped", earnedPoints: 0 };
  }

  const isCorrect = answer.selectedHash === config.correctHash;
  return {
    ...base,
    status: isCorrect ? "correct" : "incorrect",
    earnedPoints: isCorrect ? points : 0,
  };
}

/**
 * Grade fill-in-the-blanks (partial: per-blank scoring)
 */
function gradeFillInBlanks(
  answer: any,
  config: any,
  points: number
): GradedAnswer {
  const base: Omit<GradedAnswer, "status" | "earnedPoints"> = {
    itemId: "",
    itemName: "",
    itemType: "fill-in-the-blanks",
    maxPoints: points,
  };

  const blanks = config.blanks || [];
  if (blanks.length === 0)
    return { ...base, status: "ungraded", earnedPoints: 0 };

  if (!answer || typeof answer !== "object")
    return { ...base, status: "skipped", earnedPoints: 0 };

  let correctCount = 0;
  for (const blank of blanks) {
    const studentVal = answer[blank.id];
    const studentText =
      typeof studentVal === "string"
        ? studentVal
        : studentVal?.text || studentVal?.value || "";
    if (normalize(studentText) === normalize(blank.correctAnswer)) {
      correctCount++;
    }
  }

  const earned =
    Math.round((correctCount / blanks.length) * points * 100) / 100;

  if (correctCount === blanks.length)
    return { ...base, status: "correct", earnedPoints: points };
  if (correctCount > 0)
    return { ...base, status: "partial", earnedPoints: earned };
  return { ...base, status: "incorrect", earnedPoints: 0 };
}

/**
 * Grade matching (partial: per-connection scoring)
 */
function gradeMatching(
  answer: any,
  config: any,
  points: number
): GradedAnswer {
  const base: Omit<GradedAnswer, "status" | "earnedPoints"> = {
    itemId: "",
    itemName: "",
    itemType: "matching",
    maxPoints: points,
  };

  const correctConnections = config.correctConnections || [];
  if (correctConnections.length === 0)
    return { ...base, status: "ungraded", earnedPoints: 0 };

  const studentConnections = answer?.connections || [];
  if (studentConnections.length === 0)
    return { ...base, status: "skipped", earnedPoints: 0 };

  let correctCount = 0;
  for (const correct of correctConnections) {
    const found = studentConnections.some(
      (sc: any) =>
        sc.leftId === correct.leftId && sc.rightId === correct.rightId
    );
    if (found) correctCount++;
  }

  const total = correctConnections.length;
  const earned = Math.round((correctCount / total) * points * 100) / 100;

  if (correctCount === total)
    return { ...base, status: "correct", earnedPoints: points };
  if (correctCount > 0)
    return { ...base, status: "partial", earnedPoints: earned };
  return { ...base, status: "incorrect", earnedPoints: 0 };
}

/**
 * Grade re-sequence (all-or-nothing)
 */
function gradeResequence(
  answer: any,
  config: any,
  points: number
): GradedAnswer {
  const base: Omit<GradedAnswer, "status" | "earnedPoints"> = {
    itemId: "",
    itemName: "",
    itemType: "re-sequence",
    maxPoints: points,
  };

  const correctOrder = (config.items || [])
    .sort((a: any, b: any) => a.correctOrder - b.correctOrder)
    .map((item: any) => item.id);

  const studentOrder = answer?.order || answer?.items || [];
  if (!Array.isArray(studentOrder) || studentOrder.length === 0)
    return { ...base, status: "skipped", earnedPoints: 0 };

  const studentIds = studentOrder.map((item: any) =>
    typeof item === "string" ? item : item.id
  );

  const isCorrect =
    JSON.stringify(studentIds) === JSON.stringify(correctOrder);
  return {
    ...base,
    status: isCorrect ? "correct" : "incorrect",
    earnedPoints: isCorrect ? points : 0,
  };
}

/**
 * Grade drag-and-drop (partial: per-zone scoring)
 */
function gradeDragAndDrop(
  answer: any,
  config: any,
  points: number
): GradedAnswer {
  const base: Omit<GradedAnswer, "status" | "earnedPoints"> = {
    itemId: "",
    itemName: "",
    itemType: "drag-and-drop",
    maxPoints: points,
  };

  const dropZones = config.dropZones || [];
  if (dropZones.length === 0)
    return { ...base, status: "ungraded", earnedPoints: 0 };
  if (!answer || typeof answer !== "object")
    return { ...base, status: "skipped", earnedPoints: 0 };

  let correctCount = 0;
  for (const zone of dropZones) {
    const studentAnswer = answer[zone.id];
    const expectedWord = zone.expectedWord || zone.targetDraggableId;
    if (normalize(String(studentAnswer || "")) === normalize(expectedWord)) {
      correctCount++;
    }
  }

  const total = dropZones.length;
  const earned = Math.round((correctCount / total) * points * 100) / 100;

  if (correctCount === total)
    return { ...base, status: "correct", earnedPoints: points };
  if (correctCount > 0)
    return { ...base, status: "partial", earnedPoints: earned };
  return { ...base, status: "incorrect", earnedPoints: 0 };
}

/**
 * Grade classification (partial: per-item scoring)
 */
function gradeClassification(
  answer: any,
  config: any,
  points: number
): GradedAnswer {
  const base: Omit<GradedAnswer, "status" | "earnedPoints"> = {
    itemId: "",
    itemName: "",
    itemType: "classification",
    maxPoints: points,
  };

  const items = config.items || [];
  if (items.length === 0)
    return { ...base, status: "ungraded", earnedPoints: 0 };
  if (!answer || typeof answer !== "object")
    return { ...base, status: "skipped", earnedPoints: 0 };

  let correctCount = 0;
  for (const item of items) {
    const studentCategory = answer[item.id];
    if (studentCategory === item.categoryId) correctCount++;
  }

  const total = items.length;
  const earned = Math.round((correctCount / total) * points * 100) / 100;

  if (correctCount === total)
    return { ...base, status: "correct", earnedPoints: points };
  if (correctCount > 0)
    return { ...base, status: "partial", earnedPoints: earned };
  return { ...base, status: "incorrect", earnedPoints: 0 };
}

/**
 * Grade highlight-text (partial: per-zone scoring)
 */
function gradeHighlightText(
  answer: any,
  config: any,
  points: number
): GradedAnswer {
  const base: Omit<GradedAnswer, "status" | "earnedPoints"> = {
    itemId: "",
    itemName: "",
    itemType: "highlight-text",
    maxPoints: points,
  };

  const zones = config.highlightZones || [];
  const correctZones = zones.filter((z: any) => z.isCorrectAnswer);
  if (correctZones.length === 0)
    return { ...base, status: "ungraded", earnedPoints: 0 };

  const selectedZones: string[] = answer?.selectedZones || [];
  if (selectedZones.length === 0)
    return { ...base, status: "skipped", earnedPoints: 0 };

  let correctCount = 0;
  for (const zone of correctZones) {
    if (selectedZones.includes(zone.id)) correctCount++;
  }

  const total = correctZones.length;
  const earned = Math.round((correctCount / total) * points * 100) / 100;

  if (correctCount === total)
    return { ...base, status: "correct", earnedPoints: points };
  if (correctCount > 0)
    return { ...base, status: "partial", earnedPoints: earned };
  return { ...base, status: "incorrect", earnedPoints: 0 };
}

/**
 * Master grading function: routes to the appropriate grader per item type
 */
function gradeItem(item: Item, answer: any): GradedAnswer {
  const points = item.points || 0;
  const config = (item as any).config || {};
  let result: GradedAnswer;

  switch (item.type) {
    case "multiple-choice":
      result = gradeMultipleChoice(answer, config, points);
      break;
    case "multiple-selection":
      result = gradeMultipleSelection(answer, config, points);
      break;
    case "true-false":
      result = gradeTrueFalse(answer, config, points);
      break;
    case "short-input":
      result = gradeShortInput(answer, config, points);
      break;
    case "drop-down":
      result = gradeDropdown(answer, config, points);
      break;
    case "fill-in-the-blanks":
      result = gradeFillInBlanks(answer, config, points);
      break;
    case "matching":
      result = gradeMatching(answer, config, points);
      break;
    case "re-sequence":
      result = gradeResequence(answer, config, points);
      break;
    case "drag-and-drop":
      result = gradeDragAndDrop(answer, config, points);
      break;
    case "classification":
      result = gradeClassification(answer, config, points);
      break;
    case "highlight-text":
      result = gradeHighlightText(answer, config, points);
      break;
    // Manual grading types
    case "essay":
    case "drawing":
    case "math-input":
      result = {
        itemId: "",
        itemName: "",
        itemType: item.type,
        maxPoints: points,
        status: answer ? "ungraded" : "skipped",
        earnedPoints: 0,
      };
      break;
    default:
      result = {
        itemId: "",
        itemName: "",
        itemType: item.type,
        maxPoints: points,
        status: "ungraded",
        earnedPoints: 0,
      };
  }

  // Inject item metadata
  result.itemId = item.id;
  result.itemName = item.name;
  return result;
}

/**
 * Calculate total score for all student answers against assignment key
 */
export function calculateScore(
  studentAnswers: Record<string, any>,
  sections: Section[]
): ScoreResult {
  const items = flattenItems(sections);
  const gradedAnswers: Record<string, GradedAnswer> = {};
  let totalScore = 0;
  let maxScore = 0;

  for (const item of items) {
    const answer = studentAnswers[item.id];
    const graded = gradeItem(item, answer);
    gradedAnswers[item.id] = graded;
    totalScore += graded.earnedPoints;
    maxScore += graded.maxPoints;
  }

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0;

  return { totalScore, maxScore, percentage, gradedAnswers };
}
