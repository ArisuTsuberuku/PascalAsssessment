"use client";

import React from "react";
import { InlineMath, BlockMath } from "react-katex";
import { Eye } from "lucide-react";

interface StudentAnswerDisplayProps {
  item: any;
  rawAnswer: any;
  onFocusItem?: (payload: { pageNumber?: number; targetId: string; boundingBox?: any }) => void;
}

export default function StudentAnswerDisplay({
  item,
  rawAnswer,
  onFocusItem,
}: StudentAnswerDisplayProps) {
  // Parse stringified JSON if needed
  let parsedAnswer = rawAnswer;
  if (typeof rawAnswer === "string") {
    try {
      if (rawAnswer.trim().startsWith("[") || rawAnswer.trim().startsWith("{")) {
        parsedAnswer = JSON.parse(rawAnswer);
      }
    } catch (e) {
      // Keep as string if parsing fails
    }
  }

  // Handle Empty States
  const isEmpty =
    parsedAnswer === null ||
    parsedAnswer === undefined ||
    parsedAnswer === "" ||
    (Array.isArray(parsedAnswer) && parsedAnswer.length === 0);

  // Check if this is a canvas-only question (e.g., drawing directly on PDF, no options/config)
  const isCanvasOnly = !item.type || item.type === "pdf_draw" || item.type === "canvas";

  if (isEmpty) {
    return (
      <div className="mb-2.5 rounded-lg bg-slate-950/70 px-2.5 py-2 border border-slate-800/60 flex flex-col gap-1.5">
        {isCanvasOnly ? (
          <span className="font-semibold text-purple-300 text-[11px]">Bài làm của học sinh:</span>
        ) : (
          <span className="text-gray-500 italic text-[11px]">Học sinh chưa làm câu này</span>
        )}
        
        {item.pageNumber && (
          <div className="mt-1 pt-1">
            <button
              onClick={() => {
                if (onFocusItem) {
                  onFocusItem({
                    pageNumber: item.pageNumber,
                    targetId: item.id,
                    boundingBox: item.boundingBox,
                  });
                }
              }}
              className="inline-flex items-center justify-center gap-2 w-full px-2 py-1.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors text-xs font-medium"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem bài làm trực tiếp trên PDF</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  const renderContent = () => {
    switch (item.type) {
      case "multiple-choice":
      case "multiple-selection":
      case "checkbox": {
        let answers = [];
        if (Array.isArray(parsedAnswer)) {
          answers = parsedAnswer;
        } else if (typeof parsedAnswer === "object" && parsedAnswer.selectedHashes) {
          answers = parsedAnswer.selectedHashes;
        } else if (typeof parsedAnswer === "object" && parsedAnswer.selectedHash) {
          answers = [parsedAnswer.selectedHash];
        } else {
          answers = [parsedAnswer];
        }

        const options = item.config?.options || [];
        const validLetters = ["A", "B", "C", "D", "E", "F", "G", "H"];

        return (
          <div className="flex flex-wrap gap-2 mt-1">
            {answers.map((ans: any, idx: number) => {
              const matchedIdx = options.findIndex((opt: any) => opt.id === ans || opt.hash === ans);
              
              let label = ans;
              if (matchedIdx !== -1) {
                label = validLetters[matchedIdx];
              } else if (typeof ans === "string" && ans.startsWith("opt-")) {
                 // Fallback if options array is missing
                 label = ans.replace("opt-", "").toUpperCase();
              }

              return (
                <span key={idx} className="bg-blue-600 text-white px-2 py-1 rounded shadow-sm text-xs font-bold">
                  {String(label).toUpperCase()}
                </span>
              );
            })}
          </div>
        );
      }

      case "true-false": {
        const isTrue = parsedAnswer === true || parsedAnswer === "true";
        return (
          <span className={`px-2 py-1 rounded shadow-sm text-xs font-bold ${isTrue ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
            {isTrue ? "Đúng (True)" : "Sai (False)"}
          </span>
        );
      }

      case "math-input":
      case "math":
      case "formula": {
        const mathString = typeof parsedAnswer === "object" ? (parsedAnswer.value || parsedAnswer.text) : String(parsedAnswer);
        try {
          return (
            <div className="py-2 px-3 bg-slate-900 rounded border border-slate-700/50 overflow-x-auto text-slate-100 mt-1">
              <InlineMath math={mathString} />
            </div>
          );
        } catch (e) {
          return <span className="text-red-400 text-xs">Lỗi hiển thị công thức: {mathString}</span>;
        }
      }

      case "drop-down":
      case "list": {
        const options = item.config?.options || [];
        const matched = options.find((opt: any) => opt.id === parsedAnswer || opt.hash === parsedAnswer);
        let displayLabel = matched ? (matched.text || matched.label) : parsedAnswer;
        if (typeof displayLabel === "string" && displayLabel.startsWith("opt")) {
          displayLabel = displayLabel.replace("opt", "Option ");
        }
        return <span className="text-slate-200 font-medium">{String(displayLabel)}</span>;
      }

      default: {
        let displayString = parsedAnswer;
        if (typeof parsedAnswer === "object") {
          displayString = parsedAnswer.value || parsedAnswer.text || JSON.stringify(parsedAnswer);
        } else {
          displayString = String(parsedAnswer);
        }
        return <span className="text-slate-200 font-medium">{displayString}</span>;
      }
    }
  };

  return (
    <div className="mb-2.5 rounded-lg bg-slate-950/70 px-2.5 py-2 text-[11px] text-slate-300 border border-slate-800/60 break-words flex flex-col gap-1.5 shadow-sm">
      <span className="font-semibold text-purple-300">Bài làm của học sinh:</span>
      <div className="pl-1">
        {renderContent()}
      </div>
      
      {/* Show PDF button optionally if they did answer but it also has a canvas component */}
      {!isCanvasOnly && item.pageNumber && (
        <div className="mt-2 pt-2 border-t border-slate-800/60">
           <button
            onClick={() => {
              if (onFocusItem) {
                onFocusItem({
                  pageNumber: item.pageNumber,
                  targetId: item.id,
                  boundingBox: item.boundingBox,
                });
              }
            }}
            className="inline-flex items-center justify-center gap-2 w-full px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors text-[10px] font-medium"
          >
            <Eye className="w-3 h-3" />
            <span>Xem trên PDF</span>
          </button>
        </div>
      )}
    </div>
  );
}
