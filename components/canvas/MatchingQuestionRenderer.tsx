"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { CanvasItem, MatchingNode } from "@/types/assignment";
import { Rnd } from "react-rnd";
import { Plus, GripVertical } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";

interface MatchingQuestionRendererProps {
  item: CanvasItem;
  isPinned?: boolean;
  isPreviewMode?: boolean;
  studentState: any;
  setStudentState: React.Dispatch<React.SetStateAction<any>>;
  updateCanvasItemConfig: (itemId: string, newConfig: Partial<any>) => void;
}

// ─── Custom hook: measures the exact center of each connector dot ───
// Uses getBoundingClientRect relative to a container ref so coordinates
// are expressed in the same coordinate space as the SVG overlay.
// A ResizeObserver on the container triggers re-measurement when any
// child element changes size (e.g. TextareaAutosize expands).

interface DotCenter {
  x: number;
  y: number;
}

function useDotPositions(containerRef: React.RefObject<HTMLDivElement | null>) {
  const dotRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [dotPositions, setDotPositions] = useState<Map<string, DotCenter>>(
    new Map()
  );
  const [revision, setRevision] = useState(0);

  // Stable callback ref setter — call this from each dot's ref prop
  const setDotRef = useCallback(
    (nodeId: string) => (el: HTMLDivElement | null) => {
      if (el) {
        dotRefs.current.set(nodeId, el);
      } else {
        dotRefs.current.delete(nodeId);
      }
    },
    []
  );

  // Recalculate all dot positions relative to the container
  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const next = new Map<string, DotCenter>();

    dotRefs.current.forEach((el, nodeId) => {
      const dotRect = el.getBoundingClientRect();
      next.set(nodeId, {
        x: dotRect.left + dotRect.width / 2 - containerRect.left,
        y: dotRect.top + dotRect.height / 2 - containerRect.top,
      });
    });

    setDotPositions(next);
  }, [containerRef]);

  // ResizeObserver on the container — fires when ANY descendant resizes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      setRevision((r) => r + 1);
    });
    ro.observe(container);

    // Also observe every Rnd wrapper child that could resize
    const children = container.querySelectorAll("[data-matching-node]");
    children.forEach((child) => ro.observe(child));

    return () => ro.disconnect();
  }, [containerRef, dotRefs.current.size]);

  // Re-measure whenever revision changes (ResizeObserver fired)
  // or on mount / re-render from state changes
  useEffect(() => {
    // Use rAF to ensure the DOM has settled after React commits
    const id = requestAnimationFrame(() => measure());
    return () => cancelAnimationFrame(id);
  }, [measure, revision]);

  return { dotPositions, setDotRef, measure };
}

