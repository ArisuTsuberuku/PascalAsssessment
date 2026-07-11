"use client";

import React from "react";
import { GradingStatus } from "@/lib/evaluateAnswer";

export interface StatusConfigItem {
  color: string;
  bg: string;
  border: string;
  icon: string;
  label: string;
  cellBg: string;
}

export const STATUS_CONFIG: Record<GradingStatus, StatusConfigItem> = {
  correct: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/40",
    icon: "✅",
    label: "Đúng",
    cellBg: "bg-emerald-500/70 border-emerald-400/50",
  },
  incorrect: {
    color: "text-rose-400",
    bg: "bg-rose-500/15",
    border: "border-rose-500/40",
    icon: "❌",
    label: "Sai",
    cellBg: "bg-rose-500/70 border-rose-400/50",
  },
  partial: {
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/40",
    icon: "⚠️",
    label: "Một phần",
    cellBg: "bg-amber-500/60 border-amber-400/50",
  },
  needs_grading: {
    color: "text-purple-400",
    bg: "bg-purple-500/15",
    border: "border-purple-500/40",
    icon: "❓",
    label: "Chờ chấm",
    cellBg: "bg-purple-500/50 border-purple-400/40",
  },
  skipped: {
    color: "text-slate-400",
    bg: "bg-slate-700/40",
    border: "border-slate-600/40",
    icon: "⏭️",
    label: "Bỏ qua",
    cellBg: "bg-slate-700/50 border-slate-600/30",
  },
};

export interface StatusBadgeProps {
  status: GradingStatus;
  score?: number;
  maxScore?: number;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function StatusBadge({
  status,
  score,
  maxScore,
  showScore = false,
  size = "md",
  className = "",
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.skipped;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.color} ${config.bg} ${config.border} ${sizeClasses} ${className}`}
    >
      <span>{config.icon}</span>
      {showScore && typeof score === "number" ? (
        <span className="font-mono font-semibold">
          {score}
          {typeof maxScore === "number" ? ` / ${maxScore}` : ""}đ
        </span>
      ) : (
        <span>{config.label}</span>
      )}
    </span>
  );
}
