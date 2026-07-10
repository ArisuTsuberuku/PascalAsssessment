"use client";

import React from "react";
import { CheckCircle2, Clock, User } from "lucide-react";

/*
 * Phase 3: PDF Snapshot Utility Note (Future-proofing)
 * Architecture Recommendation:
 * During the Assignment Creation phase (when Teacher saves the assignment),
 * we should use PDF.js canvas rendering to draw Page 1 to a data URL (.toDataURL('image/jpeg', 0.6))
 * and upload it to Firebase Storage as `thumbnailUrl`.
 * The StudentThumbnailCard can then render `<img src={thumbnailUrl} className="absolute inset-0 w-full h-full object-cover opacity-80" />`
 * as the background layer for perfect visual context with ZERO runtime rendering overhead!
 */

export interface StudentThumbnailCardProps {
  studentId: string;
  studentName: string;
  liveState?: Record<string, any>;
  assignmentConfig?: {
    baseWidth?: number;
    baseHeight?: number;
    items?: Array<{
      id: string;
      x: number;
      y: number;
      width?: number;
      height?: number;
      type?: string;
    }>;
  };
  progress?: string;
  score?: string;
  status?: string;
  thumbnailUrl?: string;
}

function StudentThumbnailCard({
  studentId,
  studentName,
  liveState = {},
  assignmentConfig = {},
  progress = "0%",
  score = "Đang làm",
  status = "Active",
  thumbnailUrl,
}: StudentThumbnailCardProps) {
  const baseW = assignmentConfig?.baseWidth || 850;
  const baseH = assignmentConfig?.baseHeight || 1100;
  const items = assignmentConfig?.items || [];
  const answerKeys = Object.keys(liveState || {});

  const isDone =
    status === "Done" || status === "submitted" || status === "Đã nộp";

  return (
    <div className="group relative flex flex-col rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg hover:border-indigo-500/80 transition-all cursor-pointer">
      {/* Student Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-[10px]">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-xs text-white truncate">
            {studentName}
          </span>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold shrink-0 ${
            isDone
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
              : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
          }`}
        >
          {isDone ? (
            <CheckCircle2 className="h-2.5 w-2.5" />
          ) : (
            <Clock className="h-2.5 w-2.5" />
          )}
          <span>{isDone ? "Đã nộp" : "Live"}</span>
        </span>
      </div>

      {/* Lightweight Base Layer: A4 aspect ratio container (1 / 1.4) */}
      <div className="relative w-full aspect-[1/1.4] bg-white overflow-hidden select-none border-b border-slate-800">
        {/* Optional Static Page 1 Image Snapshot Thumbnail */}
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt="PDF Thumbnail"
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />
        ) : (
          /* Subtle Paper Mockup Lines */
          <div className="absolute inset-0 flex flex-col p-3 gap-2 opacity-15 pointer-events-none">
            <div className="h-2 w-1/3 bg-slate-800 rounded"></div>
            <div className="h-1.5 w-full bg-slate-600 rounded mt-2"></div>
            <div className="h-1.5 w-4/5 bg-slate-600 rounded"></div>
            <div className="h-1.5 w-full bg-slate-600 rounded"></div>
            <div className="h-1.5 w-2/3 bg-slate-600 rounded"></div>
          </div>
        )}

        {/* Data Layer: Percentage Positioning of Student Answers */}
        {items.length > 0
          ? items.map((item) => {
              const leftPct = Math.max(0, Math.min(95, (item.x / baseW) * 100));
              const topPct = Math.max(0, Math.min(95, (item.y / baseH) * 100));
              const hasAnswer =
                liveState[item.id] !== undefined &&
                liveState[item.id] !== null &&
                liveState[item.id] !== "";

              return (
                <div
                  key={item.id}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all ${
                    hasAnswer
                      ? "h-3.5 w-3.5 bg-emerald-500 text-white shadow-md ring-2 ring-emerald-300"
                      : "h-2.5 w-2.5 bg-slate-400/70 border border-slate-600"
                  }`}
                  title={`Câu hỏi ${item.id}: ${hasAnswer ? "Đã trả lời" : "Chưa làm"}`}
                />
              );
            })
          : /* Fallback percentage indicator dots when config items are not yet loaded */
            answerKeys.map((key, idx) => {
              // Distribute dots visually based on index
              const leftPct = 15 + (idx % 3) * 35;
              const topPct = 15 + Math.floor(idx / 3) * 18;
              return (
                <div
                  key={key}
                  style={{
                    left: `${Math.min(85, leftPct)}%`,
                    top: `${Math.min(85, topPct)}%`,
                  }}
                  className="absolute h-3 w-3 rounded-full bg-purple-600 ring-2 ring-purple-300 shadow-sm"
                  title={`Đã trả lời câu ${idx + 1}`}
                />
              );
            })}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-indigo-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="rounded-lg bg-slate-900/95 border border-indigo-500/50 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xl">
            Mở 1-on-1 Fullscreen
          </span>
        </div>
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 text-[11px]">
        <span className="text-slate-400">
          Tiến độ: <strong className="text-white">{progress}</strong>
        </span>
        <span className="text-slate-400">
          Điểm: <strong className="text-indigo-300">{score}</strong>
        </span>
      </div>
    </div>
  );
}

export default React.memo(StudentThumbnailCard, (prevProps, nextProps) => {
  return (
    prevProps.studentId === nextProps.studentId &&
    prevProps.studentName === nextProps.studentName &&
    prevProps.progress === nextProps.progress &&
    prevProps.score === nextProps.score &&
    prevProps.status === nextProps.status &&
    prevProps.thumbnailUrl === nextProps.thumbnailUrl &&
    JSON.stringify(prevProps.liveState) === JSON.stringify(nextProps.liveState)
  );
});
