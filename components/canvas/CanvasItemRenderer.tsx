"use client";

import React from "react";
import {
  CanvasItem,
  MultipleChoiceOption,
  BlankItem,
  DragDropZoneItem,
  ResequenceItem,
  ClassificationCategory,
  ClassificationItem,
  MatchingPair,
  HighlightZone,
} from "@/types/assignment";
import { useAssignmentEditorStore } from "@/store/useAssignmentEditorStore";
import { Rnd } from "react-rnd";
import { GripVertical, GripHorizontal, Plus, Check } from "lucide-react";
import MathLiveInput from "./MathLiveInput";
import MatchingQuestionRenderer from "./MatchingQuestionRenderer";
import TextareaAutosize from "react-textarea-autosize";

export const FROSTED_GLASS_CLASS =
  "bg-white/80 backdrop-blur-md border border-indigo-300 rounded-md text-indigo-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 p-2 min-h-[40px] w-full h-full flex items-center";

export const FROSTED_GLASS_INPUT = FROSTED_GLASS_CLASS;

interface CanvasItemRendererProps {
  item: CanvasItem;
  isPinned?: boolean;
  isPreviewMode?: boolean;
}

export default function CanvasItemRenderer({
  item,
  isPinned = false,
  isPreviewMode = false,
}: CanvasItemRendererProps) {
  const updateCanvasItemConfig = useAssignmentEditorStore(
    (state) => state.updateCanvasItemConfig
  );
  const [studentState, setStudentState] = React.useState<any>({});

  const config = item.config || {};
  const rootPos = (config as any).position || { x: 4, y: 4 };
  const rootSize = (config as any).size || { width: "auto", height: "auto" };

  switch (item.type) {
    case "multiple-choice": {
      const correctHash = (config as any).correctHash || "opt-a";
      const defaultOptions: MultipleChoiceOption[] = [
        { id: "opt-a", text: "A" },
        { id: "opt-b", text: "B" },
        { id: "opt-c", text: "C" },
        { id: "opt-d", text: "D" },
      ];
      const options: MultipleChoiceOption[] =
        (config as any).options && (config as any).options.length > 0
          ? (config as any).options
          : defaultOptions;

      const handleOptionDragEnd = (
        optId: string,
        newX: number,
        newY: number
      ) => {
        const updatedOptions = options.map((o) => {
          if (o.id !== optId) return o;
          return {
            ...o,
            position: {
              x: Math.round(newX),
              y: Math.round(newY),
            },
          };
        });
        updateCanvasItemConfig(item.id, { options: updatedOptions });
      };

      return (
        <div className="w-full h-full relative overflow-hidden">
          {options.map((opt, idx) => {
            const isSelected = isPreviewMode
              ? studentState.selectedHash === opt.id
              : correctHash === opt.id;
            const posX =
              opt.position?.x !== undefined ? opt.position.x : idx * 36 + 4;
            const posY =
              opt.position?.y !== undefined ? opt.position.y : 8;

            return (
              <Rnd
                key={opt.id}
                bounds="parent"
                dragGrid={[10, 10]}
                enableResizing={false}
                disableDragging={!isPinned}
                position={{ x: posX, y: posY }}
                onDragStop={(e, d) => {
                  handleOptionDragEnd(opt.id, d.x, d.y);
                }}
                className="z-10"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPreviewMode) {
                      setStudentState((prev: any) => ({
                        ...prev,
                        selectedHash: opt.id,
                      }));
                    } else {
                      updateCanvasItemConfig(item.id, { correctHash: opt.id });
                    }
                  }}
                  className={`h-7 w-7 rounded-full text-xs font-bold transition-all shadow-sm flex items-center justify-center select-none ${isPinned
                    ? "cursor-grab active:cursor-grabbing ring-1 ring-amber-400/60"
                    : "cursor-pointer"
                    } ${isSelected
                      ? "bg-purple-600 text-white ring-2 ring-purple-300 scale-105"
                      : "bg-slate-900/70 text-slate-200 border border-slate-600/80 hover:bg-slate-800/90"
                    }`}
                >
                  {opt.text || opt.id.replace("opt-", "").toUpperCase()}
                </button>
              </Rnd>
            );
          })}
        </div>
      );
    }

    case "multiple-selection": {
      const correctHashes: string[] =
        (config as any).correctHashes || ["opt-a"];
      const defaultOptions: MultipleChoiceOption[] = [
        { id: "opt-a", text: "A" },
        { id: "opt-b", text: "B" },
        { id: "opt-c", text: "C" },
        { id: "opt-d", text: "D" },
      ];
      const options: MultipleChoiceOption[] =
        (config as any).options && (config as any).options.length > 0
          ? (config as any).options
          : defaultOptions;

      const handleOptionDragEnd = (
        optId: string,
        newX: number,
        newY: number
      ) => {
        const updatedOptions = options.map((o) => {
          if (o.id !== optId) return o;
          return {
            ...o,
            position: {
              x: Math.round(newX),
              y: Math.round(newY),
            },
          };
        });
        updateCanvasItemConfig(item.id, { options: updatedOptions });
      };

      const toggleSelection = (optId: string) => {
        const exists = correctHashes.includes(optId);
        const nextHashes = exists
          ? correctHashes.filter((id) => id !== optId)
          : [...correctHashes, optId];
        updateCanvasItemConfig(item.id, { correctHashes: nextHashes });
      };

      return (
        <div className="w-full h-full relative overflow-hidden">
          {options.map((opt, idx) => {
            const isSelected = isPreviewMode
              ? (studentState.selectedHashes || []).includes(opt.id)
              : correctHashes.includes(opt.id);
            const posX =
              opt.position?.x !== undefined ? opt.position.x : idx * 36 + 4;
            const posY =
              opt.position?.y !== undefined ? opt.position.y : 8;

            return (
              <Rnd
                key={opt.id}
                bounds="parent"
                dragGrid={[10, 10]}
                enableResizing={false}
                disableDragging={!isPinned}
                position={{ x: posX, y: posY }}
                onDragStop={(e, d) => {
                  handleOptionDragEnd(opt.id, d.x, d.y);
                }}
                className="z-10"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPreviewMode) {
                      const prevHashes: string[] =
                        studentState.selectedHashes || [];
                      const exists = prevHashes.includes(opt.id);
                      const next = exists
                        ? prevHashes.filter((id) => id !== opt.id)
                        : [...prevHashes, opt.id];
                      setStudentState((prev: any) => ({
                        ...prev,
                        selectedHashes: next,
                      }));
                    } else {
                      toggleSelection(opt.id);
                    }
                  }}
                  className={`h-7 w-7 rounded-sm text-xs font-bold transition-all shadow-sm flex items-center justify-center select-none ${isPinned
                    ? "cursor-grab active:cursor-grabbing ring-1 ring-amber-400/60"
                    : "cursor-pointer"
                    } ${isSelected
                      ? "bg-purple-600 text-white ring-2 ring-purple-300 scale-105"
                      : "bg-slate-900/70 text-slate-200 border border-slate-600/80 hover:bg-slate-800/90"
                    }`}
                >
                  {opt.text || opt.id.replace("opt-", "").toUpperCase()}
                </button>
              </Rnd>
            );
          })}
        </div>
      );
    }

    case "true-false": {
      const correctAnswer =
        (config as any).correctAnswer !== undefined
          ? (config as any).correctAnswer
          : true;

      const isTrueSelected = isPreviewMode
        ? studentState.selectedAnswer === true
        : correctAnswer === true;
      const isFalseSelected = isPreviewMode
        ? studentState.selectedAnswer === false
        : correctAnswer === false;

      return (
        <div className="w-full h-full relative overflow-hidden">
          <Rnd
            bounds="parent"
            dragGrid={[10, 10]}
            enableResizing={false}
            disableDragging={!isPinned}
            position={{ x: rootPos.x, y: rootPos.y }}
            onDragStop={(e, d) => {
              updateCanvasItemConfig(item.id, {
                position: { x: Math.round(d.x), y: Math.round(d.y) },
              });
            }}
            className={`z-10 flex items-center gap-2 p-1 rounded transition-all ${isPinned
              ? "cursor-grab active:cursor-grabbing ring-1 ring-amber-400/60 bg-slate-950/60"
              : ""
              }`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isPreviewMode) {
                  setStudentState((prev: any) => ({
                    ...prev,
                    selectedAnswer: true,
                  }));
                } else {
                  updateCanvasItemConfig(item.id, { correctAnswer: true });
                }
              }}
              className={`px-3 py-1 rounded text-xs font-bold transition-all shadow-sm ${isTrueSelected
                ? "bg-emerald-600 text-white ring-2 ring-emerald-300 scale-105"
                : "bg-slate-900/70 text-slate-300 border border-slate-600/80 hover:bg-slate-800/80"
                }`}
            >
              Đúng (True)
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isPreviewMode) {
                  setStudentState((prev: any) => ({
                    ...prev,
                    selectedAnswer: false,
                  }));
                } else {
                  updateCanvasItemConfig(item.id, { correctAnswer: false });
                }
              }}
              className={`px-3 py-1 rounded text-xs font-bold transition-all shadow-sm ${isFalseSelected
                ? "bg-red-600 text-white ring-2 ring-red-300 scale-105"
                : "bg-slate-900/70 text-slate-300 border border-slate-600/80 hover:bg-slate-800/80"
                }`}
            >
              Sai (False)
            </button>
          </Rnd>
        </div>
      );
    }

    case "short-input": {
      const answers: string[] = (config as any).correctAnswers || [""];
      const currentAnswer = answers[0] || "";

      return (
        <div className="w-full h-full relative overflow-hidden">
          <Rnd
            bounds="parent"
            dragGrid={[10, 10]}
            enableResizing={isPinned}
            disableDragging={!isPinned}
            dragHandleClassName="drag-handle"
            position={{ x: rootPos.x, y: rootPos.y }}
            size={{
              width: (item.config as any).size?.width || "auto",
              height: (item.config as any).size?.height || "auto",
            }}
            onDragStop={(e, d) => {
              updateCanvasItemConfig(item.id, {
                position: { x: Math.round(d.x), y: Math.round(d.y) },
              });
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              updateCanvasItemConfig(item.id, {
                size: { width: ref.style.width, height: ref.style.height },
                position: {
                  x: Math.round(position.x),
                  y: Math.round(position.y),
                },
              });
            }}
            className="z-10 min-w-[150px] min-h-[34px]"
          >
            <div className="flex flex-row items-stretch bg-white/80 backdrop-blur-md border border-indigo-300 rounded-md text-indigo-900 shadow-sm overflow-hidden w-auto min-w-[120px] h-full focus-within:ring-2 focus-within:ring-indigo-400">
              {isPinned && !isPreviewMode && (
                <div
                  title="Kéo di chuyển vị trí ô nhập"
                  className="drag-handle cursor-grab active:cursor-grabbing flex items-center justify-center px-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 transition-colors border-r border-indigo-200/50 shrink-0"
                >
                  <GripVertical size={16} />
                </div>
              )}
              <TextareaAutosize
                minRows={1}
                value={isPreviewMode ? studentState.text || "" : currentAnswer}
                onChange={(e) => {
                  if (isPreviewMode) {
                    setStudentState((prev: any) => ({
                      ...prev,
                      text: e.target.value,
                    }));
                  } else {
                    updateCanvasItemConfig(item.id, {
                      correctAnswers: [e.target.value],
                    });
                  }
                }}
                placeholder={
                  isPreviewMode ? "Nhập câu trả lời..." : "Nhập đáp án đúng..."
                }
                className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 px-3 py-1.5 min-w-0 text-xs font-semibold placeholder:text-slate-500 resize-none"
              />
            </div>
          </Rnd>
        </div>
      );
    }

    case "math-input": {
      const correctMathjs = (config as any).correctMathjs || "";

      return (
        <div className="w-full h-full relative overflow-hidden">
          <Rnd
            bounds="parent"
            dragGrid={[10, 10]}
            enableResizing={isPinned && !isPreviewMode}
            disableDragging={!isPinned || isPreviewMode}
            dragHandleClassName="drag-handle"
            position={{ x: rootPos.x, y: rootPos.y }}
            size={rootSize}
            onDragStop={(e, d) => {
              updateCanvasItemConfig(item.id, {
                position: { x: Math.round(d.x), y: Math.round(d.y) },
              });
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              updateCanvasItemConfig(item.id, {
                size: { width: ref.style.width, height: ref.style.height },
                position: {
                  x: Math.round(position.x),
                  y: Math.round(position.y),
                },
              });
            }}
            className="z-10 min-w-[150px] min-h-[34px]"
          >
            <div className="flex flex-row items-stretch bg-white/80 backdrop-blur-md border border-indigo-300 rounded-md text-indigo-900 shadow-sm overflow-hidden w-full h-full focus-within:ring-2 focus-within:ring-indigo-400">
              {isPinned && !isPreviewMode && (
                <div
                  title="Kéo di chuyển vị trí biểu thức"
                  className="drag-handle cursor-grab active:cursor-grabbing flex items-center justify-center px-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 transition-colors border-r border-indigo-200/50 shrink-0"
                >
                  <GripVertical size={16} />
                </div>
              )}
              <div className="flex-1 min-w-0 flex items-center px-2 py-1">
                <MathLiveInput
                  value={
                    isPreviewMode ? studentState.text || "" : correctMathjs
                  }
                  onChange={(val) => {
                    if (isPreviewMode) {
                      setStudentState((prev: any) => ({
                        ...prev,
                        text: val,
                      }));
                    } else {
                      updateCanvasItemConfig(item.id, {
                        correctMathjs: val,
                      });
                    }
                  }}
                  placeholder={
                    isPreviewMode
                      ? "Nhập công thức/đáp án..."
                      : "Nhập biểu thức MathLive..."
                  }
                  className="w-full h-full bg-transparent border-none focus:outline-none focus:ring-0 text-xs font-semibold"
                />
              </div>
            </div>
          </Rnd>
        </div>
      );
    }

    case "drop-down": {
      const optionsList: { id: string; text: string }[] =
        (config as any).options || [];
      const correctHash = (config as any).correctHash || "";

      const optionsInputStr = optionsList.map((o) => o.text).join("; ");

      const handleOptionsChange = (str: string) => {
        const parts = str
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean);
        const newOptions = parts.map((text, idx) => ({
          id: `opt-${idx + 1}`,
          text,
        }));
        const validCorrect =
          newOptions.find((o) => o.id === correctHash)?.id ||
          newOptions[0]?.id ||
          "";
        updateCanvasItemConfig(item.id, {
          options: newOptions,
          correctHash: validCorrect,
        });
      };

      return (
        <div className="w-full h-full relative overflow-hidden">
          <Rnd
            bounds="parent"
            dragGrid={[10, 10]}
            enableResizing={isPinned}
            disableDragging={!isPinned}
            dragHandleClassName="drag-handle"
            position={{ x: rootPos.x, y: rootPos.y }}
            size={rootSize}
            onDragStop={(e, d) => {
              updateCanvasItemConfig(item.id, {
                position: { x: Math.round(d.x), y: Math.round(d.y) },
              });
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              updateCanvasItemConfig(item.id, {
                size: { width: ref.style.width, height: ref.style.height },
                position: {
                  x: Math.round(position.x),
                  y: Math.round(position.y),
                },
              });
            }}
            className="z-10 min-w-[180px] min-h-[56px]"
          >
            <div className="flex flex-row items-stretch bg-white/80 backdrop-blur-md border border-indigo-300 rounded-md text-indigo-900 shadow-sm overflow-hidden w-full h-full focus-within:ring-2 focus-within:ring-indigo-400">
              {isPinned && !isPreviewMode && (
                <div
                  title="Kéo di chuyển danh sách"
                  className="drag-handle cursor-grab active:cursor-grabbing flex items-center justify-center px-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 transition-colors border-r border-indigo-200/50 shrink-0"
                >
                  <GripVertical size={16} />
                </div>
              )}
              <div className="flex-1 min-w-0 flex items-center p-1.5">
                {isPreviewMode ? (
                  <select
                    value={studentState.selectedHash || ""}
                    onChange={(e) =>
                      setStudentState((prev: any) => ({
                        ...prev,
                        selectedHash: e.target.value,
                      }))
                    }
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-xs font-semibold"
                  >
                    <option value="">-- Chọn đáp án --</option>
                    {optionsList.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.text}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full h-full flex flex-col justify-center gap-1">
                    <TextareaAutosize
                      minRows={1}
                      defaultValue={optionsInputStr}
                      onBlur={(e) => handleOptionsChange(e.target.value)}
                      placeholder="Tùy chọn (ngăn cách bởi dấu ;)"
                      className="w-full bg-transparent border-b border-indigo-200 focus:outline-none px-1 py-0.5 text-xs font-semibold placeholder:text-slate-500 resize-none"
                    />
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-indigo-900 shrink-0">
                        Đúng:
                      </span>
                      <select
                        value={correctHash}
                        onChange={(e) =>
                          updateCanvasItemConfig(item.id, {
                            correctHash: e.target.value,
                          })
                        }
                        className="w-full bg-transparent border-none focus:outline-none text-xs font-semibold"
                      >
                        {optionsList.length === 0 ? (
                          <option value="">Chưa có lựa chọn</option>
                        ) : (
                          optionsList.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.text}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Rnd>
        </div>
      );
    }

    case "essay": {
      return (
        <div className="w-full h-full relative overflow-hidden">
          <Rnd
            bounds="parent"
            dragGrid={[10, 10]}
            enableResizing={isPinned}
            disableDragging={!isPinned}
            dragHandleClassName="drag-handle"
            position={{ x: rootPos.x, y: rootPos.y }}
            size={rootSize}
            onDragStop={(e, d) => {
              updateCanvasItemConfig(item.id, {
                position: { x: Math.round(d.x), y: Math.round(d.y) },
              });
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              updateCanvasItemConfig(item.id, {
                size: { width: ref.style.width, height: ref.style.height },
                position: {
                  x: Math.round(position.x),
                  y: Math.round(position.y),
                },
              });
            }}
            className="z-10 min-w-[160px] min-h-[60px]"
          >
            <div className="flex flex-row items-stretch bg-white/80 backdrop-blur-md border border-indigo-300 rounded-md text-indigo-900 shadow-sm overflow-hidden w-full h-full focus-within:ring-2 focus-within:ring-indigo-400">
              {isPinned && !isPreviewMode && (
                <div
                  title="Kéo di chuyển vùng tự luận"
                  className="drag-handle cursor-grab active:cursor-grabbing flex items-center justify-center px-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 transition-colors border-r border-indigo-200/50 shrink-0"
                >
                  <GripVertical size={16} />
                </div>
              )}
              <textarea
                disabled
                placeholder="Vùng học sinh viết tự luận"
                className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 p-2.5 resize-none text-xs font-semibold placeholder:text-slate-500 select-none cursor-default min-w-0"
              />
            </div>
          </Rnd>
        </div>
      );
    }

    case "fill-in-the-blanks": {
      const defaultBlanks: BlankItem[] = [
        {
          id: "blank-1",
          correctAnswer: "",
          position: { x: 4, y: 4 },
          size: { width: 160, height: 34 },
        },
      ];
      const blanks: BlankItem[] =
        (config as any).blanks && (config as any).blanks.length > 0
          ? (config as any).blanks
          : defaultBlanks;

      const handleBlankDragEnd = (
        blankId: string,
        newX: number,
        newY: number
      ) => {
        const updated = blanks.map((b) =>
          b.id === blankId
            ? { ...b, position: { x: Math.round(newX), y: Math.round(newY) } }
            : b
        );
        updateCanvasItemConfig(item.id, { blanks: updated });
      };

      const handleBlankResizeStop = (
        blankId: string,
        width: string,
        height: string,
        newX: number,
        newY: number
      ) => {
        const updated = blanks.map((b) =>
          b.id === blankId
            ? {
              ...b,
              size: { width, height },
              position: { x: Math.round(newX), y: Math.round(newY) },
            }
            : b
        );
        updateCanvasItemConfig(item.id, { blanks: updated });
      };

      const handleBlankChange = (blankId: string, val: string) => {
        const updated = blanks.map((b) =>
          b.id === blankId ? { ...b, correctAnswer: val } : b
        );
        updateCanvasItemConfig(item.id, { blanks: updated });
      };

      const addBlank = () => {
        if (blanks.length >= 10) return; // Increased maximum limit to 10
        const newBlank: BlankItem = {
          id: `blank-${Date.now()}`,
          correctAnswer: "",
          position: { x: 10, y: blanks.length * 42 + 10 },
          size: { width: 160, height: 34 },
        };
        updateCanvasItemConfig(item.id, { blanks: [...blanks, newBlank] });
      };

      return (
        <div className="w-full h-full relative overflow-hidden">
          {blanks.map((blank, idx) => {
            const posX = blank.position?.x ?? 4;
            const posY = blank.position?.y ?? idx * 42 + 4;
            const blankSize = blank.size || { width: 160, height: 34 };

            return (
              <Rnd
                key={blank.id}
                bounds="parent"
                dragGrid={[10, 10]}
                enableResizing={isPinned && !isPreviewMode}
                disableDragging={!isPinned || isPreviewMode}
                dragHandleClassName="drag-handle"
                position={{ x: posX, y: posY }}
                size={{
                  width: blank.size?.width || "auto",
                  height: blank.size?.height || "auto",
                }}
                onDragStop={(e, d) => {
                  handleBlankDragEnd(blank.id, d.x, d.y);
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  handleBlankResizeStop(
                    blank.id,
                    ref.style.width,
                    ref.style.height,
                    position.x,
                    position.y
                  );
                }}
                className="z-10 min-w-[140px] min-h-[34px]"
              >
                <div className="flex flex-row items-stretch bg-white/80 backdrop-blur-md border border-indigo-300 rounded-md text-indigo-900 shadow-sm overflow-hidden w-auto min-w-[120px] h-full focus-within:ring-2 focus-within:ring-indigo-400">
                  {isPinned && !isPreviewMode && (
                    <div
                      title="Kéo di chuyển ô điền từ"
                      className="drag-handle cursor-grab active:cursor-grabbing flex items-center justify-center px-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 transition-colors border-r border-indigo-200/50 shrink-0"
                    >
                      <GripVertical size={16} />
                    </div>
                  )}
                  <TextareaAutosize
                    minRows={1}
                    value={
                      isPreviewMode
                        ? studentState.blanks?.[blank.id] || ""
                        : blank.correctAnswer
                    }
                    onChange={(e) => {
                      if (isPreviewMode) {
                        setStudentState((prev: any) => ({
                          ...prev,
                          blanks: {
                            ...(prev.blanks || {}),
                            [blank.id]: e.target.value,
                          },
                        }));
                      } else {
                        handleBlankChange(blank.id, e.target.value);
                      }
                    }}
                    placeholder={
                      isPreviewMode
                        ? `Điền từ ô #${idx + 1}...`
                        : `Ô #${idx + 1} (đáp án)...`
                    }
                    className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 px-3 py-1.5 min-w-0 text-xs font-semibold placeholder:text-slate-500 resize-none"
                  />
                </div>
              </Rnd>
            );
          })}

          {isPinned && blanks.length < 10 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addBlank();
              }}
              className="absolute bottom-1.5 right-1.5 z-20 inline-flex items-center gap-1 bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-400/40 px-2 py-1 rounded text-[10px] font-bold shadow-md transition-all active:scale-95"
            >
              <Plus size={13} />
              Thêm ô ({blanks.length}/10)
            </button>
          )}
        </div>
      );
    }

    case "drawing": {
      return (
        <div className="w-full h-full relative overflow-hidden">
          <Rnd
            bounds="parent"
            dragGrid={[10, 10]}
            enableResizing={isPinned}
            disableDragging={!isPinned}
            position={{ x: rootPos.x, y: rootPos.y }}
            size={
              rootSize.width !== "auto"
                ? rootSize
                : { width: "100%", height: "100%" }
            }
            onDragStop={(e, d) => {
              updateCanvasItemConfig(item.id, {
                position: { x: Math.round(d.x), y: Math.round(d.y) },
              });
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              updateCanvasItemConfig(item.id, {
                size: { width: ref.style.width, height: ref.style.height },
                position: {
                  x: Math.round(position.x),
                  y: Math.round(position.y),
                },
              });
            }}
            className="z-10 border-2 border-dashed border-rose-500 bg-rose-500/10 rounded"
          >
            {isPinned && (
              <span className="absolute top-1 left-1 z-10 text-[10px] bg-slate-900/85 text-rose-300 px-2 py-0.5 rounded font-semibold select-none">
                Vùng vẽ tay
              </span>
            )}
          </Rnd>
        </div>
      );
    }

    case "highlight-text": {
      const defaultZones: HighlightZone[] = [
        {
          id: "hl-1",
          position: { x: 10, y: 10 },
          size: { width: 130, height: 26 },
          isCorrectAnswer: true,
        },
      ];
      const zones: HighlightZone[] =
        (config as any).highlightZones &&
          (config as any).highlightZones.length > 0
          ? (config as any).highlightZones
          : defaultZones;

      const toggleHighlightZone = (zoneId: string) => {
        const updated = zones.map((z) =>
          z.id === zoneId ? { ...z, isCorrectAnswer: !z.isCorrectAnswer } : z
        );
        updateCanvasItemConfig(item.id, { highlightZones: updated });
      };

      const addHighlightZone = () => {
        const newZone: HighlightZone = {
          id: `hl-${Date.now()}`,
          position: { x: 10, y: zones.length * 36 + 10 },
          size: { width: 130, height: 26 },
          isCorrectAnswer: true,
        };
        updateCanvasItemConfig(item.id, {
          highlightZones: [...zones, newZone],
        });
      };

      const selectedZones: string[] = studentState.selectedZones || [];

      return (
        <div className="w-full h-full relative overflow-hidden">
          {zones.map((zone, idx) => {
            const posX = zone.position?.x ?? 10;
            const posY = zone.position?.y ?? idx * 36 + 10;
            const zoneSize = zone.size || { width: 130, height: 26 };

            const isSelected = isPreviewMode
              ? selectedZones.includes(zone.id)
              : zone.isCorrectAnswer;

            const bgClass = isSelected
              ? isPreviewMode
                ? "bg-yellow-300/60 mix-blend-multiply"
                : "bg-yellow-300/40 mix-blend-multiply border-yellow-500"
              : "bg-transparent";

            const borderClass = isPreviewMode
              ? "border-transparent"
              : "border border-dashed border-slate-400";

            return (
              <Rnd
                key={zone.id}
                bounds="parent"
                dragGrid={[10, 10]}
                enableResizing={isPinned && !isPreviewMode}
                disableDragging={!isPinned || isPreviewMode}
                position={{ x: posX, y: posY }}
                size={zoneSize}
                onDragStop={(e, d) => {
                  const updated = zones.map((z) =>
                    z.id === zone.id
                      ? {
                        ...z,
                        position: {
                          x: Math.round(d.x),
                          y: Math.round(d.y),
                        },
                      }
                      : z
                  );
                  updateCanvasItemConfig(item.id, { highlightZones: updated });
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  const updated = zones.map((z) =>
                    z.id === zone.id
                      ? {
                        ...z,
                        size: {
                          width: ref.style.width,
                          height: ref.style.height,
                        },
                        position: {
                          x: Math.round(position.x),
                          y: Math.round(position.y),
                        },
                      }
                      : z
                  );
                  updateCanvasItemConfig(item.id, { highlightZones: updated });
                }}
                className={`z-10 rounded-sm transition-colors cursor-pointer relative ${bgClass} ${borderClass}`}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (isPreviewMode) {
                    const updatedSelected = selectedZones.includes(zone.id)
                      ? selectedZones.filter((id) => id !== zone.id)
                      : [...selectedZones, zone.id];
                    setStudentState((prev: any) => ({
                      ...prev,
                      selectedZones: updatedSelected,
                    }));
                  } else {
                    toggleHighlightZone(zone.id);
                  }
                }}
              >
                {!isPreviewMode && zone.isCorrectAnswer && (
                  <div className="absolute top-0.5 right-0.5 pointer-events-none">
                    <Check className="text-green-700" size={12} />
                  </div>
                )}
              </Rnd>
            );
          })}

          {isPinned && !isPreviewMode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addHighlightZone();
              }}
              className="absolute bottom-1.5 right-1.5 z-20 inline-flex items-center gap-1 bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-400/40 px-2.5 py-1 rounded text-[10px] font-bold shadow-md transition-all active:scale-95"
            >
              <Plus size={13} />
              Thêm vùng đánh dấu
            </button>
          )}
        </div>
      );
    }

    case "drag-and-drop": {
      const defaultZones: DragDropZoneItem[] = [
        {
          id: "dz-1",
          expectedWord: "Từ 1",
          position: { x: 10, y: 10 },
          size: { width: 110, height: 32 },
        },
      ];
      const dropZones: DragDropZoneItem[] =
        (config as any).dropZones && (config as any).dropZones.length > 0
          ? (config as any).dropZones
          : defaultZones;

      const rawBank = (config as any).wordBank;
      const wordBankItems: { id: string; text: string }[] = Array.isArray(
        rawBank
      )
        ? rawBank.map((w: any, idx: number) =>
          typeof w === "string" ? { id: `wb-${idx}`, text: w } : w
        )
        : [
          { id: "wb-1", text: "Từ 1" },
          { id: "wb-2", text: "Từ 2" },
        ];

      const handleZoneChange = (zoneId: string, val: string) => {
        const updated = dropZones.map((z) =>
          z.id === zoneId ? { ...z, expectedWord: val } : z
        );
        updateCanvasItemConfig(item.id, { dropZones: updated });
      };

      const addDropZone = () => {
        const newZone: DragDropZoneItem = {
          id: `dz-${Date.now()}`,
          expectedWord: `Từ ${dropZones.length + 1}`,
          position: { x: 10, y: dropZones.length * 40 + 10 },
          size: { width: 110, height: 32 },
        };
        updateCanvasItemConfig(item.id, {
          dropZones: [...dropZones, newZone],
        });
      };

      const addWordBankItem = () => {
        const newItem = { id: `wb-${Date.now()}`, text: "Từ mới" };
        updateCanvasItemConfig(item.id, {
          wordBank: [...wordBankItems, newItem],
        });
      };

      const updateWordBankItemText = (id: string, newText: string) => {
        const updated = wordBankItems.map((wb) =>
          wb.id === id ? { ...wb, text: newText } : wb
        );
        updateCanvasItemConfig(item.id, { wordBank: updated });
      };

      return (
        <div className="w-full h-full relative overflow-hidden">
          {dropZones.map((zone, idx) => {
            const posX = zone.position?.x ?? 10;
            const posY = zone.position?.y ?? idx * 40 + 10;
            const zoneSize = zone.size || { width: 110, height: 32 };

            return (
              <Rnd
                key={zone.id}
                bounds="parent"
                dragGrid={[10, 10]}
                enableResizing={isPinned && !isPreviewMode}
                disableDragging={!isPinned || isPreviewMode}
                dragHandleClassName="drag-handle"
                position={{ x: posX, y: posY }}
                size={zoneSize}
                onDragStop={(e, d) => {
                  const updated = dropZones.map((z) =>
                    z.id === zone.id
                      ? {
                        ...z,
                        position: {
                          x: Math.round(d.x),
                          y: Math.round(d.y),
                        },
                      }
                      : z
                  );
                  updateCanvasItemConfig(item.id, { dropZones: updated });
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  const updated = dropZones.map((z) =>
                    z.id === zone.id
                      ? {
                        ...z,
                        size: {
                          width: ref.style.width,
                          height: ref.style.height,
                        },
                        position: {
                          x: Math.round(position.x),
                          y: Math.round(position.y),
                        },
                      }
                      : z
                  );
                  updateCanvasItemConfig(item.id, { dropZones: updated });
                }}
                className="z-10 min-w-[100px] min-h-[32px]"
              >
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const word = e.dataTransfer.getData("text/plain");
                    if (word) {
                      if (!isPreviewMode) {
                        handleZoneChange(zone.id, word);
                      } else {
                        setStudentState((prev: any) => ({
                          ...prev,
                          dropZones: {
                            ...(prev.dropZones || {}),
                            [zone.id]: word,
                          },
                        }));
                      }
                    }
                  }}
                  className="flex flex-row items-stretch bg-white/80 backdrop-blur-md border border-indigo-300 rounded-md text-indigo-900 shadow-sm overflow-hidden w-full h-full focus-within:ring-2 focus-within:ring-indigo-400"
                >
                  {isPinned && !isPreviewMode && (
                    <div
                      title="Kéo di chuyển vùng kéo thả"
                      className="drag-handle cursor-grab active:cursor-grabbing flex items-center justify-center px-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 transition-colors border-r border-indigo-200/50 shrink-0"
                    >
                      <GripVertical size={15} />
                    </div>
                  )}
                  <input
                    type="text"
                    value={
                      isPreviewMode
                        ? studentState.dropZones?.[zone.id] || ""
                        : zone.expectedWord
                    }
                    onChange={(e) => {
                      if (!isPreviewMode)
                        handleZoneChange(zone.id, e.target.value);
                    }}
                    placeholder={
                      isPreviewMode ? "Thả từ vào đây..." : "Từ đích..."
                    }
                    readOnly={isPreviewMode}
                    className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 px-2.5 py-1 min-w-0 text-xs font-bold placeholder:text-slate-500"
                  />
                </div>
              </Rnd>
            );
          })}

          {/* Word Bank Bottom Section */}
          <div className="absolute bottom-1.5 left-2 right-2 z-20 flex items-center justify-between gap-2 bg-slate-900/85 backdrop-blur-sm border border-slate-700 rounded-full px-3 py-1 shadow-md">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full">
              <span className="text-[10px] font-bold text-slate-300 shrink-0">
                Word Bank:
              </span>
              {wordBankItems.map((wb) => (
                <div
                  key={wb.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", wb.text);
                  }}
                  className="flex flex-row items-center bg-white/80 backdrop-blur-md border border-indigo-300 rounded-md text-indigo-900 shadow-sm overflow-hidden text-[11px] font-semibold transition-all select-none cursor-grab active:cursor-grabbing"
                >
                  {!isPreviewMode && (
                    <div className="flex items-center justify-center px-1.5 py-1 text-indigo-400 border-r border-indigo-200/50">
                      <GripVertical size={13} />
                    </div>
                  )}
                  {isPreviewMode ? (
                    <span className="px-2.5 py-1">{wb.text}</span>
                  ) : (
                    <input
                      type="text"
                      value={wb.text}
                      onChange={(e) =>
                        updateWordBankItemText(wb.id, e.target.value)
                      }
                      className="bg-transparent text-indigo-900 font-semibold text-[11px] w-16 focus:outline-none focus:w-24 px-2 py-1"
                    />
                  )}
                </div>
              ))}
              {!isPreviewMode && (
                <button
                  type="button"
                  onClick={addWordBankItem}
                  className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 shadow transition-colors"
                >
                  <Plus size={11} /> Thêm từ
                </button>
              )}
            </div>
            {isPinned && !isPreviewMode && (
              <button
                type="button"
                onClick={addDropZone}
                className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2 py-0.5 rounded-full text-[10px] shrink-0"
              >
                <Plus size={12} /> Thêm vùng
              </button>
            )}
          </div>
        </div>
      );
    }

    case "re-sequence": {
      const defaultItems: ResequenceItem[] = [
        { id: "seq-1", text: "Bước 1", correctOrder: 1 },
        { id: "seq-2", text: "Bước 2", correctOrder: 2 },
      ];
      const items: ResequenceItem[] =
        (config as any).items && (config as any).items.length > 0
          ? (config as any).items
          : defaultItems;

      const displayItems: ResequenceItem[] = isPreviewMode
        ? studentState.orderedItems || items
        : items;

      const handleItemTextChange = (id: string, text: string) => {
        const updated = items.map((it) =>
          it.id === id ? { ...it, text } : it
        );
        updateCanvasItemConfig(item.id, { items: updated });
      };

      const addItem = () => {
        const nextOrder = items.length + 1;
        updateCanvasItemConfig(item.id, {
          items: [
            ...items,
            {
              id: `seq-${Date.now()}`,
              text: `Bước ${nextOrder}`,
              correctOrder: nextOrder,
            },
          ],
        });
      };

      return (
        <div className="!h-auto !w-fit min-w-[300px] relative overflow-hidden p-1.5 flex flex-col gap-1.5 bg-transparent">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-900 drop-shadow-sm">
              {isPreviewMode
                ? "Kéo thả để sắp xếp đúng thứ tự:"
                : "Sắp xếp theo thứ tự đúng:"}
            </span>
            <span className="text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
              HTML5 Drag & Drop
            </span>
          </div>
          <div className="flex-1 flex flex-col items-start gap-1.5 overflow-y-auto">
            {displayItems.map((it, index) => (
              <div
                key={it.id}
                draggable={isPinned || isPreviewMode}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", String(index));
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromIdxStr = e.dataTransfer.getData("text/plain");
                  const fromIdx = parseInt(fromIdxStr, 10);
                  if (isNaN(fromIdx) || fromIdx === index) return;

                  const currentList = [...displayItems];
                  const [moved] = currentList.splice(fromIdx, 1);
                  currentList.splice(index, 0, moved);

                  if (isPreviewMode) {
                    setStudentState((prev: any) => ({
                      ...prev,
                      orderedItems: currentList,
                    }));
                  } else {
                    updateCanvasItemConfig(item.id, { items: currentList });
                  }
                }}
                className={`w-max min-w-[200px] flex items-center gap-1.5 px-2 py-1.5 transition-all ${FROSTED_GLASS_INPUT} ${isPinned || isPreviewMode
                  ? "cursor-grab active:cursor-grabbing hover:border-indigo-500 hover:shadow"
                  : ""
                  }`}
              >
                <GripHorizontal size={14} className="text-indigo-600 shrink-0" />
                <span className="text-[11px] font-bold text-indigo-950 shrink-0 w-5">
                  #{index + 1}
                </span>
                <input
                  type="text"
                  value={it.text}
                  onChange={(e) =>
                    !isPreviewMode && handleItemTextChange(it.id, e.target.value)
                  }
                  readOnly={isPreviewMode}
                  placeholder="Nội dung bước..."
                  className="w-full bg-transparent text-xs text-indigo-900 font-semibold focus:outline-none"
                />
              </div>
            ))}
          </div>

          {!isPreviewMode && isPinned && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addItem();
              }}
              className="self-end inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded text-[10px] font-bold shadow transition-all"
            >
              <Plus size={12} /> Thêm bước
            </button>
          )}
        </div>
      );
    }

    case "matching": {
      return (
        <MatchingQuestionRenderer
          item={item}
          isPinned={isPinned}
          isPreviewMode={isPreviewMode}
          studentState={studentState}
          setStudentState={setStudentState}
          updateCanvasItemConfig={updateCanvasItemConfig}
        />
      );
    }

    case "classification": {
      const defaultCategories: ClassificationCategory[] = [
        { id: "cat-1", title: "Nhóm A" },
        { id: "cat-2", title: "Nhóm B" },
      ];
      const defaultItems: ClassificationItem[] = [
        { id: "item-1", text: "Mục 1", categoryId: "cat-1" },
        { id: "item-2", text: "Mục 2", categoryId: "cat-2" },
      ];
      const categories: ClassificationCategory[] =
        (config as any).categories && (config as any).categories.length > 0
          ? (config as any).categories
          : defaultCategories;
      const items: ClassificationItem[] =
        (config as any).items && (config as any).items.length > 0
          ? (config as any).items
          : defaultItems;

      const studentClassified: Record<string, string> =
        studentState.classifiedItems || {};

      const getItemCategory = (itemId: string) => {
        if (isPreviewMode) {
          return studentClassified[itemId] || "";
        }
        const found = items.find((it) => it.id === itemId);
        return found?.categoryId || "";
      };

      const handleDropToCategory = (itemId: string, targetCatId: string) => {
        if (isPreviewMode) {
          setStudentState((prev: any) => ({
            ...prev,
            classifiedItems: {
              ...(prev.classifiedItems || {}),
              [itemId]: targetCatId,
            },
          }));
        } else {
          const updated = items.map((it) =>
            it.id === itemId ? { ...it, categoryId: targetCatId } : it
          );
          updateCanvasItemConfig(item.id, { items: updated });
        }
      };

      const handleCategoryChange = (catId: string, title: string) => {
        const updated = categories.map((c) =>
          c.id === catId ? { ...c, title } : c
        );
        updateCanvasItemConfig(item.id, { categories: updated });
      };

      const handleItemTextChange = (itemId: string, text: string) => {
        const updated = items.map((it) =>
          it.id === itemId ? { ...it, text } : it
        );
        updateCanvasItemConfig(item.id, { items: updated });
      };

      const addCategory = () => {
        const nextId = `cat-${Date.now()}`;
        updateCanvasItemConfig(item.id, {
          categories: [
            ...categories,
            { id: nextId, title: `Nhóm ${categories.length + 1}` },
          ],
        });
      };

      const addItem = () => {
        const nextId = `item-${Date.now()}`;
        updateCanvasItemConfig(item.id, {
          items: [
            ...items,
            {
              id: nextId,
              text: `Mục ${items.length + 1}`,
              categoryId: "",
            },
          ],
        });
      };

      const unassignedItems = items.filter(
        (it) => !getItemCategory(it.id)
      );

      return (
        <div className="w-full h-full relative overflow-hidden p-1.5 flex flex-col gap-2 bg-white/70 backdrop-blur-sm rounded-lg border border-indigo-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-indigo-200 pb-1">
            <span className="text-[10px] font-bold text-indigo-900">
              {isPreviewMode
                ? "Kéo thả mục vào đúng nhóm phân loại:"
                : "Thiết lập nhóm phân loại (Kéo thả mục vào nhóm):"}
            </span>
            {!isPreviewMode && isPinned && (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addCategory();
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow"
                >
                  + Nhóm
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addItem();
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold shadow"
                >
                  + Mục
                </button>
              </div>
            )}
          </div>

          {/* Categories Drop Zones */}
          <div className="grid grid-cols-2 gap-2 flex-1 min-h-[90px]">
            {categories.map((cat) => {
              const catItems = items.filter(
                (it) => getItemCategory(it.id) === cat.id
              );
              return (
                <div
                  key={cat.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const itemId = e.dataTransfer.getData("text/plain");
                    if (itemId) handleDropToCategory(itemId, cat.id);
                  }}
                  className="flex flex-col rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50/60 p-1.5 transition-all hover:border-indigo-500"
                >
                  <input
                    type="text"
                    value={cat.title}
                    onChange={(e) =>
                      !isPreviewMode &&
                      handleCategoryChange(cat.id, e.target.value)
                    }
                    readOnly={isPreviewMode}
                    className="w-full bg-indigo-900 text-white rounded px-2 py-0.5 text-xs font-bold text-center focus:outline-none mb-1.5 shadow-sm"
                  />
                  <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                    {catItems.map((it) => (
                      <div
                        key={it.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", it.id);
                        }}
                        className="bg-white border border-indigo-200 rounded px-2 py-1 text-xs font-semibold text-indigo-950 shadow-sm cursor-grab active:cursor-grabbing flex items-center justify-between"
                      >
                        <input
                          type="text"
                          value={it.text}
                          readOnly={isPreviewMode}
                          onChange={(e) =>
                            !isPreviewMode &&
                            handleItemTextChange(it.id, e.target.value)
                          }
                          className="bg-transparent w-full focus:outline-none"
                        />
                      </div>
                    ))}
                    {catItems.length === 0 && (
                      <div className="h-full min-h-[28px] flex items-center justify-center text-[10px] text-indigo-400 italic">
                        Thả mục vào đây
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Item Bank (Unassigned Items) */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const itemId = e.dataTransfer.getData("text/plain");
              if (itemId) handleDropToCategory(itemId, "");
            }}
            className="rounded-lg border border-slate-300 bg-slate-100/90 p-1.5 min-h-[36px]"
          >
            <span className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
              Kho mục (Kéo thả vào nhóm):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {unassignedItems.map((it) => (
                <div
                  key={it.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", it.id);
                  }}
                  className="bg-white border border-indigo-300 rounded-md px-2.5 py-1 text-xs font-bold text-indigo-900 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-500"
                >
                  <input
                    type="text"
                    value={it.text}
                    readOnly={isPreviewMode}
                    onChange={(e) =>
                      !isPreviewMode &&
                      handleItemTextChange(it.id, e.target.value)
                    }
                    className="bg-transparent max-w-[100px] focus:outline-none"
                  />
                </div>
              ))}
              {unassignedItems.length === 0 && (
                <span className="text-[10px] text-slate-400 italic px-1">
                  Đã phân loại hết các mục
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-[11px] text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded">
            Vùng tương tác
          </span>
        </div>
      );
  }
}
