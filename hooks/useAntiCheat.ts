"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { doc, updateDoc, serverTimestamp, Firestore } from "firebase/firestore";
import { db as defaultDb } from "@/lib/firebase";

export interface CheatLogs {
  blurCount: number;
  tabSwitchCount: number;
  copyAttempts: number;
  pasteAttempts: number;
  rightClickAttempts: number;
  logs: { type: string; timestamp: number }[];
}

const INITIAL_CHEAT_LOGS: CheatLogs = {
  blurCount: 0,
  tabSwitchCount: 0,
  copyAttempts: 0,
  pasteAttempts: 0,
  rightClickAttempts: 0,
  logs: [],
};

/**
 * Anti-Cheat Engine Hook
 * Monitors tab switching, window blur, right-click, paste, and keyboard shortcuts.
 * Auto-syncs violations to Firestore student_submissions with 3s debounce.
 */
export function useAntiCheat(
  submissionId: string | null | undefined,
  database?: Firestore
) {
  const db = database || defaultDb;
  const [cheatLogs, setCheatLogs] = useState<CheatLogs>(INITIAL_CHEAT_LOGS);
  const logsRef = useRef<CheatLogs>(INITIAL_CHEAT_LOGS);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    logsRef.current = cheatLogs;
  }, [cheatLogs]);

  // Debounced Firestore sync (3 seconds)
  const scheduleSyncToFirestore = useCallback(() => {
    if (!submissionId) return;
    isDirtyRef.current = true;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      if (!isDirtyRef.current) return;
      try {
        const currentLogs = logsRef.current;
        await updateDoc(doc(db, "student_submissions", submissionId), {
          cheatLogs: {
            blurCount: currentLogs.blurCount,
            tabSwitchCount: currentLogs.tabSwitchCount,
            copyAttempts: currentLogs.copyAttempts,
            pasteAttempts: currentLogs.pasteAttempts,
            rightClickAttempts: currentLogs.rightClickAttempts,
          },
          warnings:
            currentLogs.tabSwitchCount + currentLogs.blurCount,
          updatedAt: serverTimestamp(),
        });
        isDirtyRef.current = false;
        console.log("🛡️ [Anti-Cheat] Synced violations to Firestore");
      } catch (err) {
        console.error("🛡️ [Anti-Cheat] Sync failed:", err);
      }
    }, 3000);
  }, [submissionId, db]);

  // Record a violation
  const recordViolation = useCallback(
    (type: string) => {
      setCheatLogs((prev) => {
        const updated = { ...prev };
        const logEntry = { type, timestamp: Date.now() };

        switch (type) {
          case "tab_switch":
            updated.tabSwitchCount = prev.tabSwitchCount + 1;
            break;
          case "blur":
            updated.blurCount = prev.blurCount + 1;
            break;
          case "copy":
            updated.copyAttempts = prev.copyAttempts + 1;
            break;
          case "paste":
            updated.pasteAttempts = prev.pasteAttempts + 1;
            break;
          case "right_click":
            updated.rightClickAttempts = prev.rightClickAttempts + 1;
            break;
        }

        // Keep only last 50 log entries to avoid bloat
        updated.logs = [...prev.logs, logEntry].slice(-50);
        return updated;
      });
      scheduleSyncToFirestore();
    },
    [scheduleSyncToFirestore]
  );

  useEffect(() => {
    if (!submissionId) return;

    // 1. Tab visibility change (most reliable tab-switch detection)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation("tab_switch");
        console.warn("🛡️ [Anti-Cheat] Tab switch detected!");
      }
    };

    // 2. Window blur (leaving browser window entirely)
    const handleBlur = () => {
      if (!document.hidden) {
        recordViolation("blur");
        console.warn("🛡️ [Anti-Cheat] Window blur detected!");
      }
    };

    // 3. Right-click prevention
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      recordViolation("right_click");
      console.warn("🛡️ [Anti-Cheat] Right-click blocked!");
    };

    // 4. Paste prevention
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation("paste");
      console.warn("🛡️ [Anti-Cheat] Paste blocked!");
    };

    // 5. Keyboard shortcut blocking (Ctrl+C, Ctrl+V, Ctrl+A, PrintScreen)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        recordViolation("copy");
      }

      if (isCtrl && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        recordViolation("paste");
      }

      if (isCtrl && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
      }

      if (e.key === "PrintScreen") {
        e.preventDefault();
        recordViolation("copy");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("keydown", handleKeyDown);

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [submissionId, recordViolation]);

  const totalWarnings = cheatLogs.tabSwitchCount + cheatLogs.blurCount;

  return { cheatLogs, totalWarnings };
}
