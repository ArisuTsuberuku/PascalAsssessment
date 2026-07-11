"use client";

import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Line, Text, Image as KonvaImage, Transformer, Rect, Group } from "react-konva";
import { useAssignmentEditorStore } from "@/store/useAssignmentEditorStore";
import { Annotation } from "@/types/assignment";

function KonvaUrlImage({
  ann,
  scaleX,
  scaleY,
  activeStudentTool,
  removeAnnotation,
  isDraggable,
  onPositionChange,
  isSelected,
  onSelect,
}: {
  ann: Annotation;
  scaleX: number;
  scaleY: number;
  activeStudentTool: string;
  removeAnnotation: (id: string) => void;
  isDraggable?: boolean;
  onPositionChange?: (id: string, updates: Partial<Annotation>) => void;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!ann.imageUrl) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = ann.imageUrl;
    img.onload = () => {
      setImage(img);
    };
  }, [ann.imageUrl]);

  if (!image) return null;

  return (
    <KonvaImage
      key={ann.id}
      image={image}
      x={(ann.x || 0) * scaleX}
      y={(ann.y || 0) * scaleY}
      width={(ann.width || 300) * scaleX}
      height={(ann.height || 200) * scaleY}
      id={ann.id}
      draggable={isDraggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        if (onPositionChange) {
          const newX = e.target.x() / scaleX;
          const newY = e.target.y() / scaleY;
          onPositionChange(ann.id, { x: newX, y: newY });
        }
      }}
      onTransformEnd={(e) => {
        if (onPositionChange) {
          const node = e.target;
          const sx = node.scaleX();
          const sy = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          const newW = (ann.width || 300) * sx;
          const newH = (ann.height || 200) * sy;
          const newX = node.x() / scaleX;
          const newY = node.y() / scaleY;
          onPositionChange(ann.id, { x: newX, y: newY, width: newW, height: newH });
        }
      }}
      onPointerDown={() => {
        if (activeStudentTool === "eraser") removeAnnotation(ann.id);
      }}
    />
  );
}

interface DrawingLayerProps {
  width: number;
  height: number;
  pageNumber: number;
  role?: "teacher" | "student";
  studentAnnotations?: Annotation[];
  teacherAnnotations?: Annotation[];
  onTeacherAnnotationAdd?: (ann: Annotation) => void;
  onTeacherAnnotationRemove?: (id: string) => void;
  onStudentAnnotationAdd?: (ann: Annotation) => void;
  onStudentAnnotationRemove?: (id: string) => void;
  isDrawingEnabled?: boolean;
  mode?: "editor" | "session";
}

