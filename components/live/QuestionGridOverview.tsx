"use client";

import React from "react";
import { AlertTriangle, ShieldAlert, Eye } from "lucide-react";
import type { GradedAnswer } from "@/lib/calculateScore";
import type { Item } from "@/types/assignment";
import { evaluateAnswer } from "@/lib/evaluateAnswer";

export interface GridStudentData {
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
  needsHelp?: boolean;
}

interface QuestionGridOverviewProps {
  students: GridStudentData[];
  assignmentItems: Item[];
  onSelectStudent: (student: GridStudentData) => void;
  onDismissRaiseHand?: (studentId: string, e?: React.MouseEvent) => void;
}

/**
 * Determines the cell color based strictly on evaluateAnswer engine status (on the fly)
 */
function getCellColorClass(
  item: Item,
  student: GridStudentData
): string {
  const rawAnswer = student.answers?.[item.id];
  const gradingResult = evaluateAnswer(item, rawAnswer);

  switch (gradingResult.status) {
    case "correct":
      return "bg-emerald-500/70 border-emerald-400/50";
    case "incorrect":
      return "bg-rose-500/70 border-rose-400/50";
    case "partial":
      return "bg-amber-500/60 border-amber-400/50";
    case "needs_grading":
      return "bg-purple-500/50 border-purple-400/40";
    case "skipped":
    default:
      return "bg-slate-700/50 border-slate-600/30";
  }
}

/**
 * Get cell tooltip text strictly using evaluateAnswer engine (on the fly)
 */
function getCellTooltip(
  item: Item,
  idx: number,
  student: GridStudentData
): string {
  const rawAnswer = student.answers?.[item.id];
  const gradingResult = evaluateAnswer(item, rawAnswer);

  const maxPts =
    item.points ||
    (item as any).maxScore ||
    gradingResult.maxScore ||
    1;
  const itemName = item.name || `Câu ${idx + 1}`;

  const statusMap: Record<string, string> = {
    correct: "✅ Đúng",
    incorrect: "❌ Sai",
    partial: "🟡 Đúng một phần",
    needs_grading: "📝 Chờ chấm thủ công",
    skipped: "⬜ Bỏ qua",
  };

  return `${itemName}: ${
    statusMap[gradingResult.status] || gradingResult.status
  } (${gradingResult.score}/${maxPts} điểm)`;
}

function calculateStudentTotalScore(
  student: GridStudentData,
  assignmentItems: Item[]
): number {
  let total = 0;
  for (const item of assignmentItems) {
    const rawAns = student.answers?.[item.id];
    const gradingResult = evaluateAnswer(item, rawAns);
    total += gradingResult.score;
  }
  return Number(total.toFixed(2));
}

/**
 * Anti-cheat severity level
 */
function getCheatSeverity(student: GridStudentData): "none" | "low" | "high" {
  const tabSwitches = student.cheatLogs?.tabSwitchCount ?? student.warnings ?? 0;
  if (tabSwitches > 3) return "high";
  if (tabSwitches > 0) return "low";
  return "none";
}

