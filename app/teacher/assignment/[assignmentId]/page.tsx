import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Upload,
  Plus,
  Trash2,
  FileText,
  Settings,
  Eye,
} from "lucide-react";

interface PageProps {
  params: {
    assignmentId: string;
  };
}

export default function AssignmentEditorPage({ params }: PageProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/80 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/teacher/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <span className="text-slate-700">|</span>
          <span className="text-sm font-semibold text-white">
            Assignment ID: <code className="text-indigo-400">{params.assignmentId}</code>
          </span>
          <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
            80/20 Editor Mode
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors">
            <Eye className="h-3.5 w-3.5" />
            <span>Xem trước</span>
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-md">
            <Save className="h-3.5 w-3.5" />
            <span>Lưu cấu hình</span>
          </button>
        </div>
      </header>

      {/* 80/20 SPLIT SCREEN LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT 80% CONTAINER (w-4/5) — PDF CANVAS AREA */}
        <main className="w-4/5 h-full overflow-y-auto bg-slate-900/40 p-6 flex flex-col">
          {/* Canvas Placeholder UI */}
          <div className="flex-1 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/70 p-8 flex flex-col items-center justify-center relative min-h-[700px]">
            {/* Top Toolbar overlay inside canvas */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-300">
                  AP_Calculus_Practice_Sheet.pdf (Canvas Placeholder)
                </span>
              </div>
              <button className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300">
                <Upload className="h-3.5 w-3.5" />
                <span>Thay đổi PDF</span>
              </button>
            </div>

            {/* Visual Canvas Representation */}
            <div className="w-full max-w-3xl aspect-[1/1.4] bg-slate-800/60 rounded-xl border border-slate-700/60 shadow-2xl flex flex-col items-center justify-center p-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">
                Interactive PDF Canvas Area (80% Workspace)
              </h2>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
                Khu vực này hiển thị tài liệu đề kiểm tra PDF side-by-side. Giáo viên có thể khoanh vùng câu hỏi hoặc đính kèm phiếu trả lời tự động cho học sinh.
              </p>
              <div className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 border border-slate-700 text-xs font-mono text-indigo-300">
                &lt;div className="w-4/5 overflow-y-auto"&gt; PDF Canvas &lt;/div&gt;
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT 20% CONTAINER (w-1/5) — STICKY ACTION SIDEBAR */}
        <aside className="w-1/5 h-full overflow-y-auto border-l border-slate-800 bg-slate-900 p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="h-4 w-4 text-indigo-400" />
                <span>Cấu hình Bài kiểm tra</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Thiết lập câu hỏi và đáp án tự động chấm
              </p>
            </div>

            {/* Assessment Meta Setup */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mã lớp học (Class Code)
                </label>
                <input
                  type="text"
                  defaultValue="CALC88"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono font-bold text-indigo-300 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Thời gian làm bài (Phút)
                </label>
                <input
                  type="number"
                  defaultValue={45}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Question List Placeholder */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">Danh sách câu hỏi</span>
                <button className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1">
                  <Plus className="h-3 w-3" />
                  <span>Thêm câu hỏi</span>
                </button>
              </div>

              <div className="space-y-2">
                {[1, 2, 3].map((num) => (
                  <div
                    key={num}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-semibold text-white">Câu {num}</span>
                      <span className="block text-[11px] text-slate-400">Trắc nghiệm (10đ)</span>
                    </div>
                    <button className="text-slate-500 hover:text-rose-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Sidebar Footer */}
          <div className="border-t border-slate-800 pt-4 mt-4">
            <button className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors">
              Xuất bản Bài kiểm tra
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
