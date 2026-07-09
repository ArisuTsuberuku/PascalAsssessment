import React from "react";
import { Assignment, SidebarItem } from "@/types/assignment";
import { HelpCircle, CheckCircle2, Award, ListFilter } from "lucide-react";

interface QuestionSidebarProps {
  assignment: Assignment;
}

export default function QuestionSidebar({ assignment }: QuestionSidebarProps) {
  // Extract all sidebar items across all sections
  const sidebarItems: SidebarItem[] = [];
  assignment.sections.forEach((section) => {
    section.items.forEach((item) => {
      if (item.placement === "sidebar") {
        sidebarItems.push(item as SidebarItem);
      }
    });
  });

  const totalPoints = sidebarItems.reduce(
    (sum, item) => sum + (item.points || 0),
    0
  );

  return (
    <div className="h-full flex flex-col p-4">
      {/* Sidebar Title & Summary */}
      <div className="mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-indigo-400" />
            <span>Câu hỏi bên Sidebar</span>
          </h3>
          <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
            {sidebarItems.length} câu
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Hiển thị cố định ở bảng 20% bên phải • Tổng {totalPoints} điểm
        </p>
      </div>

      {/* Scrollable Questions List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {sidebarItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
            Không có câu hỏi nào thuộc nhóm Sidebar.
          </div>
        ) : (
          sidebarItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 shadow-md hover:border-indigo-500/40 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-white leading-tight">
                  {item.name}
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 rounded bg-indigo-500/15 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
                  <Award className="h-3 w-3" />
                  {item.points}đ
                </span>
              </div>

              <div className="mb-2">
                <span className="inline-block rounded bg-slate-800 px-2 py-0.5 text-[10px] uppercase font-semibold text-slate-300">
                  {item.type}
                </span>
              </div>

              {item.prompt && (
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {item.prompt}
                </p>
              )}

              {/* Render Type-specific Preview */}
              {item.type === "multiple-choice" && (
                <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-800/80">
                  {item.config.options.map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-center gap-2 rounded-lg border border-slate-800/60 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300"
                    >
                      <span className="font-mono font-bold text-indigo-400">
                        •
                      </span>
                      <span>{opt.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {item.type === "math-input" && (
                <div className="mt-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-mono bg-slate-900/90 rounded px-2.5 py-1.5 border border-slate-800 text-emerald-400">
                    <span>Biểu thức chuẩn:</span>
                    <strong>{item.config.correctMathjs}</strong>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
