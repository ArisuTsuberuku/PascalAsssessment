"use client";

import React from "react";
import {
  ListOrdered,
  TextCursorInput,
  ChevronDownSquare,
  Calculator,
  CheckSquare,
  AlignLeft,
  PlusCircle,
  CheckCircle2,
  FormInput,
  PenTool,
  MousePointerClick,
  ArrowDownUp,
  Columns,
  Link,
  Highlighter,
} from "lucide-react";
import { ItemType } from "@/types/assignment";
import { useAssignmentEditorStore } from "@/store/useAssignmentEditorStore";

interface CanvasToolbarProps {
  currentPageNumber: number;
}

export default function CanvasToolbar({
  currentPageNumber,
}: CanvasToolbarProps) {
  const addCanvasItem = useAssignmentEditorStore(
    (state) => state.addCanvasItem
  );

  const tools: {
    type: ItemType;
    label: string;
    icon: React.ReactNode;
    colorClass: string;
  }[] = [
    {
      type: "multiple-choice",
      label: "Trắc nghiệm",
      icon: <ListOrdered className="h-4 w-4" />,
      colorClass:
        "hover:text-purple-400 hover:border-purple-500/60 hover:bg-purple-500/10",
    },
    {
      type: "multiple-selection",
      label: "Chọn nhiều",
      icon: <CheckCircle2 className="h-4 w-4" />,
      colorClass:
        "hover:text-purple-400 hover:border-purple-500/60 hover:bg-purple-500/10",
    },
    {
      type: "short-input",
      label: "Trả lời ngắn",
      icon: <TextCursorInput className="h-4 w-4" />,
      colorClass:
        "hover:text-sky-400 hover:border-sky-500/60 hover:bg-sky-500/10",
    },
    {
      type: "fill-in-the-blanks",
      label: "Điền từ",
      icon: <FormInput className="h-4 w-4" />,
      colorClass:
        "hover:text-sky-400 hover:border-sky-500/60 hover:bg-sky-500/10",
    },
    {
      type: "drop-down",
      label: "Chọn từ danh sách",
      icon: <ChevronDownSquare className="h-4 w-4" />,
      colorClass:
        "hover:text-amber-400 hover:border-amber-500/60 hover:bg-amber-500/10",
    },
    {
      type: "math-input",
      label: "Công thức",
      icon: <Calculator className="h-4 w-4" />,
      colorClass:
        "hover:text-indigo-400 hover:border-indigo-500/60 hover:bg-indigo-500/10",
    },
    {
      type: "true-false",
      label: "Đúng / Sai",
      icon: <CheckSquare className="h-4 w-4" />,
      colorClass:
        "hover:text-emerald-400 hover:border-emerald-500/60 hover:bg-emerald-500/10",
    },
    {
      type: "essay",
      label: "Tự luận",
      icon: <AlignLeft className="h-4 w-4" />,
      colorClass:
        "hover:text-pink-400 hover:border-pink-500/60 hover:bg-pink-500/10",
    },
    {
      type: "drawing",
      label: "Vẽ tay",
      icon: <PenTool className="h-4 w-4" />,
      colorClass:
        "hover:text-rose-400 hover:border-rose-500/60 hover:bg-rose-500/10",
    },
    {
      type: "drag-and-drop",
      label: "Kéo thả từ",
      icon: <MousePointerClick className="h-4 w-4" />,
      colorClass:
        "hover:text-cyan-400 hover:border-cyan-500/60 hover:bg-cyan-500/10",
    },
    {
      type: "re-sequence",
      label: "Sắp xếp",
      icon: <ArrowDownUp className="h-4 w-4" />,
      colorClass:
        "hover:text-violet-400 hover:border-violet-500/60 hover:bg-violet-500/10",
    },
    {
      type: "classification",
      label: "Phân loại",
      icon: <Columns className="h-4 w-4" />,
      colorClass:
        "hover:text-teal-400 hover:border-teal-500/60 hover:bg-teal-500/10",
    },
    {
      type: "matching",
      label: "Nối cột",
      icon: <Link className="h-4 w-4" />,
      colorClass:
        "hover:text-orange-400 hover:border-orange-500/60 hover:bg-orange-500/10",
    },
    {
      type: "highlight-text",
      label: "Đánh dấu văn bản",
      icon: <Highlighter className="h-4 w-4" />,
      colorClass:
        "hover:text-yellow-400 hover:border-yellow-500/60 hover:bg-yellow-500/10",
    },
  ];

  return (
    <div className="sticky top-4 z-40 flex justify-center pointer-events-none mb-2">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 shadow-2xl backdrop-blur-md flex-wrap max-w-[95vw] justify-center">
        <div className="flex items-center gap-1 pr-2 border-r border-slate-700 text-slate-300 text-[11px] font-semibold">
          <PlusCircle className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span>Trang {currentPageNumber}:</span>
        </div>

        <div className="flex items-center gap-1 flex-wrap justify-center">
          {tools.map((tool) => (
            <button
              key={tool.type}
              onClick={() => addCanvasItem(tool.type, currentPageNumber)}
              className={`group relative flex items-center justify-center rounded-lg border border-transparent p-1.5 text-slate-300 transition-all active:scale-95 ${tool.colorClass}`}
              title={tool.label}
            >
              {tool.icon}
              {/* Tooltip on hover */}
              <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-950 px-2 py-1 text-[10px] font-semibold text-slate-200 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 border border-slate-800 z-50">
                {tool.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
