"use client";

import React from "react";
import { AlertTriangle, ShieldAlert, Eye } from "lucide-react";
import type { GradedAnswer } from "@/lib/calculateScore";
import type { Item } from "@/types/assignment";

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
}

interface QuestionGridOverviewProps {
  students: GridStudentData[];
  assignmentItems: Item[];
  onSelectStudent: (student: GridStudentData) => void;
}

/**
 * Determines the cell color based on grading status
 */
function getCellColorClass(
  itemId: string,
  student: GridStudentData
): string {
  const answer = student.answers?.[itemId];
  const graded = student.gradedAnswers?.[itemId];

  // If graded, use grading status
  if (graded) {
    switch (graded.status) {
      case "correct":
        return "bg-emerald-500/70 border-emerald-400/50";
      case "incorrect":
        return "bg-rose-500/70 border-rose-400/50";
      case "partial":
        return "bg-amber-500/60 border-amber-400/50";
      case "ungraded":
        return "bg-purple-500/50 border-purple-400/40";
      case "skipped":
        return "bg-slate-700/50 border-slate-600/30";
      default:
        return "bg-slate-700/50 border-slate-600/30";
    }
  }

  // Not graded yet: check if answer exists
  if (answer !== undefined && answer !== null && answer !== "") {
    // Check if answer is "empty" (empty string, empty array, or empty object)
    if (typeof answer === "string" && answer.trim().length === 0) {
      return "bg-slate-700/50 border-slate-600/30"; // Grey: no real answer
    }
    if (typeof answer === "object") {
      if (Array.isArray(answer) && answer.length === 0) {
        return "bg-slate-700/50 border-slate-600/30";
      }
      // Check for selectedHash or other valid fields
      if (answer.selectedHash || answer.selectedHashes?.length > 0 || answer.text || answer.value || answer.connections?.length > 0) {
        return "bg-blue-500/60 border-blue-400/50"; // Blue: attempted
      }
      if (Object.keys(answer).length > 0) {
        return "bg-blue-500/60 border-blue-400/50"; // Blue: attempted
      }
    }
    return "bg-blue-500/60 border-blue-400/50"; // Blue: attempted
  }

  return "bg-slate-700/50 border-slate-600/30"; // Grey: not started
}

/**
 * Get cell tooltip text
 */
function getCellTooltip(
  itemId: string,
  itemName: string,
  student: GridStudentData
): string {
  const graded = student.gradedAnswers?.[itemId];
  if (graded) {
    const statusMap: Record<string, string> = {
      correct: "✅ Đúng",
      incorrect: "❌ Sai",
      partial: "🟡 Đúng một phần",
      ungraded: "📝 Chờ chấm thủ công",
      skipped: "⬜ Bỏ qua",
    };
    return `${itemName}: ${statusMap[graded.status] || graded.status} (${graded.earnedPoints}/${graded.maxPoints} điểm)`;
  }

  const answer = student.answers?.[itemId];
  if (answer !== undefined && answer !== null) return `${itemName}: Đã trả lời (chưa chấm)`;
  return `${itemName}: Chưa làm`;
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-slate-800 bg-slate-900/80">
        <span className="text-xs font-semibold text-slate-400">Chú thích:</span>
        <div className="flex items-center gap-3 flex-wrap">
          <LegendDot color="bg-slate-700/50" label="Chưa làm" />
          <LegendDot color="bg-blue-500/60" label="Đã trả lời" />
          <LegendDot color="bg-emerald-500/70" label="Đúng" />
          <LegendDot color="bg-rose-500/70" label="Sai" />
          <LegendDot color="bg-amber-500/60" label="Đúng 1 phần" />
          <LegendDot color="bg-purple-500/50" label="Chờ chấm" />
        </div>
      </div>

      {/* Scrollable Grid */}
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)]">
        <table className="w-full border-collapse text-xs">
          {/* Header Row */}
          <thead>
            <tr className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm">
              <th className="sticky left-0 z-20 bg-slate-900/95 backdrop-blur-sm text-left px-4 py-2.5 border-b border-r border-slate-800 min-w-[200px]">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Học sinh
                </span>
              </th>
              {assignmentItems.map((item, idx) => (
                <th
                  key={item.id}
                  className="px-1.5 py-2.5 border-b border-slate-800 text-center min-w-[36px]"
                  title={item.name || `Câu ${idx + 1}`}
                >
                  <span className="font-bold text-slate-400">
                    Q{idx + 1}
                  </span>
                </th>
              ))}
              <th className="px-3 py-2.5 border-b border-l border-slate-800 text-center min-w-[80px]">
                <span className="font-bold text-slate-300 uppercase tracking-wide">Điểm</span>
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
                  className="group cursor-pointer hover:bg-slate-800/50 transition-colors"
                >
                  {/* Student Name Cell (Sticky) */}
                  <td className="sticky left-0 z-10 bg-slate-900/95 group-hover:bg-slate-800/80 backdrop-blur-sm px-4 py-2 border-b border-r border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-[10px]">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-white truncate max-w-[120px]">
                        {displayName}
                      </span>

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
                      title={getCellTooltip(item.id, item.name || `Câu ${idx + 1}`, student)}
                    >
                      <div
                        className={`mx-auto h-6 w-6 rounded-md border transition-all ${getCellColorClass(
                          item.id,
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
                          : student.score
                          ? "text-slate-300"
                          : "text-slate-500"
                      }`}
                    >
                      {student.score || "—"}
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
