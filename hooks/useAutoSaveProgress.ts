"use client";

import { useEffect, useRef, useCallback } from "react";
import { doc, updateDoc, serverTimestamp, Firestore, arrayUnion } from "firebase/firestore";
import { db as defaultDb } from "@/lib/firebase";
import type { ScoreResult } from "@/lib/calculateScore";
import isEqual from "lodash/isEqual";
import { useAssignmentEditorStore } from "@/store/useAssignmentEditorStore";

export interface UseAutoSaveProgressOptions {
  answers: Record<string, any>;
  annotations?: any[];
  totalQuestions?: number;
  submissionId: string | null | undefined;
  db?: Firestore;
  gradedResult?: ScoreResult | null;
}

/**
 * Universal Real-Time Progress & Annotation Sync Hook with 2000ms Debounce
 * 
 * GROUP MODE SAFETY:
 * - Uses dot notation (`answers.q1`) instead of overwriting the entire `answers` object.
 * - Uses delta sync + arrayUnion for annotations to prevent Last-Write-Wins data loss.
 * - Hydration guard: blocks autosave until the first onSnapshot has hydrated local state.
 * - Anti-ping-pong: onSnapshot hydrations are tracked and excluded from triggering saves.
 */
export function useAutoSaveProgress(
  arg1: UseAutoSaveProgressOptions | string | null | undefined,
  arg2?: Record<string, any>
) {
  const options: UseAutoSaveProgressOptions =
    typeof arg1 === "object" && arg1 !== null && "answers" in arg1
      ? arg1
      : {
          submissionId: arg1 as string | null | undefined,
          answers: arg2 || {},
          totalQuestions: 0,
          db: defaultDb,
        };

  const {
    answers,
    annotations,
    totalQuestions = 0,
    submissionId,
    db = defaultDb,
    gradedResult,
  } = options;

  // Read sessionMode from Zustand store
  const sessionMode = useAssignmentEditorStore((state) => state.sessionMode);

  // 1. Bulletproof against stale closures by keeping latest state in refs
  const latestAnswers = useRef(answers);
  const latestAnnotations = useRef(annotations);
  const latestTotalQuestions = useRef(totalQuestions);
  const latestGradedResult = useRef(gradedResult);

  // Track what was successfully sent to Firebase to prevent infinite loops
  const lastSavedAnswers = useRef<any>(null);
  const lastSavedAnnotations = useRef<any>(null);

  // HYDRATION GUARD: Block autosave until first onSnapshot has fired
  const isHydrated = useRef(false);

  // ANTI-PING-PONG: Flag to skip saves triggered by incoming cloud data
  const isRemoteHydration = useRef(false);

  useEffect(() => {
    latestAnswers.current = answers;
  }, [answers]);

  useEffect(() => {
    latestAnnotations.current = annotations;
  }, [annotations]);

  useEffect(() => {
    latestTotalQuestions.current = totalQuestions;
  }, [totalQuestions]);

  useEffect(() => {
    latestGradedResult.current = gradedResult;
  }, [gradedResult]);

  /**
   * Called by external onSnapshot listeners to mark hydration complete.
   * This allows autosave to start running.
   */
  const markHydrated = useCallback(() => {
    isHydrated.current = true;
  }, []);

  /**
   * Called by external onSnapshot listeners to temporarily suppress autosave
   * while remote data is being written into local Zustand state.
   */
  const setRemoteHydrating = useCallback((val: boolean) => {
    isRemoteHydration.current = val;
  }, []);

  useEffect(() => {
    // 2. Guard clause: Don't run if no submission doc exists yet
    if (!submissionId) return;

    // 3. Debounce logic (2000ms)
    const timeoutId = setTimeout(async () => {
      try {
        // HYDRATION GUARD: Don't save until cloud data has been loaded first
        if (!isHydrated.current) {
          console.log("⏳ [Auto-Save] Skipped: Waiting for initial hydration from onSnapshot...");
          return;
        }

        // ANTI-PING-PONG: Don't save if this render was triggered by incoming cloud data
        if (isRemoteHydration.current) {
          console.log("⏳ [Auto-Save] Skipped: Remote hydration in progress (anti-ping-pong).");
          return;
        }

        const currentAnswers = latestAnswers.current || {};
        const currentAnnotations = latestAnnotations.current;
        const currentTotal = latestTotalQuestions.current || 0;

        // DEEP EQUALITY CHECK: Prevent Infinite Write Loop from remote Hydration
        if (
          isEqual(currentAnswers, lastSavedAnswers.current) &&
          isEqual(currentAnnotations, lastSavedAnnotations.current)
        ) {
          return; // Abort sync if no changes were made
        }

        // Calculate Valid Answers Count
        const validCount = Object.values(currentAnswers).filter((val) => {
          if (val === null || val === undefined) return false;
          if (typeof val === "string") return val.trim().length > 0;
          if (Array.isArray(val)) return val.length > 0;
          if (typeof val === "object") {
            if (typeof val.selectedHash === "string" && val.selectedHash.trim().length > 0) return true;
            if (Array.isArray(val.selectedHashes) && val.selectedHashes.length > 0) return true;
            if (Array.isArray(val.connections) && val.connections.length > 0) return true;
            if (typeof val.text === "string" && val.text.trim().length > 0) return true;
            if (typeof val.value === "string" && val.value.trim().length > 0) return true;
            return Object.keys(val).length > 0;
          }
          return true;
        }).length;

        const progressPercentage =
          currentTotal > 0
            ? `${Math.round((validCount / currentTotal) * 100)}%`
            : "0%";

        console.log("⏳ [Auto-Save] Đang đẩy dữ liệu lên Firebase...", {
          submissionId,
          mode: sessionMode,
          answeredCount: validCount,
          progressPercentage,
        });

        const updatePayload: Record<string, any> = {
          progress: progressPercentage,
          lastSavedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // ═══════════════════════════════════════════════════
        // ANSWERS: Group mode uses DOT NOTATION to prevent overwrites
        // ═══════════════════════════════════════════════════
        if (sessionMode === "group") {
          // DOT NOTATION: answers.q1 = value, answers.q2 = value
          // This prevents Student A from overwriting Student B's answer
          for (const [key, value] of Object.entries(currentAnswers)) {
            updatePayload[`answers.${key}`] = value;
          }
        } else {
          // Individual mode: safe to overwrite entire object (only 1 writer)
          updatePayload.answers = currentAnswers;
        }

        // ═══════════════════════════════════════════════════
        // ANNOTATIONS: Group mode uses DELTA SYNC + arrayUnion
        // ═══════════════════════════════════════════════════
        if (currentAnnotations !== undefined) {
          if (sessionMode === "group") {
            // DELTA SYNC: Find new annotations not in the last saved batch
            const previousIds = new Set(
              (lastSavedAnnotations.current || []).map((a: any) => a.id)
            );
            const newStrokes = currentAnnotations.filter(
              (a: any) => a.id && !previousIds.has(a.id)
            );

            if (newStrokes.length > 0) {
              // Use arrayUnion to APPEND without overwriting existing ones
              updatePayload.annotations = arrayUnion(...newStrokes);
              updatePayload.studentAnnotations = arrayUnion(...newStrokes);
              console.log(`🎨 [Delta Sync] Appending ${newStrokes.length} new strokes via arrayUnion`);
            }
            // If no new strokes, don't touch annotations at all (safe!)
          } else {
            // Individual mode: safe to overwrite entire array
            updatePayload.annotations = currentAnnotations;
            updatePayload.studentAnnotations = currentAnnotations;
          }
        }

        // Include grading results if available
        const currentGraded = latestGradedResult.current;
        if (currentGraded) {
          updatePayload.score = `${currentGraded.totalScore}/${currentGraded.maxScore}`;
          updatePayload.percentage = currentGraded.percentage;
          updatePayload.gradedAnswers = currentGraded.gradedAnswers;
        }

        // 4. Push to Firestore
        await updateDoc(
          doc(db, "student_submissions", submissionId),
          updatePayload
        );

        // Track what was saved to prevent future loops
        lastSavedAnswers.current = currentAnswers;
        lastSavedAnnotations.current = currentAnnotations;

        console.log("✅ [Auto-Save] Thành công!");
      } catch (error) {
        console.error("❌ [Auto-Save] Thất bại:", error);
      }
    }, 2000);

    // Cleanup function to reset timeout if answers change before 2s
    return () => clearTimeout(timeoutId);
  }, [answers, annotations, submissionId, db, gradedResult, sessionMode]);

  // Export hydration controls for external consumers
  return { markHydrated, setRemoteHydrating, isHydrated };
}
