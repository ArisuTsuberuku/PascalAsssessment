"use client";

import React, { useState, useRef } from "react";
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
  MousePointer2,
  Pen,
  Highlighter,
  Eraser,
  Type,
  Minus,
  ArrowDownUp,
  Columns,
  Link as LinkIcon,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
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
  const isPreviewMode = useAssignmentEditorStore(
    (state) => state.isPreviewMode
  );

  // Phase 1: State Management connected to store
  const activeStudentTool = useAssignmentEditorStore(
    (state) => state.activeStudentTool
  );
  const setActiveStudentTool = useAssignmentEditorStore(
    (state) => state.setActiveStudentTool
  );
  const activeColor = useAssignmentEditorStore((state) => state.activeColor);
  const setActiveColor = useAssignmentEditorStore(
    (state) => state.setActiveColor
  );
  const activeStrokeWidth = useAssignmentEditorStore(
    (state) => state.activeStrokeWidth
  );
  const setActiveStrokeWidth = useAssignmentEditorStore(
    (state) => state.setActiveStrokeWidth
  );
  const undo = useAssignmentEditorStore((state) => state.undo);
  const redo = useAssignmentEditorStore((state) => state.redo);
  const undoStack = useAssignmentEditorStore((state) => state.undoStack);
  const redoStack = useAssignmentEditorStore((state) => state.redoStack);
  const zoomLevel = useAssignmentEditorStore((state) => state.zoomLevel);
  const setZoomLevel = useAssignmentEditorStore((state) => state.setZoomLevel);

  // Phase 2: Customizable 5-color Palette State & Ref
  const [palette, setPalette] = useState<string[]>([
    "#ef4444",
    "#000000",
    "#3b82f6",
    "#eab308",
    "#6d28d9",
  ]);
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(
    null
  );
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Phase 2: Dynamic Styling Helper
  const getToolClass = (toolName: string) =>
    activeStudentTool === toolName
      ? "p-2 bg-purple-600 text-white rounded shadow-md transition-all scale-105"
      : "p-2 hover:bg-slate-700/50 rounded text-slate-300 hover:text-white transition-all";

  const penSizes = [
    { label: "Mảnh", value: 2 },
    { label: "Vừa", value: 4 },
    { label: "Dày", value: 8 },
  ];

  const highlighterSizes = [
    { label: "Mảnh", value: 12 },
    { label: "Vừa", value: 20 },
    { label: "Dày", value: 30 },
  ];

  if (isPreviewMode) {
    const showSubMenu =
      activeStudentTool === "pen" ||
      activeStudentTool === "highlighter" ||
      activeStudentTool === "text" ||
      activeStudentTool === "line";

    const sizes =
      activeStudentTool === "highlighter" ? highlighterSizes : penSizes;

    return (
      <div className="sticky top-4 z-40 flex flex-col items-center pointer-events-none mb-2 gap-2">
        {/* Hidden Native Color Picker */}
        <input
          type="color"
          ref={colorInputRef}
          className="hidden"
          onChange={(e) => {
            const newColor = e.target.value;
            if (editingColorIndex !== null) {
              const newPalette = [...palette];
              newPalette[editingColorIndex] = newColor;
              setPalette(newPalette);
              setActiveColor(newColor);
            }
          }}
        />

        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700 shadow-xl flex-wrap justify-center">
          <button
            onClick={() => setActiveStudentTool("pointer")}
            title="Con trỏ chuột"
            className={getToolClass("pointer")}
          >
            <MousePointer2 size={18} />
          </button>

          <div className="w-px h-5 bg-slate-700 mx-1.5"></div>

          <button
            onClick={() => setActiveStudentTool("pen")}
            title="Bút vẽ"
            className={getToolClass("pen")}
          >
            <Pen size={18} />
          </button>

          <button
            onClick={() => setActiveStudentTool("highlighter")}
            title="Bút dạ quang"
            className={getToolClass("highlighter")}
          >
            <Highlighter size={18} />
          </button>

          <button
            onClick={() => setActiveStudentTool("line")}
            title="Vẽ đường thẳng"
            className={getToolClass("line")}
          >
            <Minus size={18} />
          </button>

          <button
            onClick={() => setActiveStudentTool("text")}
            title="Thêm văn bản"
            className={getToolClass("text")}
          >
            <Type size={18} />
          </button>

          <button
            onClick={() => setActiveStudentTool("eraser")}
            title="Tẩy / Xóa"
            className={getToolClass("eraser")}
          >
            <Eraser size={18} />
          </button>

          <div className="w-px h-5 bg-slate-700 mx-1.5"></div>

          {/* Undo Button */}
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            title="Hoàn tác (Undo)"
            className={`p-2 rounded transition-all ${
              undoStack.length === 0
                ? "opacity-30 cursor-not-allowed text-slate-500"
                : "hover:bg-slate-700/50 text-slate-300 hover:text-white"
            }`}
          >
            <Undo2 size={18} />
          </button>

          {/* Redo Button */}
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            title="Làm lại (Redo)"
            className={`p-2 rounded transition-all ${
              redoStack.length === 0
                ? "opacity-30 cursor-not-allowed text-slate-500"
                : "hover:bg-slate-700/50 text-slate-300 hover:text-white"
            }`}
          >
            <Redo2 size={18} />
          </button>

          <div className="w-px h-5 bg-slate-700 mx-1.5"></div>

          {/* Zoom Out */}
          <button
            onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.1))}
            title="Thu nhỏ"
            className="p-2 hover:bg-slate-700/50 rounded text-slate-300 hover:text-white transition-all"
          >
            <ZoomOut size={18} />
          </button>

          {/* Zoom In */}
          <button
            onClick={() => setZoomLevel((prev) => Math.min(2.5, prev + 0.1))}
            title="Phóng to"
            className="p-2 hover:bg-slate-700/50 rounded text-slate-300 hover:text-white transition-all"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        {/* Sub-Menu: Customizable Color Palette & Stroke Width Picker */}
        {showSubMenu && (
          <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/95 backdrop-blur-md px-4 py-1.5 rounded-xl border border-slate-700 shadow-xl animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Customizable 5-color Swatches */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase text-slate-400 mr-1">
                Màu:
              </span>
              {palette.map((color, index) => (
                <button
                  key={index}
                  onClick={() => setActiveColor(color)}
                  onDoubleClick={() => {
                    setEditingColorIndex(index);
                    colorInputRef.current?.click();
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    activeColor === color
                      ? "border-white scale-110 shadow-sm"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  title="Click để chọn, Nháy đúp để đổi màu"
                />
              ))}
            </div>

            <div className="w-px h-4 bg-slate-700"></div>

            {/* Stroke Sizes */}
            {activeStudentTool !== "text" && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold uppercase text-slate-400 mr-1">
                  Nét:
                </span>
                {sizes.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setActiveStrokeWidth(s.value)}
                    className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                      activeStrokeWidth === s.value
                        ? "bg-purple-600 text-white shadow"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

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
      icon: <LinkIcon className="h-4 w-4" />,
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
