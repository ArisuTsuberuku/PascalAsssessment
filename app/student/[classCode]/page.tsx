"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  FileText,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface PageProps {
  params: {
    classCode: string;
  };
}

export default function StudentWorkspacePage({ params }: PageProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/80 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/student"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Thoát</span>
          </Link>
          <span className="text-slate-700">|</span>
          <span className="text-sm font-semibold text-white">
            Mã lớp: <code className="text-purple-400">{params.classCode}</code>
          </span>
          <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-400">
            80/20 Student Mode
          </span>
        </div>

        {/* Mobile toggle for bottom sheet / drawer */}
        <button
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          className="lg:hidden inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white"
        >
          <span>Phiếu trả lời (20%)</span>
          {mobileDrawerOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
          <span>Tiến độ làm bài:</span>
          <span className="font-bold text-emerald-400">0 / 10 câu</span>
        </div>
      </header>

      {/* 80/20 SPLIT SCREEN LAYOUT */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT 80% CONTAINER (w-full lg:w-4/5) — INTERACTIVE PDF CANVAS */}
        <main className="w-full lg:w-4/5 h-full overflow-y-auto bg-slate-900/40 p-6 flex flex-col">
          <div className="flex-1 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/70 p-8 flex flex-col items-center justify-center relative min-h-[700px]">
            <div className="w-full max-w-3xl aspect-[1/1.4] bg-slate-800/60 rounded-xl border border-slate-700/60 shadow-2xl flex flex-col items-center justify-center p-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-purple-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">
                Interactive PDF Assessment Canvas (80% Workspace)
              </h2>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
                Học sinh xem trực tiếp đề kiểm tra PDF tại đây và chọn đáp án tương ứng trên cột trả lời bên phải (20%).
              </p>
              <div className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 border border-slate-700 text-xs font-mono text-purple-300">
                &lt;div className="lg:w-4/5 overflow-y-auto"&gt; Student PDF Canvas &lt;/div&gt;
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT 20% CONTAINER (lg:w-1/5) — QUESTIONS/ANSWERS SIDEBAR (RESPONSIVE: BOTTOM SHEET ON MOBILE) */}
        <aside
          className={`${
            mobileDrawerOpen
              ? "fixed inset-x-0 bottom-0 max-h-[75vh] z-50 rounded-t-2xl shadow-2xl border-t border-slate-700"
              : "hidden lg:flex lg:w-1/5"
          } h-full overflow-y-auto border-l border-slate-800 bg-slate-900 p-4 flex-col justify-between shrink-0 transition-all`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Phiếu trả lời</h3>
                <p className="text-xs text-slate-400">Chọn đáp án cho từng câu</p>
              </div>
              {mobileDrawerOpen && (
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Đóng
                </button>
              )}
            </div>

            {/* Questions list */}
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((num) => (
                <div
                  key={num}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Câu {num}</span>
                    <span className="text-[10px] text-slate-500">Trắc nghiệm</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {["A", "B", "C", "D"].map((opt) => (
                      <button
                        key={opt}
                        className="rounded-lg border border-slate-800 bg-slate-900 py-1.5 text-xs font-semibold text-slate-300 hover:border-purple-500 hover:bg-purple-500/10 transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="border-t border-slate-800 pt-4 mt-4">
            <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 transition-colors">
              <Send className="h-3.5 w-3.5" />
              <span>Nộp bài kiểm tra</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
