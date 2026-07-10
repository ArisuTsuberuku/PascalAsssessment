"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Wifi, WifiOff } from "lucide-react";

export interface StudentStatsCardProps {
  studentId: string;
  studentName: string;
  status?: string;
  progress?: string;
  score?: string;
  warnings?: number;
  lastActive?: string;
}

function StudentStatsCard({
  studentId,
  studentName,
  status = "Online",
  progress = "0%",
  score = "Đang làm",
  warnings = 0,
}: StudentStatsCardProps) {
  const isOnline = status === "Online" || status === "Active" || status === "Đang làm bài";
  const isDone = status === "Done" || status === "submitted" || status === "Đã nộp";

  // Parse progress numeric percentage for sleek width bar
  const pctNum = parseInt((progress || "0%").replace("%", ""), 10) || 0;

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl hover:border-indigo-500/80 hover:bg-slate-900 transition-all cursor-pointer">
      {/* Top Header: Name + Connection Status */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-sm">
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-white truncate">
                {studentName}
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                ID: {studentId.slice(0, 6)}
              </span>
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
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-400">Tiến độ hoàn thành:</span>
            <span className="text-white">{progress}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isDone
                  ? "bg-emerald-500"
                  : pctNum > 0
                  ? "bg-indigo-500"
                  : "bg-slate-700"
              }`}
              style={{ width: `${Math.max(4, pctNum)}%` }}
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
    prevProps.warnings === nextProps.warnings
  );
});
