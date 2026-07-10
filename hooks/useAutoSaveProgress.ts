"use client";

import { useEffect, useRef } from "react";
import { doc, updateDoc, serverTimestamp, Firestore } from "firebase/firestore";

export interface UseAutoSaveProgressOptions {
  answers: Record<string, any>;
  totalQuestions: number;
  submissionId: string | null | undefined;
  db: Firestore;
}

/**
 * Universal Real-Time Progress Sync Hook with 1000ms Debounce
 */
export function useAutoSaveProgress({
  answers,
  totalQuestions,
  submissionId,
  db,
}: UseAutoSaveProgressOptions) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Avoid triggering unnecessary save on initial empty mount if no submissionId
    if (!submissionId) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // 1. Calculate Valid Answers Count
    // Null, undefined, empty strings "", and empty arrays [] DO NOT count.
    const validCount = Object.values(answers || {}).filter((val) => {
      if (val === null || val === undefined) return false;

      if (typeof val === "string") {
        return val.trim().length > 0;
      }

      if (Array.isArray(val)) {
        return val.length > 0;
      }

      if (typeof val === "object") {
        // Handle structured answers (e.g., { selectedHash: "A" } or { connections: [...] })
        if (typeof val.selectedHash === "string" && val.selectedHash.trim().length > 0) {
          return true;
        }
        if (Array.isArray(val.selectedHashes) && val.selectedHashes.length > 0) {
          return true;
        }
        if (Array.isArray(val.connections) && val.connections.length > 0) {
          return true;
        }
        if (typeof val.text === "string" && val.text.trim().length > 0) {
          return true;
        }
        if (typeof val.value === "string" && val.value.trim().length > 0) {
          return true;
        }
        // If object has keys with non-empty values
        return Object.keys(val).length > 0;
      }

      return true;
    }).length;

    const progressPercentage =
      totalQuestions > 0
        ? `${Math.round((validCount / totalQuestions) * 100)}%`
        : "0%";

    // 2. Debounce (Anti-Spam) with 1000ms timer
    const timeoutId = setTimeout(async () => {
      try {
        await updateDoc(doc(db, "student_submissions", submissionId), {
          answers,
          progress: progressPercentage,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.warn("Universal Auto-Save Progress Error:", error);
      }
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [answers, totalQuestions, submissionId, db]);
}
