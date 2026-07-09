"use client";

import React, { useState } from "react";
import { ChevronUp, ChevronDown, PanelRightOpen, PanelRightClose } from "lucide-react";

interface SplitLayoutProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  headerContent?: React.ReactNode;
}

export default function SplitLayout({
  leftContent,
  rightContent,
  headerContent,
}: SplitLayoutProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Optional Top Header Bar */}
      {headerContent && (
        <div className="shrink-0 border-b border-slate-800 bg-slate-900/90 z-20">
          {headerContent}
        </div>
      )}

      {/* 80/20 Main Split Layout Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT 80% CONTAINER (w-full lg:w-4/5) */}
        <div className="w-full lg:w-4/5 h-full overflow-hidden flex flex-col">
          {leftContent}
        </div>

        {/* Mobile / Tablet Toggle Button for 20% Sidebar */}
        <button
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          className="lg:hidden fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xl hover:bg-indigo-500 transition-all"
        >
          {mobileDrawerOpen ? (
            <>
              <PanelRightClose className="h-4 w-4" />
              <span>Đóng Sidebar</span>
            </>
          ) : (
            <>
              <PanelRightOpen className="h-4 w-4" />
              <span>Cấu hình & Câu hỏi (20%)</span>
            </>
          )}
        </button>

        {/* RIGHT 20% CONTAINER (lg:w-1/5) */}
        <div
          className={`${
            mobileDrawerOpen
              ? "fixed inset-x-0 bottom-0 max-h-[75vh] z-40 rounded-t-2xl shadow-2xl border-t border-slate-700 bg-slate-900"
              : "hidden lg:flex lg:w-1/5"
          } h-full overflow-y-auto border-l border-slate-800 bg-slate-900/95 transition-all`}
        >
          <div className="w-full h-full flex flex-col">
            {mobileDrawerOpen && (
              <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Bảng Điều khiển 20%
                </span>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Đóng
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">{rightContent}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
