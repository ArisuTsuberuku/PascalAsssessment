"use client";

import React, { useState } from "react";
import { Rnd } from "react-rnd";
import { CanvasItem } from "@/types/assignment";
import { useAssignmentEditorStore } from "@/store/useAssignmentEditorStore";
import { Move, Trash2, Pin, PinOff, Copy } from "lucide-react";
import CanvasItemRenderer from "@/components/canvas/CanvasItemRenderer";

interface InteractiveCanvasItemProps {
  item: CanvasItem;
  scale: number;
}

export default function InteractiveCanvasItem({
  item,
  scale,
}: InteractiveCanvasItemProps) {
  const [isPinned, setIsPinned] = useState(false);

  const updateCanvasItemBounds = useAssignmentEditorStore(
    (state) => state.updateCanvasItemBounds
  );
  const updateCanvasItemConfig = useAssignmentEditorStore(
    (state) => state.updateCanvasItemConfig
  );
  const duplicateCanvasItem = useAssignmentEditorStore(
    (state) => state.duplicateCanvasItem
  );
  const removeCanvasItem = useAssignmentEditorStore(
    (state) => state.removeCanvasItem
  );
  const isPreviewMode = useAssignmentEditorStore(
    (state) => state.isPreviewMode
  );

  // Convert virtual 1000x1414 coordinates to actual screen pixels
  const screenX = item.boundingBox.x * scale;
  const screenY = item.boundingBox.y * scale;
  const screenWidth = item.boundingBox.width * scale;
  const screenHeight = item.boundingBox.height * scale;

  return (
    <Rnd
      position={{ x: screenX, y: screenY }}
      size={{ width: screenWidth, height: screenHeight }}
      bounds="parent"
      dragGrid={[10, 10]}
      dragHandleClassName="drag-header"
      disableDragging={isPinned || isPreviewMode}
      enableResizing={!isPinned && !isPreviewMode}
      onDragStop={(e, d) => {
        const virtualX = Math.round(d.x / scale);
        const virtualY = Math.round(d.y / scale);
        updateCanvasItemBounds(item.id, { x: virtualX, y: virtualY });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        const virtualWidth = Math.round(ref.offsetWidth / scale);
        const virtualHeight = Math.round(ref.offsetHeight / scale);
        const virtualX = Math.round(position.x / scale);
        const virtualY = Math.round(position.y / scale);
        updateCanvasItemBounds(item.id, {
          width: virtualWidth,
          height: virtualHeight,
          x: virtualX,
          y: virtualY,
        });
      }}
      className={`border-2 rounded-md absolute group z-50 pointer-events-auto ${
        isPreviewMode
          ? "border-transparent"
          : isPinned
          ? "border-amber-500"
          : "border-indigo-500"
      }`}
    >
      {/* Header (Drag Handle & Pin Control) - Absolutely positioned above the box */}
      {!isPreviewMode && (
        <div
          className={`drag-header absolute bottom-full left-0 mb-1 flex items-center justify-between gap-2 px-2 py-1 rounded transition-opacity z-40 ${isPinned
            ? "bg-amber-600 opacity-100 cursor-default"
            : "bg-indigo-600 opacity-0 group-hover:opacity-100 cursor-move"
            }`}
        >
          <div className="flex items-center gap-1.5 overflow-hidden text-white">
            <Move className="h-3 w-3 shrink-0" />
            <span className="text-[11px] font-semibold truncate whitespace-nowrap">
              {item.name} {isPinned && "(Đã ghim)"}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <input
              type="number"
              min="0"
              step="0.25"
              value={item.config?.points || item.points || 0}
              onChange={(e) =>
                updateCanvasItemConfig(item.id, {
                  points: parseFloat(e.target.value) || 0,
                })
              }
              onClick={(e) => e.stopPropagation()}
              style={{
                width: `${Math.max(String(item.config?.points || item.points || "").length, 1) + 2}ch`,
              }}
              className="appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-w-[40px] h-5 text-xs text-black rounded px-1 font-bold focus:outline-none text-center"
              title="Điểm"
            />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPinned((prev) => !prev);
              }}
              title={
                isPinned
                  ? "Bỏ ghim (Cho phép di chuyển hộp)"
                  : "Ghim hộp (Di chuyển tự do các nút bên trong)"
              }
              className={`p-0.5 rounded transition-colors ${isPinned
                ? "text-white bg-amber-700 hover:bg-amber-800"
                : "text-white/80 hover:text-amber-200 hover:bg-white/10"
                }`}
            >
              {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                duplicateCanvasItem(item.id);
              }}
              title="Nhân bản câu hỏi này"
              className="p-0.5 rounded text-white/80 hover:text-cyan-300 hover:bg-cyan-500/30 transition-colors shrink-0"
            >
              <Copy size={12} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeCanvasItem(item.id);
              }}
              title="Xóa vùng tương tác này"
              className="p-0.5 rounded text-white/80 hover:text-red-300 hover:bg-red-500/30 transition-colors shrink-0"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Body - Completely transparent to show PDF underneath, always h-full so no layout shift */}
      <div className="w-full h-full p-1 bg-transparent overflow-hidden flex flex-col">
        <CanvasItemRenderer
          item={item}
          isPinned={isPinned && !isPreviewMode}
          isPreviewMode={isPreviewMode}
        />
      </div>
    </Rnd>
  );
}
