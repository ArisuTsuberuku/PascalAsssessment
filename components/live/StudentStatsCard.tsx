"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Wifi, WifiOff, Users } from "lucide-react";

export interface StudentStatsCardProps {
  studentId: string;
  studentName: string;
  status?: string;
  progress?: string;
  score?: string;
  warnings?: number;
  lastActive?: string;
  answeredCount?: number;
  totalQuestions?: number;
  answers?: Record<string, any>;
  needsHelp?: boolean;
  onDismissRaiseHand?: (e?: React.MouseEvent) => void;
  mode?: "individual" | "group";
  teamName?: string | null;
  members?: Array<{ studentId: string; name: string; joinedAt?: string }>;
}

function StudentStatsCard({
  studentId,
  studentName,
  status = "Online",
  progress = "0%",
  score = "Đang làm",
  warnings = 0,
  answeredCount,
  totalQuestions,
  answers,
  needsHelp,
  onDismissRaiseHand,
  mode = "individual",
  teamName,
  members = [],
}: StudentStatsCardProps) {
  const isOnline =
    status === "Online" || status === "Active" || status === "Đang làm bài";
  const isDone =
    status === "Done" || status === "submitted" || status === "Đã nộp";

  const count =
    answeredCount !== undefined
      ? answeredCount
      : answers
      ? Object.keys(answers).length
      : 0;

  const progressPercent =
    totalQuestions && totalQuestions > 0
      ? Math.round((count / totalQuestions) * 100)
      : parseInt((progress || "0%").replace("%", ""), 10) || 0;

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border bg-slate-900/90 p-4 shadow-xl transition-all cursor-pointer ${
        needsHelp
          ? "border-red-500 bg-red-950/20 shadow-red-500/20 animate-pulse"
          : "border-slate-800 hover:border-indigo-500/80 hover:bg-slate-900"
      }`}
    >
      {/* Top Header: Name + Connection Status */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-sm">
              {mode === "group" ? (
                <Users className="h-4 w-4" />
              ) : (
                studentName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-white truncate flex items-center gap-1.5">
                <span>{mode === "group" && teamName ? teamName : studentName}</span>
                {mode === "group" && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30">
                    👥 {members.length || 1} HS
                  </span>
                )}
                {needsHelp && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismissRaiseHand?.(e);
                    }}
                    className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-bounce shadow-md shadow-red-500/40 transition-colors"
                    title="Click để tắt thông báo gọi hỗ trợ!"
                  >
                    ✋ Cần hỗ trợ
                  </button>
                )}
              </h3>
              {mode === "group" && members.length > 0 ? (
                <div className="text-[11px] text-slate-400 truncate">
                  {members.map((m) => m.name).join(", ")}
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 font-mono">
                  ID: {studentId.slice(0, 6)}
                </span>
              )}
            </div>
          </div>

          {/* Connection Status Badge */}
          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0 ${
              isDone
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : isOnline
                ? "bg-green-500/15 text-green-400 border border-green-500/30"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            {isDone ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : isOnline ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            <span>{isDone ? "Đã nộp" : isOnline ? "Online" : "Offline"}</span>
          </div>
        </div>

        {/* CRUCIAL: Anti-Cheat Warning Badge */}
        {warnings > 0 && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 animate-pulse">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>⚠️ Rời khỏi tab {warnings} lần</span>
          </div>
        )}
      </div>

      {/* Middle: Progress Bar & Score Stats */}
      <div className="space-y-3 mt-2">
        <div>
          <div className="flex justify-between items-center mb-1 text-xs font-semibold">
            <span className="text-slate-400">Tiến độ hoàn thành:</span>
            <span className="text-white font-bold">
              {progressPercent}%
              {totalQuestions && totalQuestions > 0
                ? ` (${count}/${totalQuestions})`
                : ""}
            </span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ease-out ${
                isDone
                  ? "bg-emerald-500"
                  : progressPercent > 0
                  ? "bg-indigo-500"
                  : "bg-slate-700"
              }`}
              style={{
                width: `${Math.max(
                  progressPercent > 0 ? 4 : 0,
                  progressPercent
                )}%`,
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs">
          <span className="text-slate-400">Tạm tính:</span>
          <span className="font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            {score}
          </span>
        </div>
      </div>

      {/* Hover Prompt */}
      <div className="absolute inset-0 rounded-2xl bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
        <span className="rounded-xl bg-slate-900/95 border border-indigo-500/50 px-3 py-1.5 text-xs font-semibold text-white shadow-xl">
          👁️ Xem livestream 1-on-1 →
        </span>
      </div>
    </div>
  );
}

export default React.memo(StudentStatsCard, (prevProps, nextProps) => {
  return (
    prevProps.studentId === nextProps.studentId &&
    prevProps.studentName === nextProps.studentName &&
    prevProps.status === nextProps.status &&
    prevProps.progress === nextProps.progress &&
    prevProps.score === nextProps.score &&
    prevProps.warnings === nextProps.warnings &&
    prevProps.mode === nextProps.mode &&
    prevProps.teamName === nextProps.teamName &&
    prevProps.members?.length === nextProps.members?.length
  );
});
