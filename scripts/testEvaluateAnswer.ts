import { evaluateAnswer } from "../lib/evaluateAnswer";

export function runEvaluateAnswerTests() {
  console.log("=========================================");
  console.log("    RUNNING EVALUATE ANSWER V2 SUITE     ");
  console.log("=========================================\n");

  const testCases = [
    // -------------------------------------------------------------
    // GATEKEEPER TESTS
    // -------------------------------------------------------------
    {
      name: "[Gatekeeper] null studentAnswer -> skipped",
      question: { id: "q1", type: "multiple_choice", points: 10, correctAnswer: "A" },
      studentAnswer: null,
      expected: { status: "skipped", score: 0, maxScore: 10 },
    },
    {
      name: "[Gatekeeper] empty string -> skipped",
      question: { id: "q2", type: "short_answer", points: 5, correctAnswer: "Cat" },
      studentAnswer: "   ",
      expected: { status: "skipped", score: 0, maxScore: 5 },
    },
    {
      name: "[Gatekeeper] empty array -> skipped",
      question: { id: "q3", type: "checkbox", points: 4, correctAnswer: ["A", "B"] },
      studentAnswer: [],
      expected: { status: "skipped", score: 0, maxScore: 4 },
    },
    {
      name: "[Gatekeeper] empty object -> skipped",
      question: { id: "q4", type: "fill_in_blank", points: 10, correctAnswer: { b1: "x" } },
      studentAnswer: {},
      expected: { status: "skipped", score: 0, maxScore: 10 },
    },

    // -------------------------------------------------------------
    // V2 ALIASES & LOCALIZED EXACT MATCH
    // -------------------------------------------------------------
    {
      name: "[V2 Exact Match] multiple_choice 1-item array input unwrapped -> correct",
      question: { id: "q5", type: "multiple_choice", points: 10, correctAnswer: "opt-b" },
      studentAnswer: ["opt-b"],
      expected: { status: "correct", score: 10, maxScore: 10 },
    },
    {
      name: "[V2 Exact Match] radio alias -> correct",
      question: { id: "q6", type: "radio", points: 5, correctAnswer: "A" },
      studentAnswer: ["A"],
      expected: { status: "correct", score: 5, maxScore: 5 },
    },
    {
      name: "[V2 Localized True/False] localized 'Đúng (True)' vs boolean true -> correct",
      question: { id: "q7", type: "true_false", points: 2, correctAnswer: true },
      studentAnswer: "Đúng (True)",
      expected: { status: "correct", score: 2, maxScore: 2 },
    },
    {
      name: "[V2 Localized True/False] boolean alias -> correct",
      question: { id: "q8", type: "boolean", points: 2, correctAnswer: "true" },
      studentAnswer: true,
      expected: { status: "correct", score: 2, maxScore: 2 },
    },

    // -------------------------------------------------------------
    // V2 MATH & LATEX ALIASES
    // -------------------------------------------------------------
    {
      name: "[V2 Math/LaTeX] math alias strips whitespace -> correct",
      question: { id: "q9", type: "math", points: 5, correctAnswer: "x^2 + y^2 = 1" },
      studentAnswer: "  x ^ 2+y^ 2= 1  ",
      expected: { status: "correct", score: 5, maxScore: 5 },
    },
    {
      name: "[V2 Math/LaTeX] latex alias strips whitespace -> correct",
      question: { id: "q10", type: "latex", points: 5, correctAnswer: "a+b=c" },
      studentAnswer: "a + b = c",
      expected: { status: "correct", score: 5, maxScore: 5 },
    },

    // -------------------------------------------------------------
    // MULTI-SELECT & TEXT
    // -------------------------------------------------------------
    {
      name: "[V2 Multi-Select] checkbox over-selection penalty",
      question: { id: "q11", type: "checkbox", points: 10, correctAnswer: ["A", "B"] },
      studentAnswer: ["A", "B", "C"],
      expected: {
        status: "partial",
        score: 5,
        maxScore: 10,
        metadata: { correctMatches: 2, incorrectMatches: 1, totalCorrect: 2 },
      },
    },
    {
      name: "[V2 Text] short_answer partial match",
      question: { id: "q12", type: "short_answer", points: 10, correctAnswer: "Newton, Gravity, Apple" },
      studentAnswer: "Newton discovered Gravity under an oak tree",
      expected: {
        status: "partial",
        score: 6.67,
        maxScore: 10,
        metadata: { matchedKeywords: 2, totalKeywords: 3 },
      },
    },
  ];

  let passedCount = 0;
  for (const tc of testCases) {
    const result = evaluateAnswer(tc.question, tc.studentAnswer);
    const passed =
      result.status === tc.expected.status &&
      result.score === tc.expected.score &&
      result.maxScore === tc.expected.maxScore &&
      (!tc.expected.metadata ||
        JSON.stringify(result.metadata) === JSON.stringify(tc.expected.metadata));

    if (passed) {
      passedCount++;
      console.log(`✅ PASS: ${tc.name}`);
      console.log(`   -> Result: status=${result.status}, score=${result.score}/${result.maxScore}`);
    } else {
      console.error(`❌ FAIL: ${tc.name}`);
      console.error("   Expected:", JSON.stringify(tc.expected));
      console.error("   Actual  :", JSON.stringify(result));
    }
    console.log("--------------------------------------------------");
  }

  console.log(`\nResults: ${passedCount}/${testCases.length} tests passed.\n`);
  return passedCount === testCases.length;
}

runEvaluateAnswerTests();
