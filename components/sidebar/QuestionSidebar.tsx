"use client";

import React from "react";
import { useAssignmentEditorStore } from "@/store/useAssignmentEditorStore";
import { SidebarItem, ItemType } from "@/types/assignment";
import { MathInput } from "@/components/ui/MathInput";
import {
  ListOrdered,
  TextCursorInput,
  ChevronDownSquare,
  Calculator,
  CheckSquare,
  AlignLeft,
  Trash2,
  HelpCircle,
  ListPlus,
  Plus,
  FormInput,
  PenTool,
  CheckCircle2,
  Copy,
  Pin,
  PlusSquare,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";

export default function QuestionSidebar() {
  const {
    draft,
    addSidebarItem,
    updateItem,
    deleteItem,
    duplicateSidebarItem,
    isPreviewMode,
  } = useAssignmentEditorStore(
    useShallow((s) => ({
      draft: s.draft,
      addSidebarItem: s.addSidebarItem,
      updateItem: s.updateItem,
      deleteItem: s.deleteItem,
      duplicateSidebarItem: s.duplicateSidebarItem,
      isPreviewMode: s.isPreviewMode,
    }))
  );

  const studentAnswers = useAssignmentEditorStore(
    (state) => state.studentAnswers
  );
  const setStudentAnswer = useAssignmentEditorStore(
    (state) => state.setStudentAnswer
  );

  if (!draft) return null;

  // Gather all items placed in sidebar
  const sidebarItems: SidebarItem[] = [];
  draft.sections.forEach((section) => {
    section.items.forEach((item) => {
      if (item.placement === "sidebar") {
        sidebarItems.push(item as SidebarItem);
      }
    });
  });

  return (
    <aside className="h-full w-full bg-slate-900 flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/95 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
            <ListPlus className="h-4 w-4 text-purple-400" />
            {isPreviewMode
              ? "Bài làm (Chế độ Học sinh)"
              : "Danh sách Câu hỏi Sidebar"}
          </h2>
          <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[11px] font-semibold text-purple-300">
            {sidebarItems.length} Câu
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          {isPreviewMode
            ? "Trả lời các câu hỏi bên dưới."
            : "Các câu hỏi hiển thị cho học sinh trả lời ở bảng điều khiển bên phải."}
        </p>
      </div>

      {/* List of Sidebar Question Cards */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3.5">
        {sidebarItems.length === 0 ? (
          <div className="h-44 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-4">
            <HelpCircle className="h-7 w-7 text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-400">
              Chưa có câu hỏi nào trong Sidebar
            </p>
          </div>
        ) : (
          sidebarItems.map((item, index) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-lg hover:border-slate-700 transition-all flex flex-col gap-3"
            >
              {/* Card Header */}
              <div className="flex flex-col gap-2 mb-3">
                <div className="flex flex-row items-center w-full gap-2">
                  {/* Left Side: Badge & Title (Takes remaining space, truncates if too long) */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold shrink-0">
                      #{index + 1}
                    </span>
                    <input
                      type="text"
                      value={item.name}
                      readOnly={isPreviewMode}
                      onChange={(e) =>
                        updateItem(item.id, { name: e.target.value })
                      }
                      className="bg-transparent font-semibold text-white text-sm border-b border-transparent hover:border-slate-700 focus:border-purple-500 focus:outline-none px-1 truncate w-full"
                    />
                  </div>

                  {/* Right Side: Actions & Points (Never shrinks) */}
                  <div className="flex items-center gap-1 shrink-0 text-slate-400">
                    {!isPreviewMode && (
                      <>
                        <button
                          type="button"
                          onClick={() => duplicateSidebarItem(item.id)}
                          title="Nhân bản câu hỏi"
                          className="p-1 hover:text-white hover:bg-slate-700 rounded transition-colors"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          type="button"
                          title="Ghim / Đánh dấu"
                          className="p-1 hover:text-white hover:bg-slate-700 rounded transition-colors"
                        >
                          <Pin size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => addSidebarItem(item.type)}
                          title="Tạo phần / Thêm câu hỏi cùng dạng"
                          className="p-1 hover:text-white hover:bg-slate-700 rounded transition-colors"
                        >
                          <PlusSquare size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          title="Xóa câu hỏi này"
                          className="p-1 hover:text-rose-400 hover:bg-slate-700 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}

                    {/* Points input: Moved to the end, made much smaller */}
                    <div className="flex items-center bg-slate-800 rounded px-1 border border-slate-700 ml-1">
                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        readOnly={isPreviewMode}
                        value={item.points}
                        onChange={(e) =>
                          updateItem(item.id, {
                            points: Number(e.target.value) || 0,
                          })
                        }
                        className="w-8 h-5 bg-transparent text-[10px] text-white text-center focus:outline-none font-mono"
                      />
                      <span className="text-[10px] ml-0.5 font-mono">đ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prompt Input */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-semibold text-slate-400">
                  Đề bài / Yêu cầu
                </label>
                <textarea
                  rows={2}
                  readOnly={isPreviewMode}
                  value={item.prompt || ""}
                  onChange={(e) =>
                    updateItem(item.id, { prompt: e.target.value })
                  }
                  placeholder="Nhập câu hỏi cho học sinh..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all resize-none"
                />
              </div>

              {/* Specific Config based on Type */}
              {item.type === "multiple-choice" && (
                <div className="space-y-1.5 border-t border-slate-800/80 pt-2">
                  <span className="text-[10px] font-semibold text-purple-300 uppercase">
                    Các lựa chọn:
                  </span>
                  {item.config.options.map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={
                          isPreviewMode
                            ? (Array.isArray(studentAnswers[item.id])
                                ? studentAnswers[item.id]
                                : typeof studentAnswers[item.id] === "string" &&
                                  studentAnswers[item.id]
                                ? studentAnswers[item.id].split(",")
                                : []
                              ).includes(opt.id)
                            : (
                                item.config.correctHashes || [
                                  item.config.correctHash,
                                ]
                              ).includes(opt.id)
                        }
                        onChange={() => {
                          if (isPreviewMode) {
                            const currentAnswerVal = studentAnswers[item.id];
                            const currentAnswer: string[] = Array.isArray(
                              currentAnswerVal
                            )
                              ? currentAnswerVal
                              : typeof currentAnswerVal === "string" &&
                                currentAnswerVal.trim().length > 0
                              ? currentAnswerVal.split(",")
                              : [];
                            let newAnswer = [...currentAnswer];
                            if (newAnswer.includes(opt.id)) {
                              newAnswer = newAnswer.filter(
                                (id) => id !== opt.id
                              );
                            } else {
                              newAnswer = [opt.id];
                            }
                            setStudentAnswer(item.id, newAnswer);
                          } else {
                            const current: string[] =
                              item.config.correctHashes ||
                              (item.config.correctHash
                                ? [item.config.correctHash]
                                : []);
                            const next = current.includes(opt.id)
                              ? current.filter((id) => id !== opt.id)
                              : [...current, opt.id];
                            updateItem(item.id, {
                              config: {
                                ...item.config,
                                correctHash: next[0] || "",
                                correctHashes: next,
                              },
                            });
                          }
                        }}
                        className="rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700"
                      />
                      <input
                        type="text"
                        value={opt.text}
                        readOnly={isPreviewMode}
                        onChange={(e) => {
                          if (item.type !== "multiple-choice" || isPreviewMode)
                            return;
                          const updatedOptions = item.config.options.map((o) =>
                            o.id === opt.id
                              ? { ...o, text: e.target.value }
                              : o
                          );
                          updateItem(item.id, {
                            config: {
                              ...item.config,
                              options: updatedOptions,
                            },
                          });
                        }}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              {item.type === "math-input" && (
                <div className="space-y-1 border-t border-slate-800/80 pt-2">
                  <span className="text-[10px] font-semibold text-indigo-300 uppercase">
                    {isPreviewMode ? "Trả lời công thức:" : "Công thức (MathJS):"}
                  </span>
                  {!isPreviewMode ? (
                    <MathInput
                      value={item.config.correctMathjs || ""}
                      onChange={(latex) => {
                        if (item.type !== "math-input") return;
                        updateItem(item.id, {
                          config: {
                            ...item.config,
                            correctMathjs: latex,
                          },
                        });
                      }}
                      placeholder="Nhập đáp án công thức LaTeX..."
                    />
                  ) : (
                    <MathInput
                      value={studentAnswers[item.id] || ""}
                      onChange={(latex) => setStudentAnswer(item.id, latex)}
                      placeholder="Nhập câu trả lời toán học..."
                    />
                  )}
                </div>
              )}

              {item.type === "short-input" && (
                <div className="space-y-1 border-t border-slate-800/80 pt-2">
                  <span className="text-[10px] font-semibold text-sky-300 uppercase">
                    {isPreviewMode
                      ? "câu trả lời của bạn:"
                      : "Đáp án trả lời ngắn (cách nhau bởi dấu phẩy):"}
                  </span>
                  {!isPreviewMode ? (
                    <input
                      type="text"
                      value={item.config.correctAnswers.join(", ")}
                      onChange={(e) => {
                        if (item.type !== "short-input") return;
                        const answers = e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        updateItem(item.id, {
                          config: {
                            ...item.config,
                            correctAnswers:
                              answers.length > 0 ? answers : [""],
                          },
                        });
                      }}
                      placeholder="Nhập đáp án đúng..."
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={studentAnswers[item.id] || ""}
                      onChange={(e) =>
                        setStudentAnswer(item.id, e.target.value)
                      }
                      placeholder="Nhập câu trả lời..."
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
                    />
                  )}
                </div>
              )}

              {item.type === "true-false" && (
                <div className="space-y-2 border-t border-slate-800/80 pt-2">
                  <span className="text-[10px] font-semibold text-emerald-300 uppercase block">
                    {isPreviewMode
                      ? "Chọn đáp án:"
                      : "Chọn đáp án đúng (Đúng / Sai):"}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isPreviewMode) {
                          setStudentAnswer(item.id, "true");
                          return;
                        }
                        if (item.type !== "true-false") return;
                        updateItem(item.id, {
                          config: { ...item.config, correctAnswer: true },
                        });
                      }}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition-all ${
                        (isPreviewMode && studentAnswers[item.id] === "true") ||
                        (!isPreviewMode && item.config.correctAnswer === true)
                          ? "bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      Đúng (True)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isPreviewMode) {
                          setStudentAnswer(item.id, "false");
                          return;
                        }
                        if (item.type !== "true-false") return;
                        updateItem(item.id, {
                          config: { ...item.config, correctAnswer: false },
                        });
                      }}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition-all ${
                        (isPreviewMode && studentAnswers[item.id] === "false") ||
                        (!isPreviewMode && item.config.correctAnswer === false)
                          ? "bg-rose-600/20 border-rose-500 text-rose-300 shadow"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      Sai (False)
                    </button>
                  </div>
                </div>
              )}

              {item.type === "drop-down" && (
                <div className="space-y-2 border-t border-slate-800/80 pt-2">
                  <span className="text-[10px] font-semibold text-amber-300 uppercase block">
                    Chọn từ danh sách:
                  </span>
                  {!isPreviewMode ? (
                    <>
                      <div className="space-y-1.5">
                        {item.config.options.map((opt) => (
                          <div
                            key={opt.id}
                            className="flex items-center gap-2 text-xs"
                          >
                            <input
                              type="radio"
                              name={`correct-dropdown-${item.id}`}
                              checked={item.config.correctHash === opt.id}
                              onChange={() => {
                                if (item.type !== "drop-down") return;
                                updateItem(item.id, {
                                  config: {
                                    ...item.config,
                                    correctHash: opt.id,
                                  },
                                });
                              }}
                              className="text-amber-500 focus:ring-amber-500"
                            />
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => {
                                if (item.type !== "drop-down") return;
                                const updatedOptions =
                                  item.config.options.map((o) =>
                                    o.id === opt.id
                                      ? { ...o, text: e.target.value }
                                      : o
                                  );
                                updateItem(item.id, {
                                  config: {
                                    ...item.config,
                                    options: updatedOptions,
                                  },
                                });
                              }}
                              className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <select
                      value={studentAnswers[item.id] || ""}
                      onChange={(e) =>
                        setStudentAnswer(item.id, e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-slate-200"
                    >
                      <option value="">-- Chọn đáp án --</option>
                      {item.config.options.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.text}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {item.type === "essay" && (
                <div className="space-y-2 border-t border-slate-800/80 pt-2">
                  <textarea
                    rows={3}
                    readOnly={!isPreviewMode}
                    value={studentAnswers[item.id] || ""}
                    onChange={(e) => setStudentAnswer(item.id, e.target.value)}
                    placeholder={
                      isPreviewMode
                        ? "Học sinh nhập bài tự luận tại đây..."
                        : "Vùng trả lời tự luận (Học sinh sẽ nhập)..."
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 resize-none"
                  />
                </div>
              )}

              {item.type === "multiple-selection" && (
                <div className="space-y-2 border-t border-slate-800/80 pt-2">
                  <span className="text-[10px] font-semibold text-purple-300 uppercase block">
                    Chọn nhiều đáp án:
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {item.config.options.map((o) => {
                      const currentAnswerVal = studentAnswers[item.id];
                      const currentArr: string[] = Array.isArray(
                        currentAnswerVal
                      )
                        ? currentAnswerVal
                        : typeof currentAnswerVal === "string" &&
                          currentAnswerVal.trim().length > 0
                        ? currentAnswerVal.split(",")
                        : [];
                      const isChecked = isPreviewMode
                        ? currentArr.includes(o.id)
                        : (item.config.correctHashes || []).includes(o.id);
                      return (
                        <label
                          key={o.id}
                          className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isPreviewMode) {
                                let next = [...currentArr];
                                if (next.includes(o.id)) {
                                  next = next.filter((h) => h !== o.id);
                                } else {
                                  next = [...next, o.id];
                                }
                                setStudentAnswer(item.id, next);
                                return;
                              }
                              const current = item.config.correctHashes || [];
                              const newHashes = current.includes(o.id)
                                ? current.filter((h) => h !== o.id)
                                : [...current, o.id];
                              updateItem(item.id, {
                                config: {
                                  ...item.config,
                                  correctHashes: newHashes,
                                },
                              });
                            }}
                            className="rounded-sm text-purple-600 focus:ring-purple-500"
                          />
                          <span>{o.text}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* BOTTOM TOOL RIBBON: 6 Pear Assessment Inspired Question Types */}
      {!isPreviewMode && (
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 shrink-0 max-h-[48%] overflow-y-auto shadow-2xl z-10">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2.5">
            Thêm câu hỏi Sidebar (Pear Assessment):
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => addSidebarItem("multiple-choice")}
              className="inline-flex items-center justify-start gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-purple-600/20 hover:border-purple-500/60 hover:text-purple-300 transition-all active:scale-95"
            >
              <ListOrdered className="h-4 w-4 text-purple-400 shrink-0" />
              <span className="truncate">Trắc nghiệm</span>
            </button>

            <button
              onClick={() => addSidebarItem("short-input")}
              className="inline-flex items-center justify-start gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-sky-600/20 hover:border-sky-500/60 hover:text-sky-300 transition-all active:scale-95"
            >
              <TextCursorInput className="h-4 w-4 text-sky-400 shrink-0" />
              <span className="truncate">Trả lời ngắn</span>
            </button>

            <button
              onClick={() => addSidebarItem("drop-down")}
              className="inline-flex items-center justify-start gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-amber-600/20 hover:border-amber-500/60 hover:text-amber-300 transition-all active:scale-95"
            >
              <ChevronDownSquare className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="truncate">Chọn từ danh sách</span>
            </button>

            <button
              onClick={() => addSidebarItem("math-input")}
              className="inline-flex items-center justify-start gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-indigo-600/20 hover:border-indigo-500/60 hover:text-indigo-300 transition-all active:scale-95"
            >
              <Calculator className="h-4 w-4 text-indigo-400 shrink-0" />
              <span className="truncate">Công thức</span>
            </button>

            <button
              onClick={() => addSidebarItem("true-false")}
              className="inline-flex items-center justify-start gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-emerald-600/20 hover:border-emerald-500/60 hover:text-emerald-300 transition-all active:scale-95"
            >
              <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="truncate">Đúng / Sai</span>
            </button>

            <button
              onClick={() => addSidebarItem("essay")}
              className="inline-flex items-center justify-start gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-pink-600/20 hover:border-pink-500/60 hover:text-pink-300 transition-all active:scale-95"
            >
              <AlignLeft className="h-4 w-4 text-pink-400 shrink-0" />
              <span className="truncate">Tự luận</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
