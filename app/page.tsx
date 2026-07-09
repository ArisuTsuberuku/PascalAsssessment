import Link from "next/link";
import { GraduationCap, Users, BookOpen, Sparkles, ArrowRight } from "lucide-react";

export default function IndexPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40">
      {/* Brand Badge */}
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-300">
        <Sparkles className="h-3.5 w-3.5" />
        <span>Pascal Interactive EdTech Platform</span>
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-2xl mb-12">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4">
          Nền tảng Đánh giá & Học tập <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">PDF Tương tác</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl">
          Chọn vai trò của bạn để tiếp tục vào không gian học tập và giảng dạy trực tuyến.
        </p>
      </div>

      {/* Two Large Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Teacher Card */}
        <Link
          href="/teacher"
          className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl transition-all group-hover:bg-indigo-500/20" />
          <div>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-transform">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">I am a Teacher</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Dành cho Giáo viên: Tạo và quản lý bài kiểm tra PDF 80/20, theo dõi lớp học trực tiếp, và tự động chấm điểm.
            </p>
          </div>
          <div className="mt-8 flex items-center font-semibold text-indigo-400 group-hover:text-indigo-300">
            <span>Đăng nhập Cổng Giáo viên</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Student Card */}
        <Link
          href="/student"
          className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/50 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl transition-all group-hover:bg-purple-500/20" />
          <div>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-600/30 group-hover:scale-110 transition-transform">
              <Users className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">I am a Student</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Dành cho Học sinh: Nhập mã lớp 6 ký tự để tham gia làm bài trực tiếp trên PDF Canvas với phiếu trả lời thông minh.
            </p>
          </div>
          <div className="mt-8 flex items-center font-semibold text-purple-400 group-hover:text-purple-300">
            <span>Vào Phòng Chờ Học sinh</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
    </main>
  );
}
