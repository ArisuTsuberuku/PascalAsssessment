export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Plus,
  Search,
  ExternalLink,
  Play,
  LogOut,
  Sparkles,
} from "lucide-react";
import { getAllAssignments } from "@/services/assignmentService";

export default async function TeacherDashboardPage() {
  const assignments = await getAllAssignments();

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col justify-between p-4">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold">
              PA
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Pascal Assessment</h2>
              <span className="text-xs text-indigo-400">Teacher Portal</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <Link
              href="/teacher/dashboard"
              className="flex items-center gap-3 rounded-lg bg-indigo-600/10 px-3 py-2 text-sm font-medium text-indigo-400"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/teacher/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>Bài kiểm tra PDF</span>
            </Link>
            <Link
              href="/teacher/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
            >
              <Users className="h-4 w-4" />
              <span>Lớp học trực tiếp</span>
            </Link>
            <Link
              href="/teacher/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Cài đặt</span>
            </Link>
          </nav>
        </div>

        {/* User profile footer */}
        <div className="border-t border-slate-800 pt-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Quản lý Bài kiểm tra & Giao bài</h1>
            <p className="text-sm text-slate-400">
              Danh sách bài tập PDF 80/20 và theo dõi tiến độ nộp bài của học sinh
            </p>
          </div>

          <Link
            href="/teacher/assignment/new-assignment"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo bài tập PDF mới</span>
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm bài tập theo tên hoặc mã lớp..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Data Grid View */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900 text-xs uppercase font-semibold text-slate-400">
                <th className="px-6 py-4">Tên bài kiểm tra</th>
                <th className="px-6 py-4">Mã lớp</th>
                <th className="px-6 py-4">Số câu hỏi</th>
                <th className="px-6 py-4">Đã nộp</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Chưa có bài kiểm tra nào trong cơ sở dữ liệu. Nhấn &quot;Tạo bài tập PDF mới&quot; để bắt đầu.
                  </td>
                </tr>
              ) : (
                assignments.map((assignment) => {
                  const totalQuestions =
                    assignment.sections?.reduce(
                      (acc, sec) => acc + (sec.items?.length || 0),
                      0
                    ) || 0;
                  const classCode =
                    (assignment as any).classCode ||
                    assignment.assignmentId?.slice(0, 6).toUpperCase() ||
                    "PAS888";

                  return (
                    <tr
                      key={assignment.assignmentId}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-white">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span>{assignment.title || "Bài kiểm tra chưa đặt tên"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold tracking-wider rounded bg-slate-800 px-2 py-1 text-indigo-300">
                          {classCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {totalQuestions} câu
                      </td>
                      <td className="px-6 py-4 text-slate-300">0 học sinh</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/teacher/assignment/${assignment.assignmentId}`}
                            className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors inline-flex items-center gap-1.5"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Chỉnh sửa 80/20</span>
                          </Link>
                          <Link
                            href={`/teacher/session/${classCode}`}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors inline-flex items-center gap-1.5"
                          >
                            <Play className="h-3.5 w-3.5" />
                            <span>Live Session</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
