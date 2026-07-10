"use client";

import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Line, Text } from "react-konva";
import { useAssignmentEditorStore } from "@/store/useAssignmentEditorStore";
import { Annotation } from "@/types/assignment";

interface DrawingLayerProps {
  width: number;
  height: number;
  pageNumber: number;
}

export default function DrawingLayer({
  width,
  height,
  pageNumber,
}: DrawingLayerProps) {
  const activeStudentTool = useAssignmentEditorStore(
    (state) => state.activeStudentTool
  );
  const activeColor = useAssignmentEditorStore((state) => state.activeColor);
  const activeStrokeWidth = useAssignmentEditorStore(
    (state) => state.activeStrokeWidth
  );
  const annotations = useAssignmentEditorStore((state) => state.annotations);
  const setAnnotations = useAssignmentEditorStore(
    (state) => state.setAnnotations
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({
    width: width || 850,
    height: height || 1200,
  });

  useEffect(() => {
    if (containerRef.current) {
      const w = containerRef.current.offsetWidth || width;
      const h = containerRef.current.offsetHeight || height;
      if (w > 0 && h > 0) {
        setSize({ width: w, height: h });
      }
    }

    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          setSize({ width: w, height: h });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [width, height]);

  const [currentLine, setCurrentLine] = useState<Annotation | null>(null);
  const isDrawing = useRef(false);

  // Phase 1: Lifecycle State for Textbox Tool
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Phase 1: State Trace
  useEffect(() => {
    console.log("🔍 [STATE TRACE] editingTextId changed to:", editingTextId);
  }, [editingTextId]);

  // Phase 1: Unified Commit Function
  const commitText = () => {
    if (!editingTextId) return;
    console.log("⚠️ [EVENT] commitText invoked for ID:", editingTextId);
    setAnnotations((prev) => {
      const textObj = prev.find((a) => a.id === editingTextId);
      if (textObj && (!textObj.text || textObj.text.trim() === "")) {
        return prev.filter((a) => a.id !== editingTextId); // Remove if empty
      }
      return prev;
    });
    setEditingTextId(null);
  };

  // Object Eraser helper (removes stroke or text by ID)
  const removeAnnotation = (idToRemove: string) => {
    setAnnotations((prev) => prev.filter((ann) => ann.id !== idToRemove));
  };

  // Filter out any legacy white eraser strokes so only valid strokes/texts remain
  const pageAnnotations = annotations.filter(
    (ann) => ann.pageNumber === pageNumber && ann.tool !== "eraser"
  );

  const isDrawingMode =
    activeStudentTool === "pen" ||
    activeStudentTool === "highlighter" ||
    activeStudentTool === "eraser" ||
    activeStudentTool === "line" ||
    activeStudentTool === "text";

  const handleMouseDown = (e: any) => {
    if (!isDrawingMode) return;

    // Phase 3: Stage Click to Commit
    // 1. If we are currently editing text, a click anywhere on the canvas should commit it.
    if (editingTextId) {
      console.log(
        "⚡ [EVENT] Stage clicked while editingTextId active -> committing text"
      );
      commitText();
      return; // Stop executing further drawing/creating logic
    }

    // Do not draw lines when eraser is active
    if (activeStudentTool === "eraser") return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // 2. Handle Text Tool Click -> Create Text Annotation & Open Edit Mode
    if (activeStudentTool === "text") {
      console.log("⚡ [EVENT] PointerDown triggered for Text Tool at:", {
        x: pos.x,
        y: pos.y,
      });

      const newId = `txt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      console.log("⚡ [EVENT] Creating new Text Annotation ID:", newId);
      const newTextObj: Annotation = {
        id: newId,
        type: "text",
        tool: "text",
        x: pos.x,
        y: pos.y,
        text: "",
        color: activeColor,
        fontSize: 18,
        pageNumber,
      };
      setAnnotations((prev) => [...prev, newTextObj]);
      setEditingTextId(newId);
      return;
    }

    isDrawing.current = true;

    const newId = `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Straight Line rubber-band initial points [startX, startY, startX, startY]
    const initialPoints =
      activeStudentTool === "line"
        ? [pos.x, pos.y, pos.x, pos.y]
        : [pos.x, pos.y];

    const newLine: Annotation = {
      id: newId,
      type: "line",
      tool: activeStudentTool,
      points: initialPoints,
      color: activeColor,
      strokeWidth:
        activeStudentTool === "highlighter"
          ? activeStrokeWidth * 3
          : activeStrokeWidth,
      pageNumber,
    };

    setCurrentLine(newLine);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current || !currentLine || !currentLine.points) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Rubber-band straight line technique (update only last 2 coords)
    if (currentLine.tool === "line") {
      const startX = currentLine.points[0];
      const startY = currentLine.points[1];
      setCurrentLine({
        ...currentLine,
        points: [startX, startY, pos.x, pos.y],
      });
      return;
    }

    // Freehand pen or highlighter
    setCurrentLine((prev) =>
      prev && prev.points
        ? {
            ...prev,
            points: [...prev.points, pos.x, pos.y],
          }
        : null
    );
  };

  const handleMouseUp = () => {
    if (!isDrawing.current || !currentLine) return;
    isDrawing.current = false;

    setAnnotations((prev) => [...prev, currentLine]);
    setCurrentLine(null);
  };

  const effectiveWidth = size.width > 0 ? size.width : width || 850;
  const effectiveHeight = size.height > 0 ? size.height : height || 1200;

  const getCustomCursor = (tool: string) => {
    if (tool === "pen") {
      return `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 21v-4.25L16.2 3.55a1.5 1.5 0 0 1 2.12 0l2.13 2.13a1.5 1.5 0 0 1 0 2.12L7.25 21H3Z" fill="black" stroke="white" stroke-width="2"/></svg>') 0 24, crosshair`;
    }
    if (tool === "highlighter") {
      return `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 3l2 2-6 6-2-2 6-6ZM3 21l3-10 4 4-10 3Z" fill="rgb(250, 204, 21)" stroke="black" stroke-width="1.5"/></svg>') 0 24, crosshair`;
    }
    if (tool === "eraser") {
      return `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="white" stroke="black" stroke-width="2"/><line x1="3" y1="12" x2="21" y2="12" stroke="black" stroke-width="2"/></svg>') 12 12, cell`;
    }
    if (tool === "text") return "text";
    if (tool === "line") return "crosshair";
    return "default";
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full z-40"
      style={{
        cursor: getCustomCursor(activeStudentTool),
        pointerEvents: isDrawingMode ? "auto" : "none",
      }}
    >
      {/* 1. KONVA STAGE */}
      <Stage
        width={effectiveWidth}
        height={effectiveHeight}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
      >
        <Layer>
          {pageAnnotations.map((ann) => {
            // Render Konva <Text> (Hidden when being edited in HTML overlay)
            if (ann.type === "text" && ann.text !== undefined) {
              if (ann.id === editingTextId) return null;

              return (
                <Text
                  key={ann.id}
                  x={ann.x || 0}
                  y={ann.y || 0}
                  text={ann.text}
                  fill={ann.color}
                  fontSize={ann.fontSize || 18}
                  fontFamily="sans-serif"
                  padding={4}
                  lineHeight={1.2}
                  onClick={() => {
                    if (
                      activeStudentTool === "text" ||
                      activeStudentTool === "pointer"
                    ) {
                      setEditingTextId(ann.id);
                    }
                  }}
                  onTap={() => {
                    if (
                      activeStudentTool === "text" ||
                      activeStudentTool === "pointer"
                    ) {
                      setEditingTextId(ann.id);
                    }
                  }}
                  onPointerDown={() => {
                    if (activeStudentTool === "eraser") removeAnnotation(ann.id);
                  }}
                  onPointerEnter={(e: any) => {
                    if (
                      activeStudentTool === "eraser" &&
                      e.evt &&
                      e.evt.buttons === 1
                    ) {
                      removeAnnotation(ann.id);
                    }
                  }}
                />
              );
            }

            if (!ann.points) return null;

            return (
              <Line
                key={ann.id}
                points={ann.points}
                stroke={ann.color}
                strokeWidth={ann.strokeWidth || 3}
                tension={ann.tool === "line" ? 0 : 0.5}
                lineCap="round"
                lineJoin="round"
                opacity={ann.tool === "highlighter" ? 0.4 : 1}
                globalCompositeOperation={
                  ann.tool === "highlighter" ? "multiply" : "source-over"
                }
                onPointerDown={() => {
                  if (activeStudentTool === "eraser") removeAnnotation(ann.id);
                }}
                onPointerEnter={(e: any) => {
                  if (
                    activeStudentTool === "eraser" &&
                    e.evt &&
                    e.evt.buttons === 1
                  ) {
                    removeAnnotation(ann.id);
                  }
                }}
              />
            );
          })}

          {/* Active line currently being drawn */}
          {currentLine && currentLine.points && (
            <Line
              points={currentLine.points}
              stroke={currentLine.color}
              strokeWidth={currentLine.strokeWidth || 3}
              tension={currentLine.tool === "line" ? 0 : 0.5}
              lineCap="round"
              lineJoin="round"
              opacity={currentLine.tool === "highlighter" ? 0.4 : 1}
              globalCompositeOperation={
                currentLine.tool === "highlighter" ? "multiply" : "source-over"
              }
            />
          )}
        </Layer>
      </Stage>

      {/* 2. HTML OVERLAYS (MUST BE OUTSIDE STAGE) */}
      {editingTextId &&
        (() => {
          const activeAnnotation = annotations.find(
            (a) => a.id === editingTextId
          );
          console.log(
            "🎨 [RENDER] Attempting to render HTML Overlay for annotation:",
            activeAnnotation
          );

          if (!activeAnnotation) {
            console.log("❌ [RENDER ERROR] activeAnnotation is undefined!");
            return null;
          }

          return (
            <div
              style={{
                position: "absolute",
                top: `${activeAnnotation.y || 0}px`,
                left: `${activeAnnotation.x || 0}px`,
                zIndex: 99999,
                pointerEvents: "auto",
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Delete Button (Classkick Style) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAnnotations((prev) =>
                    prev.filter((a) => a.id !== editingTextId)
                  );
                  setEditingTextId(null);
                }}
                style={{
                  position: "absolute",
                  top: "-12px",
                  right: "-12px",
                  background: "#ef4444", // Red-500
                  color: "white",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  cursor: "pointer",
                  zIndex: 10,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
                title="Xóa chữ"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </button>

              {/* Clean Textarea */}
              <textarea
                autoFocus
                value={activeAnnotation.text || ""}
                onChange={(e) => {
                  setAnnotations((prev) =>
                    prev.map((a) =>
                      a.id === editingTextId
                        ? { ...a, text: e.target.value }
                        : a
                    )
                  );
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    commitText();
                  }
                }}
                style={{
                  minWidth: "100px",
                  minHeight: "30px",
                  padding: "4px 8px",
                  background: "transparent", // No background
                  border: "2px solid #4ade80", // Classkick Green-400
                  color: activeColor,
                  fontSize: `${activeAnnotation.fontSize || 18}px`,
                  fontFamily: "sans-serif",
                  outline: "none",
                  resize: "both",
                  lineHeight: "1.2",
                  overflow: "hidden",
                }}
                placeholder="Nhập chữ..."
              />
            </div>
          );
        })()}
    </div>
  );
}
