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
  Image as ImageIcon,
  Loader2,
  Stamp,
  Trash2,
} from "lucide-react";
import { ItemType, Annotation } from "@/types/assignment";
import { useAssignmentEditorStore } from "@/store/useAssignmentEditorStore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface CanvasToolbarProps {
  currentPageNumber: number;
  role?: string;
  mode?: "editor" | "session";
  onTeacherAnnotationAdd?: (ann: Annotation) => void;
  onToggleRaiseHand?: () => void;
  needsHelp?: boolean;
  onClearPage?: () => void;
}

export default function CanvasToolbar({
  currentPageNumber,
  role,
  mode,
  onTeacherAnnotationAdd,
  onToggleRaiseHand,
  needsHelp,
  onClearPage,
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

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showStickerMenu, setShowStickerMenu] = useState(false);

  const compressImageToWebP = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1200;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context failed"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Compression failed"));
          },
          "image/webp",
          0.7
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load image"));
      };
      img.src = objectUrl;
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const compressedBlob = await compressImageToWebP(file);
      const studentSessionStr =
        typeof window !== "undefined"
          ? sessionStorage.getItem("pascal_student_session")
          : null;
      const sessionData = studentSessionStr ? JSON.parse(studentSessionStr) : null;
      const sessionId = sessionData?.classCode || "general";
      const studentId = sessionData?.studentId || `anon_${Date.now()}`;

      const storageRef = ref(
        storage,
        `student_uploads/${sessionId}/${studentId}_${Date.now()}.webp`
      );
      await uploadBytes(storageRef, compressedBlob);
      const downloadUrl = await getDownloadURL(storageRef);

      const imageAnn: Annotation = {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: "image",
        tool: "image",
        x: 60,
        y: 60,
        width: 320,
        height: 240,
        imageUrl: downloadUrl,
        pageNumber: currentPageNumber,
        owner: role === "teacher" ? "teacher" : "student",
      };

      if (role === "teacher" && onTeacherAnnotationAdd) {
        onTeacherAnnotationAdd(imageAnn);
      } else {
        useAssignmentEditorStore.getState().setAnnotations((prev) => [...prev, imageAnn]);
      }
    } catch (err) {
      console.error("Lỗi nén/tải ảnh lên Firebase Storage:", err);
      alert("Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddSticker = (emoji: string) => {
    const stickerAnn: Annotation = {
      id: `stk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: "text",
      tool: "sticker",
      x: 180,
      y: 180,
      text: emoji,
      color: "#000000",
      fontSize: 60,
      pageNumber: currentPageNumber,
      owner: "teacher",
      selectable: true,
      evented: true,
      hasControls: true,
    };
    if (role === "teacher" && onTeacherAnnotationAdd) {
      onTeacherAnnotationAdd(stickerAnn);
    } else {
      useAssignmentEditorStore.getState().setAnnotations((prev) => [...prev, stickerAnn]);
    }
    setActiveStudentTool("pointer");
    setShowStickerMenu(false);
  };

  // Phase 2: Dynamic Styling Helper
  const getToolClass = (toolName: string) =>
    activeStudentTool === toolName
      ? "p-2 bg-emerald-600 text-white rounded shadow-md transition-all scale-105"
      : "p-2 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 transition-all";

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

  const isSessionMode =
    mode === "session" ||
    (mode !== "editor" && (isPreviewMode || role === "teacher"));

  if (isSessionMode) {
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

        <div className="pointer-events-auto flex items-center gap-1 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-emerald-200 shadow-xl flex-wrap justify-center">
          <button
            onClick={() => setActiveStudentTool("pointer")}
            title="Con trỏ chuột"
            className={getToolClass("pointer")}
          >
            <MousePointer2 size={18} />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1.5"></div>

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

          {/* Clear Page Tool */}
          {onClearPage && (
            <button
              onClick={onClearPage}
              title={role === "teacher" ? "Xóa toàn bộ ghi chú của tôi" : "Xóa toàn bộ bài làm trên trang này"}
              className="p-2 ml-1 border-l border-slate-700 pl-3 hover:bg-red-500/20 rounded-r-none text-red-400 hover:text-red-300 transition-all flex items-center justify-center"
            >
              <Trash2 size={18} />
            </button>
          )}

          {/* STUDENT TOOLS ONLY (Upload Image & Raise Hand) */}
          {role === "student" && (
            <>
              {/* Hidden File Input for Image Upload */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Upload Compressed Image (WebP) */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                title="Tải ảnh lên bài làm (Tự động nén WebP siêu nhỏ)"
                className="p-2 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center"
              >
                {isUploadingImage ? (
                  <Loader2 size={18} className="animate-spin text-emerald-600" />
                ) : (
                  <ImageIcon size={18} />
                )}
              </button>

              {/* Raise Hand Toggle Button */}
              {onToggleRaiseHand && (
                <button
                  onClick={onToggleRaiseHand}
                  title={
                    needsHelp
                      ? "Hạ tay xuống (Đã gọi hỗ trợ)"
                      : "Giơ tay xin hỗ trợ từ giáo viên"
                  }
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                    needsHelp
                      ? "bg-red-500 text-white border-red-400 animate-pulse shadow-lg shadow-red-500/30"
                      : "bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300"
                  }`}
                >
                  <span>✋</span>
                  <span className="hidden sm:inline">
                    {needsHelp ? "Đang gọi" : "Giơ tay"}
                  </span>
                </button>
              )}
            </>
          )}

          {/* Teacher Sticker / Stamp Tool (Only for Teacher) */}
          {role === "teacher" && (
            <div className="relative">
              <button
                onClick={() => setShowStickerMenu(!showStickerMenu)}
                title="Chèn nhãn dán / chấm điểm nhanh"
                className={`p-2 rounded transition-all ${
                  showStickerMenu
                    ? "bg-purple-600 text-white"
                    : "hover:bg-slate-700/50 text-slate-300 hover:text-white"
                }`}
              >
                <Stamp size={18} />
              </button>
              {showStickerMenu && (
                <div className="absolute top-11 left-0 bg-slate-900 border border-slate-700 rounded-xl p-2 flex gap-1.5 shadow-2xl z-50">
                  {["💯", "❌", "✅", "⭐", "🏆"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleAddSticker(emoji)}
                      className="text-xl p-1.5 hover:bg-slate-800 rounded-lg transition-transform hover:scale-125"
                      title={`Thêm nhãn ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

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
            className={`p-2 rounded transition-all flex items-center justify-center ${
              redoStack.length === 0
                ? "opacity-30 cursor-not-allowed text-slate-400"
                : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
            }`}
          >
            <Redo2 size={18} />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1.5"></div>

          {/* Zoom Out */}
          <button
            onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.1))}
            title="Thu nhỏ"
            className="p-2 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center"
          >
            <ZoomOut size={18} />
          </button>

          {/* Zoom In */}
          <button
            onClick={() => setZoomLevel((prev) => Math.min(2.5, prev + 0.1))}
            title="Phóng to"
            className="p-2 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        {/* Sub-Menu: Customizable Color Palette & Stroke Width Picker */}
        {showSubMenu && (
          <div className="pointer-events-auto flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-xl border border-emerald-200 shadow-xl animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Customizable 5-color Swatches */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase text-slate-500 mr-1">
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
                      ? "border-emerald-600 scale-110 shadow-md"
                      : "border-transparent hover:scale-105 border-slate-200"
                  }`}
                  style={{ backgroundColor: color }}
                  title="Click để chọn, Nháy đúp để đổi màu"
                />
              ))}
            </div>

            <div className="w-px h-4 bg-slate-200"></div>

            {/* Stroke Sizes */}
            {activeStudentTool !== "text" && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold uppercase text-slate-500 mr-1">
                  Nét:
                </span>
                {sizes.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setActiveStrokeWidth(s.value)}
                    className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                      activeStrokeWidth === s.value
                        ? "bg-emerald-600 text-white shadow"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-emerald-200 bg-white/95 px-3 py-1.5 shadow-xl backdrop-blur-md flex-wrap max-w-[95vw] justify-center">
        <div className="flex items-center gap-1 pr-2 border-r border-slate-200 text-slate-800 text-[11px] font-semibold">
          <PlusCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>Trang {currentPageNumber}:</span>
        </div>

        <div className="flex items-center gap-1 flex-wrap justify-center">
          {tools.map((tool) => (
            <button
              key={tool.type}
              onClick={() => addCanvasItem(tool.type, currentPageNumber)}
              className={`group relative flex items-center justify-center rounded-lg border border-transparent p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition-all active:scale-95`}
              title={tool.label}
            >
              {tool.icon}
              {/* Tooltip on hover */}
              <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 border border-slate-700 z-50">
                {tool.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
