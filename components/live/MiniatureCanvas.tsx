"use client";

import React from "react";
import { CheckCircle2, Clock, FileText, User } from "lucide-react";

export interface MiniatureCanvasProps {
  studentId: string;
  studentName: string;
  liveState?: Record<string, any>;
  progress?: string;
  score?: string;
  status?: string;
}

function MiniatureCanvas({
  studentId,
  studentName,
  liveState = {},
  progress = "0%",
  score = "Đang làm",
  status = "Active",
}: MiniatureCanvasProps) {
  const answerKeys = Object.keys(liveState || {});
  const isDone =
    status === "Done" || status === "submitted" || status === "Đã nộp";

  return (
    <div className="group relative flex flex-col rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl hover:border-indigo-500/60 transition-all cursor-pointer">
      {/* Student Name Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-xs text-white truncate">
            {studentName}
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 ${
            isDone
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
              : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
          }`}
        >
          {isDone ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <Clock className="h-3 w-3" />
          )}
          <span>{isDone ? "Đã nộp" : "Live"}</span>
        </span>
      </div>

      {/* Miniature CSS Scaled Document View (Classkick-style Thumbnail) */}
      <div className="relative w-full aspect-[1/1.2] overflow-hidden bg-slate-950 p-2">
        <div
          className="origin-top-left absolute top-2 left-2 pointer-events-none rounded-lg border border-slate-700/80 bg-slate-900 p-6 shadow-inner"
          style={{
            transform: "scale(0.24)",
            width: "400%",
            height: "400%",
          }}
        >
          {/* Simulated Document Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <FileText className="h-10 w-10 text-purple-400" />
              <div>
                <div className="h-6 w-64 rounded bg-slate-700 mb-2"></div>
                <div className="h-4 w-40 rounded bg-slate-800"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="h-5 w-32 rounded bg-slate-800"></div>
            </div>
          </div>

          {/* Simulated Questions / Answers Grid based on real liveState */}
          <div className="grid grid-cols-2 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => {
              const hasAnswer = answerKeys.length > idx;
              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-4 flex flex-col justify-between h-36 ${
                    hasAnswer
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-slate-800 bg-slate-950/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-400">
                      Câu {idx + 1}
                    </span>
                    {hasAnswer && (
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-bold text-emerald-400">
                        Đã làm
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 mt-3">
                    <div className="h-3 w-full rounded bg-slate-800"></div>
                    <div className="h-3 w-3/4 rounded bg-slate-800"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hover Overlay Prompt */}
        <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="rounded-xl bg-slate-900/95 border border-indigo-500/40 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
            Xem 1-on-1 chi tiết →
          </span>
        </div>
      </div>

      {/* Footer Progress & Score Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-t border-slate-800 bg-slate-900/90 text-xs">
        <div className="text-slate-400">
          Tiến độ: <strong className="text-white">{progress}</strong>
        </div>
        <div className="text-slate-400">
          Điểm: <strong className="text-indigo-300">{score}</strong>
        </div>
      </div>
    </div>
  );
}

export default React.memo(MiniatureCanvas, (prevProps, nextProps) => {
  return (
    prevProps.studentId === nextProps.studentId &&
    prevProps.studentName === nextProps.studentName &&
    prevProps.progress === nextProps.progress &&
    prevProps.score === nextProps.score &&
    prevProps.status === nextProps.status &&
    JSON.stringify(prevProps.liveState) === JSON.stringify(nextProps.liveState)
  );
});