export default function MatchingQuestionRenderer({
  item,
  isPinned,
  isPreviewMode,
  studentState,
  setStudentState,
  updateCanvasItemConfig,
}: MatchingQuestionRendererProps) {
  const config = item.config as any;
  const defaultNodes: MatchingNode[] = [
    {
      id: "node-1",
      text: "Vế trái 1",
      matchId: "pair-1",
      side: "left",
      position: { x: 10, y: 20 },
      size: { width: 140, height: 40 },
    },
    {
      id: "node-2",
      text: "Vế phải 1",
      matchId: "pair-1",
      side: "right",
      position: { x: 220, y: 20 },
      size: { width: 140, height: 40 },
    },
    {
      id: "node-3",
      text: "Vế trái 2",
      matchId: "pair-2",
      side: "left",
      position: { x: 10, y: 90 },
      size: { width: 140, height: 40 },
    },
    {
      id: "node-4",
      text: "Vế phải 2",
      matchId: "pair-2",
      side: "right",
      position: { x: 220, y: 90 },
      size: { width: 140, height: 40 },
    },
  ];

  const nodes: MatchingNode[] =
    config.nodes && config.nodes.length > 0 ? config.nodes : defaultNodes;

  const [teacherActiveNode, setTeacherActiveNode] = useState<string | null>(
    null
  );

  const activeNodeId = isPreviewMode
    ? studentState.activeNode || null
    : teacherActiveNode;

  const connections: { leftId: string; rightId: string }[] = isPreviewMode
    ? studentState.connections || []
    : config.correctConnections || [];

  // ─── Container ref for coordinate system ───
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { dotPositions, setDotRef, measure } = useDotPositions(containerRef);

  // Re-measure after drag/resize operations settle
  const triggerRemeasure = useCallback(() => {
    requestAnimationFrame(() => measure());
  }, [measure]);

  const handleDotClick = (nodeId: string) => {
    if (!activeNodeId) {
      if (isPreviewMode) {
        setStudentState((prev: any) => ({ ...prev, activeNode: nodeId }));
      } else {
        setTeacherActiveNode(nodeId);
      }
      return;
    }

    if (activeNodeId === nodeId) {
      if (isPreviewMode) {
        setStudentState((prev: any) => ({ ...prev, activeNode: null }));
      } else {
        setTeacherActiveNode(null);
      }
      return;
    }

    const firstId = activeNodeId;
    const secondId = nodeId;

    if (isPreviewMode) {
      const currentConns: { leftId: string; rightId: string }[] =
        studentState.connections || [];
      const filtered = currentConns.filter(
        (c) =>
          !(
            c.leftId === firstId ||
            c.rightId === firstId ||
            c.leftId === secondId ||
            c.rightId === secondId
          )
      );
      setStudentState((prev: any) => ({
        ...prev,
        activeNode: null,
        connections: [...filtered, { leftId: firstId, rightId: secondId }],
      }));
    } else {
      const currentConns: { leftId: string; rightId: string }[] =
        config.correctConnections || [];
      const filtered = currentConns.filter(
        (c) =>
          !(
            c.leftId === firstId ||
            c.rightId === firstId ||
            c.leftId === secondId ||
            c.rightId === secondId
          )
      );
      updateCanvasItemConfig(item.id, {
        correctConnections: [
          ...filtered,
          { leftId: firstId, rightId: secondId },
        ],
      });
      setTeacherActiveNode(null);
    }
  };

  const handleRemoveConnection = (leftId: string, rightId: string) => {
    if (isPreviewMode) {
      const currentConns: { leftId: string; rightId: string }[] =
        studentState.connections || [];
      setStudentState((prev: any) => ({
        ...prev,
        connections: currentConns.filter(
          (c) => !(c.leftId === leftId && c.rightId === rightId)
        ),
      }));
    } else {
      const currentConns: { leftId: string; rightId: string }[] =
        config.correctConnections || [];
      updateCanvasItemConfig(item.id, {
        correctConnections: currentConns.filter(
          (c) => !(c.leftId === leftId && c.rightId === rightId)
        ),
      });
    }
  };

  const handleNodeTextChange = (nodeId: string, text: string) => {
    const updated = nodes.map((n) =>
      n.id === nodeId ? { ...n, text } : n
    );
    updateCanvasItemConfig(item.id, { nodes: updated });
  };

  const addNodePair = () => {
    const pairNum = Math.floor(nodes.length / 2) + 1;
    const matchId = `pair-${Date.now()}`;
    const leftNode: MatchingNode = {
      id: `node-${Date.now()}-L`,
      text: `Vế trái ${pairNum}`,
      matchId,
      side: "left",
      position: { x: 10, y: 20 + nodes.length * 30 },
      size: { width: 140, height: 40 },
    };
    const rightNode: MatchingNode = {
      id: `node-${Date.now()}-R`,
      text: `Vế phải ${pairNum}`,
      matchId,
      side: "right",
      position: { x: 220, y: 20 + nodes.length * 30 },
      size: { width: 140, height: 40 },
    };
    updateCanvasItemConfig(item.id, {
      nodes: [...nodes, leftNode, rightNode],
    });
  };

  // ─── Build Bezier path string ───
  // Creates a smooth horizontal-start / horizontal-end "S" curve
  const buildBezierPath = (
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): string => {
    const dx = Math.abs(x2 - x1);
    const curveFactor = dx * 0.45; // 45% of horizontal distance
    // Control points: extend horizontally from each endpoint
    const cp1x = x1 + curveFactor;
    const cp1y = y1;
    const cp2x = x2 - curveFactor;
    const cp2y = y2;
    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden p-1 flex flex-col gap-2 bg-transparent"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-indigo-200/60 pb-1 z-30">
        <span className="text-[10px] font-bold text-indigo-900 drop-shadow-sm">
          {isPreviewMode
            ? "Nhấp điểm kết nối giữa 2 vế tương ứng:"
            : "Kéo thả vị trí & nhấp nối cặp để tạo đáp án:"}
        </span>
        {!isPreviewMode && isPinned && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addNodePair();
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow"
          >
            <Plus size={12} className="inline mr-0.5" /> Thêm cặp
          </button>
        )}
      </div>

      {/* SVG Connector Layer — Bezier Curves */}
      <svg className="absolute inset-0 pointer-events-none w-full h-full z-10 overflow-visible">
        {connections.map((conn, idx) => {
          const p1 = dotPositions.get(conn.leftId);
          const p2 = dotPositions.get(conn.rightId);
          if (!p1 || !p2) return null;

          // Ensure left-to-right direction for the curve
          const [start, end] =
            p1.x <= p2.x ? [p1, p2] : [p2, p1];

          const pathD = buildBezierPath(start.x, start.y, end.x, end.y);

          return (
            <g
              key={idx}
              className="pointer-events-auto cursor-pointer group"
              onClick={() =>
                handleRemoveConnection(conn.leftId, conn.rightId)
              }
            >
              {/* Invisible thicker click/hover target */}
              <path
                d={pathD}
                fill="none"
                stroke="transparent"
                strokeWidth="16"
              />
              {/* Visible Bezier curve */}
              <path
                d={pathD}
                fill="none"
                stroke={isPreviewMode ? "#6366f1" : "#10b981"}
                strokeWidth="2"
                strokeLinecap="round"
                className="transition-all group-hover:stroke-red-500 group-hover:[stroke-width:3px]"
              />
            </g>
          );
        })}
      </svg>

      {/* Independent Nodes Rendered via Rnd */}
      <div className="flex-1 relative w-full h-full">
        {nodes.map((node) => {
          const isLeftSide =
            node.side === "left" ||
            (node.side !== "right" && node.position.x < 400);
          const isActive = activeNodeId === node.id;

          return (
            <Rnd
              key={node.id}
              bounds="parent"
              dragGrid={[10, 10]}
              enableResizing={isPinned && !isPreviewMode}
              disableDragging={!isPinned || isPreviewMode}
              dragHandleClassName="drag-handle"
              position={{ x: node.position.x, y: node.position.y }}
              size={{
                width: node.size?.width || "auto",
                height: node.size?.height || "auto",
              }}
              onDragStop={(e, d) => {
                const updated = nodes.map((n) =>
                  n.id === node.id
                    ? {
                      ...n,
                      position: {
                        x: Math.round(d.x),
                        y: Math.round(d.y),
                      },
                    }
                    : n
                );
                updateCanvasItemConfig(item.id, { nodes: updated });
                triggerRemeasure();
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                const updated = nodes.map((n) =>
                  n.id === node.id
                    ? {
                      ...n,
                      size: {
                        width: parseInt(ref.style.width, 10) || 140,
                        height: parseInt(ref.style.height, 10) || 40,
                      },
                      position: {
                        x: Math.round(position.x),
                        y: Math.round(position.y),
                      },
                    }
                    : n
                );
                updateCanvasItemConfig(item.id, { nodes: updated });
                triggerRemeasure();
              }}
              onDrag={() => triggerRemeasure()}
              onResize={() => triggerRemeasure()}
              className="z-20 relative"
              data-matching-node={node.id}
            >
              <div className="flex flex-row items-stretch bg-white/80 backdrop-blur-md border border-indigo-300 rounded-md text-indigo-900 shadow-sm overflow-hidden w-auto min-w-[120px] h-full focus-within:ring-2 focus-within:ring-indigo-400">
                {isPinned && !isPreviewMode && (
                  <div className="drag-handle cursor-grab active:cursor-grabbing flex items-center justify-center px-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 transition-colors border-r border-indigo-200/50 shrink-0">
                    <GripVertical size={15} />
                  </div>
                )}
                <div className="flex-1 flex items-center min-w-0 px-2.5 py-1">
                  {isPreviewMode ? (
                    <span className="w-full text-xs font-semibold text-indigo-900 select-none truncate">
                      {node.text}
                    </span>
                  ) : (
                    <TextareaAutosize
                      minRows={1}
                      value={node.text}
                      onChange={(e) =>
                        handleNodeTextChange(node.id, e.target.value)
                      }
                      onHeightChange={() => triggerRemeasure()}
                      placeholder="Nội dung node..."
                      className="w-full bg-transparent text-xs text-indigo-900 font-semibold focus:outline-none border-none min-w-0 resize-none"
                    />
                  )}
                </div>
              </div>

              {/* Connector Dot — ref'd for dynamic measurement */}
              {isLeftSide ? (
                <div
                  ref={setDotRef(node.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDotClick(node.id);
                  }}
                  title="Nhấp để nối"
                  className={`absolute top-1/2 -right-3 w-3 h-3 -translate-y-1/2 rounded-full cursor-pointer transition-all z-30 ${isActive
                    ? "bg-amber-400 ring-4 ring-amber-200 scale-125"
                    : "bg-slate-400 hover:bg-indigo-500 hover:scale-125"
                    }`}
                />
              ) : (
                <div
                  ref={setDotRef(node.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDotClick(node.id);
                  }}
                  title="Nhấp để nối"
                  className={`absolute top-1/2 -left-3 w-3 h-3 -translate-y-1/2 rounded-full cursor-pointer transition-all z-30 ${isActive
                    ? "bg-amber-400 ring-4 ring-amber-200 scale-125"
                    : "bg-slate-400 hover:bg-indigo-500 hover:scale-125"
                    }`}
                />
              )}
            </Rnd>
          );
        })}
      </div>
    </div>
  );
}
