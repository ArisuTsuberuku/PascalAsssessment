"use client";

import React from "react";
import {
  X,
  Eye,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  MinusCircle,
  HelpCircle,
  SkipForward,
} from "lucide-react";
import dynamic from "next/dynamic";
import type { Assignment, Item } from "@/types/assignment";
import type { GradedAnswer } from "@/lib/calculateScore";

const PdfCanvasWrapper = dynamic(
  () => import("@/components/canvas/PdfCanvasWrapper"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-12 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    ),
  }
);

export interface StudentFocusData {
  id: string;
  studentName?: string;
  name?: string;
  fullName?: string;
  status?: string;
  answers?: Record<string, any>;
  gradedAnswers?: Record<string, GradedAnswer>;
  cheatLogs?: {
    blurCount: number;
    tabSwitchCount: number;
    copyAttempts?: number;
    pasteAttempts?: number;
    rightClickAttempts?: number;
  };
  warnings?: number;
  score?: string;
  percentage?: number;
  progress?: string;
}

interface StudentFocusViewProps {
  student: StudentFocusData;
  assignment: Assignment | null;
  assignmentItems: Item[];
  onClose: () => void;
}

function getStatusIcon(status?: string) {
  switch (status) {
    case "correct":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
    case "incorrect":
      return <XCircle className="h-3.5 w-3.5 text-rose-400" />;
    case "partial":
      return <MinusCircle className="h-3.5 w-3.5 text-amber-400" />;
    case "ungraded":
      return <HelpCircle className="h-3.5 w-3.5 text-purple-400" />;
    case "skipped":
      return <SkipForward className="h-3.5 w-3.5 text-slate-500" />;
    default:
      return <SkipForward className="h-3.5 w-3.5 text-slate-500" />;
  }
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "correct":
      return "Đúng";
    case "incorrect":
      return "Sai";
    case "partial":
      return "Đúng 1 phần";
    case "ungraded":
      return "Chờ chấm";
    case "skipped":
      return "Bỏ qua";
    default:
      return "—";
  }
}

function getStatusColorClass(status?: string) {
  switch (status) {
    case "correct":
      return "text-emerald-400";
    case "incorrect":
      return "text-rose-400";
    case "partial":
      return "text-amber-400";
    case "ungraded":
      return "text-purple-400";
    default:
      return "text-slate-500";
  }
}

export default function StudentFocusView({
  student,
  assignment,
  assignmentItems,
  onClose,
}: StudentFocusViewProps) {
  const displayName =
    student.studentName ||
    student.name ||
    student.fullName ||
    student.id;

  const tabSwitches =
    student.cheatLogs?.tabSwitchCount ?? student.warnings ?? 0;
  const blurCount = student.cheatLogs?.blurCount ?? 0;
  const copyAttempts = student.cheatLogs?.copyAttempts ?? 0;
  const pasteAttempts = student.cheatLogs?.pasteAttempts ?? 0;
  const rightClicks = student.cheatLogs?.rightClickAttempts ?? 0;
  const totalViolations =
    tabSwitches + blurCount + copyAttempts + pasteAttempts + rightClicks;

  const isDone =
    student.status === "submitted" || student.status === "Đã nộp";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col overflow-hidden animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-3 shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
            <Eye className="h-3.5 w-3.5" />
            FOCUS VIEW
          </span>
          <h2 className="text-base font-bold text-white">
            Bài làm:{" "}
            <span className="text-purple-400">{displayName}</span>
          </h2>

          {/* Status Badge */}
          {isDone && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
              ✅ Đã nộp
            </span>
          )}

          {/* Score */}
          {student.score && (
            <span className="text-xs text-slate-400">
              Điểm:{" "}
              <strong className="text-indigo-300">{student.score}</strong>
              {student.percentage !== undefined && (
                <span className="text-slate-500 ml-1">
                  ({student.percentage}%)
                </span>
              )}
            </span>
          )}

          {/* Anti-cheat Warning */}
          {totalViolations > 0 && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                tabSwitches > 3
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/30"
              }`}
            >
              {tabSwitches > 3 ? (
                <ShieldAlert className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {totalViolations} vi phạm
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-rose-600 hover:border-rose-500 hover:text-white transition-all shadow"
        >
          <X className="h-4 w-4" />
          <span>Đóng</span>
        </button>
      </div>

      {/* Main Content: PDF + Info Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Viewer (Main Area) */}
        <div className="flex-1 relative w-full h-full overflow-hidden bg-slate-800">
          {assignment ? (
            <PdfCanvasWrapper
              fileUrl={assignment.pdfUrl}
              initialData={assignment}
              liveStudentData={student}
              isPreviewMode={true}
              isLiveMonitor={true}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 text-sm">
              Đang tải PDF...
            </div>
          )}
        </div>

        {/* Info Sidebar (Right Panel) */}
        <div className="w-72 shrink-0 border-l border-slate-800 bg-slate-900/95 overflow-y-auto">
          {/* Question Status List */}
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3">
              Trạng thái câu hỏi
            </h3>
            <div className="space-y-1.5">
              {assignmentItems.map((item, idx) => {
                const graded = student.gradedAnswers?.[item.id];
                const hasAnswer = student.answers?.[item.id] !== undefined;

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="text-[10px] font-mono text-slate-500 w-5 text-right shrink-0">
                      {idx + 1}
                    </span>
                    {getStatusIcon(graded?.status || (hasAnswer ? "ungraded" : undefined))}
                    <span className="text-xs text-slate-300 truncate flex-1">
                      {item.name || `Câu ${idx + 1}`}
                    </span>
                    {graded && (
                      <span
                        className={`text-[10px] font-bold ${getStatusColorClass(
                          graded.status
                        )}`}
                      >
                        {graded.earnedPoints}/{graded.maxPoints}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Anti-Cheat Violations Detail */}
          <div className="p-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              Anti-Cheat Log
            </h3>

            {totalViolations === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Không phát hiện vi phạm ✅
              </p>
            ) : (
              <div className="space-y-2">
                <ViolationRow
                  label="Chuyển tab"
                  count={tabSwitches}
                  severity={tabSwitches > 3 ? "high" : tabSwitches > 0 ? "low" : "none"}
                />
                <ViolationRow
                  label="Rời cửa sổ"
                  count={blurCount}
                  severity={blurCount > 3 ? "high" : blurCount > 0 ? "low" : "none"}
                />
                <ViolationRow
                  label="Copy (Ctrl+C)"
                  count={copyAttempts}
                  severity={copyAttempts > 0 ? "low" : "none"}
                />
                <ViolationRow
                  label="Paste (Ctrl+V)"
                  count={pasteAttempts}
                  severity={pasteAttempts > 0 ? "low" : "none"}
                />
                <ViolationRow
                  label="Chuột phải"
                  count={rightClicks}
                  severity={rightClicks > 0 ? "low" : "none"}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Single violation row in the sidebar */
function ViolationRow({
  label,
  count,
  severity,
}: {
  label: string;
  count: number;
  severity: "none" | "low" | "high";
}) {
  if (count === 0) return null;
  return (
    <div
      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs ${
        severity === "high"
          ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
          : "bg-amber-500/10 border-amber-500/30 text-amber-300"
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className="font-bold">{count}x</span>
    </div>
  );
}
