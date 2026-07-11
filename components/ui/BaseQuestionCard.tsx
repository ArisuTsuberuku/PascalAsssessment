"use client";

import React from "react";

export interface BaseQuestionCardProps {
  index: number;
  title: string;
  text?: string;
  maxPoints?: number;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function BaseQuestionCard({
  index,
  title,
  text,
  maxPoints,
  headerActions,
  children,
  className = "",
}: BaseQuestionCardProps) {
  return (
    <div
      className={`rounded-xl border border-emerald-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-emerald-200 text-slate-800 ${className}`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-emerald-100 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold font-mono text-emerald-800 border border-emerald-300">
            #{index}
          </span>
          <h3 className="text-sm font-bold text-slate-800 truncate">{title}</h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {typeof maxPoints === "number" && !headerActions && (
            <span className="text-xs font-mono text-slate-500">
              Tối đa: {maxPoints}đ
            </span>
          )}
          {headerActions}
        </div>
      </div>

      {/* Optional Question Prompt Text */}
      {text && (
        <div className="text-xs text-slate-600 leading-relaxed mb-3 whitespace-pre-wrap">
          {text}
        </div>
      )}

      {/* Content Slot */}
      <div className="space-y-3">{children}</div>
    </div>
  );
}