export default function DrawingLayer({
  width,
  height,
  pageNumber,
  role = "student",
  studentAnnotations,
  teacherAnnotations,
  onTeacherAnnotationAdd,
  onTeacherAnnotationRemove,
  onStudentAnnotationAdd,
  onStudentAnnotationRemove,
  isDrawingEnabled = false,
  mode,
}: DrawingLayerProps) {
  const activeStudentTool = useAssignmentEditorStore(
    (state) => state.activeStudentTool
  );
  const activeTool = useAssignmentEditorStore((state) => state.activeTool);
  const activeTargetingQuestionId = useAssignmentEditorStore((state) => state.activeTargetingQuestionId);
  const setActiveTargetingQuestionId = useAssignmentEditorStore((state) => state.setActiveTargetingQuestionId);
  const updateItem = useAssignmentEditorStore((state) => state.updateItem);
  const setActiveTool = useAssignmentEditorStore((state) => state.setActiveTool);

  const activeColor = useAssignmentEditorStore((state) => state.activeColor);
  const activeStrokeWidth = useAssignmentEditorStore(
    (state) => state.activeStrokeWidth
  );
  const annotations = useAssignmentEditorStore((state) => state.annotations);
  const setAnnotations = useAssignmentEditorStore(
    (state) => state.setAnnotations
  );
  const draft = useAssignmentEditorStore((state) => state.draft);

  const existingBoxes = React.useMemo(() => {
    if (!draft || (mode !== "editor" && role !== "teacher")) return [];
    const boxes: any[] = [];
    draft.sections.forEach(sec => {
      sec.items.forEach(item => {
        if ((item as any).boundingBox && (item as any).boundingBox.pageNumber === pageNumber) {
          boxes.push(item);
        }
      });
    });
    return boxes;
  }, [draft, pageNumber, mode, role]);

  const currentToolRef = useRef(activeTool);
  const activeQuestionIdRef = useRef(activeTargetingQuestionId);
  const isDrawingBox = useRef(false);
  const startCoordsRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    currentToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    activeQuestionIdRef.current = activeTargetingQuestionId;
  }, [activeTargetingQuestionId]);

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
  const [tempBox, setTempBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Phase 1: Lifecycle State for Textbox Tool
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (selectedId && trRef.current) {
      const node = trRef.current.getStage().findOne(`#${selectedId}`);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer().batchDraw();
      }
    } else if (trRef.current) {
      trRef.current.nodes([]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedId, annotations, teacherAnnotations, studentAnnotations]);

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

  // Object Eraser helper (Asymmetric Permission Model)
  const removeAnnotation = (idToRemove: string) => {
    const isTeacherAnn =
      (teacherAnnotations || []).some((ann) => ann.id === idToRemove) ||
      (studentAnnotations || annotations).find((a) => a.id === idToRemove)
        ?.owner === "teacher";

    // STUDENT RESTRICTION: Student CANNOT erase/modify Teacher annotations
    if (role !== "teacher" && isTeacherAnn) {
      console.warn("🚫 [Permission Denied] Student cannot erase teacher annotations.");
      return;
    }

    // TEACHER OMNIPOTENT ADMIN: Teacher can erase/modify BOTH Teacher & Student annotations
    if (role === "teacher") {
      onTeacherAnnotationRemove?.(idToRemove);
    } else {
      setAnnotations((prev) => prev.filter((ann) => ann.id !== idToRemove));
      onStudentAnnotationRemove?.(idToRemove);
    }
  };

  const updateAnnotation = (idToUpdate: string, updates: Partial<Annotation>) => {
    const targetInTeacher = (teacherAnnotations || []).find((ann) => ann.id === idToUpdate);
    const targetInStudent = (studentAnnotations || annotations).find((ann) => ann.id === idToUpdate);
    const isTeacherAnn = targetInTeacher || targetInStudent?.owner === "teacher";

    if (role !== "teacher" && isTeacherAnn) {
      console.warn("🚫 [Permission Denied] Student cannot move teacher annotations.");
      return;
    }

    if (targetInTeacher && onTeacherAnnotationAdd) {
      onTeacherAnnotationAdd({ ...targetInTeacher, ...updates });
      return;
    }

    setAnnotations((prev) =>
      prev.map((ann) => (ann.id === idToUpdate ? { ...ann, ...updates } : ann))
    );
  };

  // Dual-layer filtering & Reactive State Bindings
  const effectiveStudentAnnotations =
    mode === "editor"
      ? []
      : role === "teacher"
      ? studentAnnotations || annotations
      : annotations.length > 0 || !studentAnnotations
      ? annotations
      : studentAnnotations;

  const studentPageAnnotations = (mode === "editor" ? [] : effectiveStudentAnnotations).filter(
    (ann) => ann.pageNumber === pageNumber && ann.tool !== "eraser"
  );
  const teacherPageAnnotations = (mode === "editor" ? [] : teacherAnnotations || []).filter(
    (ann) => ann.pageNumber === pageNumber && ann.tool !== "eraser"
  );

  const canDraw = mode === "session" || (isDrawingEnabled && mode !== "editor");
  const isDrawingMode =
    canDraw &&
    (activeStudentTool === "pointer" ||
      activeStudentTool === "pen" ||
      activeStudentTool === "highlighter" ||
      activeStudentTool === "eraser" ||
      activeStudentTool === "line" ||
      activeStudentTool === "text");

  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  const handleMouseDown = (e: any) => {
    checkDeselect(e);

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    console.log("🖱️ [Step 1] Mouse Down. Current Tool Ref:", currentToolRef.current);
    if (currentToolRef.current === "question_box" && activeQuestionIdRef.current) {
      console.log("✅ [Step 2] Init Question Box. Target ID:", activeQuestionIdRef.current);
      startCoordsRef.current = { x: pos.x, y: pos.y };
      setTempBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
      isDrawingBox.current = true;
      console.log("🎨 [Step 3] Rect Added to Canvas:", { x: pos.x, y: pos.y, width: 0, height: 0 });
      return;
    }

    if (!isDrawingMode) return;

    if (editingTextId) {
      commitText();
      return;
    }

    if (activeStudentTool === "eraser") return;

    // Set default brush color to RED (#ef4444) for teacher ink
    const effectiveColor =
      role === "teacher" && (activeColor === "#000000" || !activeColor)
        ? "#ef4444"
        : activeColor;

    if (activeStudentTool === "text") {
      const newId = `txt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newTextObj: Annotation = {
        id: newId,
        type: "text",
        tool: "text",
        x: pos.x,
        y: pos.y,
        text: "",
        color: effectiveColor,
        fontSize: 18,
        pageNumber,
        canvasWidth: effectiveWidth,
        canvasHeight: effectiveHeight,
        owner: role,
      };
      if (role === "teacher") {
        onTeacherAnnotationAdd?.(newTextObj);
      } else {
        setAnnotations((prev) => [...prev, newTextObj]);
        onStudentAnnotationAdd?.(newTextObj);
      }
      setEditingTextId(newId);
      return;
    }

    if (activeStudentTool === "pointer") return;

    isDrawing.current = true;
    const newId = `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const initialPoints =
      activeStudentTool === "line"
        ? [pos.x, pos.y, pos.x, pos.y]
        : [pos.x, pos.y];

    const newLine: Annotation = {
      id: newId,
      type: "line",
      tool: activeStudentTool,
      points: initialPoints,
      color: effectiveColor,
      strokeWidth:
        activeStudentTool === "highlighter"
          ? activeStrokeWidth * 3
          : activeStrokeWidth,
      pageNumber,
      canvasWidth: effectiveWidth,
      canvasHeight: effectiveHeight,
      owner: role,
    };

    setCurrentLine(newLine);
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (isDrawingBox.current && currentToolRef.current === "question_box" && activeQuestionIdRef.current) {
      const startX = startCoordsRef.current.x;
      const startY = startCoordsRef.current.y;
      
      setTempBox({
        x: Math.min(startX, pos.x),
        y: Math.min(startY, pos.y),
        width: Math.abs(pos.x - startX),
        height: Math.abs(pos.y - startY),
      });
      return;
    }

    if (!isDrawing.current || !currentLine || !currentLine.points) return;

    if (currentLine.tool === "line") {
      const startX = currentLine.points[0];
      const startY = currentLine.points[1];
      setCurrentLine({
        ...currentLine,
        points: [startX, startY, pos.x, pos.y],
      });
      return;
    }

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
    if (isDrawingBox.current && currentToolRef.current === "question_box" && tempBox && activeQuestionIdRef.current) {
      console.log("🛑 [Step 4] Mouse Up. Finalizing Box.");
      const finalBox = {
        left: tempBox.x,
        top: tempBox.y,
        width: tempBox.width,
        height: tempBox.height,
        pageNumber: pageNumber,
      };
      
      console.log("📍 [Step 5] Extracted Coordinates:", finalBox);
      console.log("💾 [Step 6] Updating Question ID:", activeQuestionIdRef.current);
      updateItem(activeQuestionIdRef.current, { boundingBox: finalBox });
      setActiveTargetingQuestionId(null);
      setActiveTool("select" as any);
      setTempBox(null);
      isDrawingBox.current = false;
      return;
    }

    if (!isDrawing.current || !currentLine) return;
    isDrawing.current = false;

    if (role === "teacher") {
      onTeacherAnnotationAdd?.(currentLine);
    } else {
      setAnnotations((prev) => [...prev, currentLine]);
      onStudentAnnotationAdd?.(currentLine);
    }
    setCurrentLine(null);
  };

  const effectiveWidth = size.width > 0 ? size.width : width || 850;
  const effectiveHeight = size.height > 0 ? size.height : height || 1200;

  const getCustomCursor = (tool: string) => {
    if (activeTool === "question_box" && activeTargetingQuestionId) return "crosshair";
    if (mode === "editor" || !canDraw) return "default";
    if (tool === "pen") return "crosshair"; // Standard high-contrast OS-adaptive
    if (tool === "highlighter") return "crosshair";
    if (tool === "eraser") return "pointer";
    if (tool === "text") return "text";
    if (tool === "line") return "crosshair";
    return "default";
  };

  const isActiveDrawingTool =
    activeStudentTool === "pen" ||
    activeStudentTool === "highlighter" ||
    activeStudentTool === "eraser" ||
    activeStudentTool === "line" ||
    activeStudentTool === "text" ||
    Boolean(activeTool === "question_box" && activeTargetingQuestionId);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full ${
        isActiveDrawingTool ? "z-[60]" : "z-10"
      }`}
      style={{
        cursor: getCustomCursor(activeStudentTool),
        pointerEvents:
          isDrawingMode || (activeTool === "question_box" && activeTargetingQuestionId)
            ? "auto"
            : "none",
      }}
    >
      {/* 1. KONVA STAGE */}
      <Stage
        width={effectiveWidth}
        height={effectiveHeight}
        listening={canDraw || (activeTool === "question_box" && activeTargetingQuestionId !== null)}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
      >
        <Layer>
          {tempBox && activeTool === "question_box" && activeTargetingQuestionId && (
            <Rect
              x={tempBox.x}
              y={tempBox.y}
              width={tempBox.width}
              height={tempBox.height}
              fill="rgba(59, 130, 246, 0.2)"
              stroke="#3b82f6"
              strokeWidth={2}
              dash={[5, 5]}
            />
          )}

          {existingBoxes.map((boxItem: any) => (
            <Group
              key={`qbox-${boxItem.id}`}
              x={boxItem.boundingBox.left || boxItem.boundingBox.x}
              y={boxItem.boundingBox.top || boxItem.boundingBox.y}
              onPointerDown={() => {
                if (activeStudentTool === "eraser") {
                  updateItem(boxItem.id, { boundingBox: null });
                }
              }}
              onPointerEnter={(e: any) => {
                if (activeStudentTool === "eraser" && e.evt && e.evt.buttons === 1) {
                  updateItem(boxItem.id, { boundingBox: null });
                }
              }}
            >
              <Rect
                width={boxItem.boundingBox.width}
                height={boxItem.boundingBox.height}
                fill="rgba(59, 130, 246, 0.15)"
                stroke="#3b82f6"
                strokeWidth={2}
                dash={[5, 5]}
              />
            </Group>
          ))}

          {[...studentPageAnnotations, ...teacherPageAnnotations].map((ann) => {
            const scaleX = ann.canvasWidth
              ? effectiveWidth / ann.canvasWidth
              : 1;
            const scaleY = ann.canvasHeight
              ? effectiveHeight / ann.canvasHeight
              : 1;

            const canModify = role === "teacher" ? true : ann.owner !== "teacher";
            const isDraggable = canModify && activeStudentTool === "pointer";

            // Render Konva <Text> (Hidden when being edited in HTML overlay)
            if (ann.type === "text" && ann.text !== undefined) {
              if (ann.id === editingTextId) return null;

              return (
                <Text
                  key={ann.id}
                  x={(ann.x || 0) * scaleX}
                  y={(ann.y || 0) * scaleY}
                  text={ann.text}
                  fill={ann.color}
                  fontSize={(ann.fontSize || 18) * scaleX}
                  fontFamily="sans-serif"
                  padding={4}
                  lineHeight={1.2}
                  draggable={isDraggable}
                  id={ann.id}
                  onDragEnd={(e) => {
                    const newX = e.target.x() / scaleX;
                    const newY = e.target.y() / scaleY;
                    updateAnnotation(ann.id, { x: newX, y: newY });
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const sx = node.scaleX();
                    const sy = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    const newSize = (ann.fontSize || 18) * Math.max(sx, sy);
                    const newX = node.x() / scaleX;
                    const newY = node.y() / scaleY;
                    updateAnnotation(ann.id, { x: newX, y: newY, fontSize: newSize });
                  }}
                  onClick={() => {
                    if (activeStudentTool === "pointer") setSelectedId(ann.id);
                    if (ann.tool === "sticker") return;
                    if (activeStudentTool === "text") {
                      setEditingTextId(ann.id);
                    }
                  }}
                  onTap={() => {
                    if (activeStudentTool === "pointer") setSelectedId(ann.id);
                    if (ann.tool === "sticker") return;
                    if (activeStudentTool === "text") {
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

            if (ann.type === "image" && ann.imageUrl) {
              return (
                <KonvaUrlImage
                  key={ann.id}
                  ann={ann}
                  scaleX={scaleX}
                  scaleY={scaleY}
                  activeStudentTool={activeStudentTool}
                  removeAnnotation={removeAnnotation}
                  isDraggable={isDraggable}
                  onPositionChange={updateAnnotation}
                  isSelected={selectedId === ann.id}
                  onSelect={() => {
                    if (activeStudentTool === "pointer") setSelectedId(ann.id);
                  }}
                />
              );
            }

            if (!ann.points) return null;

            const scaledPoints = ann.points.map((pt, idx) =>
              idx % 2 === 0 ? pt * scaleX : pt * scaleY
            );

            return (
              <Line
                key={ann.id}
                points={scaledPoints}
                stroke={ann.color}
                strokeWidth={(ann.strokeWidth || 3) * scaleX}
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

          {/* Transformer for selected nodes */}
          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit minimum size
              if (newBox.width < 10 || newBox.height < 10) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>

      {/* HTML LAYER FOR BOUNDING BOX ACTIONS (Fades in on hover) */}
      {(mode === "editor" || role === "teacher") && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {existingBoxes.map((boxItem: any) => {
            // If the item is placed on canvas, InteractiveCanvasItem handles its own hover/tools!
            if (boxItem.placement === "canvas") return null;

            const x = boxItem.boundingBox.left || boxItem.boundingBox.x;
            const y = boxItem.boundingBox.top || boxItem.boundingBox.y;
            const w = boxItem.boundingBox.width;
            const h = boxItem.boundingBox.height;
            const isDrawingNewBox = activeTool === "question_box" && activeTargetingQuestionId;

            return (
              <div
                key={`html-del-${boxItem.id}`}
                className="absolute group transition-opacity"
                style={{
                  left: x,
                  top: y,
                  width: w,
                  height: h,
                  pointerEvents: isDrawingNewBox ? "none" : "auto",
                }}
              >
                {/* Header that fades in on hover */}
                <div className="absolute left-0 bottom-full mb-1 w-full flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div
                    className="bg-indigo-600 text-white text-[11px] font-semibold px-2 py-1 rounded shadow-sm"
                    style={{
                      maxWidth: Math.min(150, w),
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {boxItem.name || "Câu hỏi"}
                  </div>
                  
                  {mode === "editor" && (
                    <button
                      className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded p-1 shadow-sm transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        updateItem(boxItem.id, { boundingBox: null });
                      }}
                      title="Xóa vùng tương tác"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
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
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. HTML OVERLAYS (MUST BE OUTSIDE STAGE) */}
      {editingTextId &&
        (() => {
          const allAnnotations = [
            ...(studentAnnotations || annotations),
            ...(teacherAnnotations || []),
          ];
          const activeAnnotation = allAnnotations.find(
            (a) => a.id === editingTextId
          );

          if (!activeAnnotation) return null;

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
                  removeAnnotation(editingTextId);
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