export default function QuestionGridOverview({
  students,
  assignmentItems,
  onSelectStudent,
  onDismissRaiseHand,
}: QuestionGridOverviewProps) {
  if (assignmentItems.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
        <p className="text-sm text-slate-400">
          Chưa có dữ liệu câu hỏi để hiển thị lưới.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white overflow-hidden shadow-xl">
      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-emerald-100 bg-emerald-50/60">
        <span className="text-xs font-semibold text-slate-600">Chú thích:</span>
        <div className="flex items-center gap-3 flex-wrap">
          <LegendDot color="bg-slate-200" label="Chưa làm" />
          <LegendDot color="bg-blue-500" label="Đã trả lời" />
          <LegendDot color="bg-emerald-500" label="Đúng" />
          <LegendDot color="bg-rose-500" label="Sai" />
          <LegendDot color="bg-amber-500" label="Đúng 1 phần" />
          <LegendDot color="bg-purple-500" label="Chờ chấm" />
        </div>
      </div>

      {/* Scrollable Grid */}
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)]">
        <table className="w-full border-collapse text-xs">
          {/* Header Row */}
          <thead>
            <tr className="sticky top-0 z-10 bg-emerald-100 text-emerald-900">
              <th className="sticky left-0 z-20 bg-emerald-100 text-emerald-900 text-left px-4 py-2.5 border-b border-r border-emerald-200 min-w-[200px]">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                  Học sinh
                </span>
              </th>
              {assignmentItems.map((item, idx) => (
                <th
                  key={item.id}
                  className="px-1.5 py-2.5 border-b border-emerald-200 text-center min-w-[36px]"
                  title={item.name || `Câu ${idx + 1}`}
                >
                  <span className="font-bold text-emerald-900">
                    Q{idx + 1}
                  </span>
                </th>
              ))}
              <th className="px-3 py-2.5 border-b border-l border-emerald-200 text-center min-w-[80px]">
                <span className="font-bold text-emerald-900 uppercase tracking-wide">Điểm</span>
              </th>
            </tr>
          </thead>

          {/* Student Rows */}
          <tbody>
            {students.map((student) => {
              const displayName =
                student.studentName ||
                student.name ||
                student.fullName ||
                `HS #${student.id.slice(0, 4)}`;
              const cheatSeverity = getCheatSeverity(student);
              const isDone =
                student.status === "submitted" || student.status === "Đã nộp";

              return (
                <tr
                  key={student.id}
                  onClick={() => onSelectStudent(student)}
                  className="group cursor-pointer hover:bg-emerald-50 transition-colors"
                >
                  {/* Student Name Cell (Sticky) */}
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-emerald-50 px-4 py-2 border-b border-r border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                        {displayName}
                      </span>

                      {/* Raise Hand Indicator */}
                      {student.needsHelp && (
                        <button
                          onClick={(e) => onDismissRaiseHand?.(student.id, e)}
                          className="ml-0.5 animate-pulse text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] hover:scale-110 transition-transform"
                          title="Click để tắt thông báo gọi hỗ trợ"
                        >
                          ✋
                        </button>
                      )}

                      {/* Anti-Cheat Alert Icon */}
                      {cheatSeverity === "low" && (
                        <span title={`Rời tab ${student.cheatLogs?.tabSwitchCount ?? student.warnings} lần`}>
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                        </span>
                      )}
                      {cheatSeverity === "high" && (
                        <span
                          className="animate-pulse"
                          title={`⚠️ Rời tab ${student.cheatLogs?.tabSwitchCount ?? student.warnings} lần!`}
                        >
                          <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                        </span>
                      )}

                      {/* Status Badge */}
                      {isDone && (
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                          Nộp
                        </span>
                      )}

                      {/* Hover eye icon */}
                      <Eye className="h-3.5 w-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
                    </div>
                  </td>

                  {/* Question Status Cells */}
                  {assignmentItems.map((item, idx) => (
                    <td
                      key={item.id}
                      className="px-0.5 py-1 border-b border-slate-800/50 text-center"
                      title={getCellTooltip(item, idx, student)}
                    >
                      <div
                        className={`mx-auto h-6 w-6 rounded-md border transition-all ${getCellColorClass(
                          item,
                          student
                        )} group-hover:scale-110`}
                      />
                    </td>
                  ))}

                  {/* Score Column */}
                  <td className="px-3 py-2 border-b border-l border-slate-800/50 text-center">
                    <span
                      className={`font-bold ${
                        isDone
                          ? "text-indigo-300"
                          : "text-slate-300"
                      }`}
                    >
                      {calculateStudentTotalScore(student, assignmentItems)}đ
                    </span>
                    {student.percentage !== undefined && (
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        {student.percentage}%
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Legend dot helper */
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-3 w-3 rounded-sm border border-slate-600/30 ${color}`} />
      <span className="text-[10px] text-slate-400">{label}</span>
    </div>
  );
}
