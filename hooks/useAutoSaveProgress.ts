"use client";

import { useEffect, useRef } from "react";
import { doc, updateDoc, serverTimestamp, Firestore } from "firebase/firestore";
import { db as defaultDb } from "@/lib/firebase";

export interface UseAutoSaveProgressOptions {
  answers: Record<string, any>;
  annotations?: any[];
  totalQuestions?: number;
  submissionId: string | null | undefined;
  db?: Firestore;
}

/**
 * Universal Real-Time Progress & Annotation Sync Hook with 2000ms Debounce
 * Closure-safe implementation using useRef to prevent stale closures.
 * Supports both object signature ({ answers, submissionId, ... }) and positional (submissionId, answers).
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
  } = options;

  // 1. Bulletproof against stale closures by keeping latest state in refs
  const latestAnswers = useRef(answers);
  const latestAnnotations = useRef(annotations);
  const latestTotalQuestions = useRef(totalQuestions);

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
    // 2. Guard clause: Don't run if no submission doc exists yet
    if (!submissionId) return;

    // 3. Debounce logic (2000ms)
    const timeoutId = setTimeout(async () => {
      try {
        const currentAnswers = latestAnswers.current || {};
        const currentAnnotations = latestAnnotations.current;
        const currentTotal = latestTotalQuestions.current || 0;

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
          answeredCount: validCount,
          progressPercentage,
          currentAnswers,
        });

        const updatePayload: Record<string, any> = {
          answers: currentAnswers,
          progress: progressPercentage,
          lastSavedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (currentAnnotations !== undefined) {
          updatePayload.annotations = currentAnnotations;
        }

        // 4. Push to Firestore
        await updateDoc(
          doc(db, "student_submissions", submissionId),
          updatePayload
        );

        console.log("✅ [Auto-Save] Thành công!");
      } catch (error) {
        console.error("❌ [Auto-Save] Thất bại:", error);
      }
    }, 2000);

    // Cleanup function to reset timeout if answers change before 2s
    return () => clearTimeout(timeoutId);
  }, [answers, annotations, submissionId, db]);
}
