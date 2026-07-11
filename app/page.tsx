import Link from "next/link";
import { GraduationCap, Users, BookOpen, Sparkles, ArrowRight } from "lucide-react";

export default function IndexPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-[#f4fbf7] via-emerald-50/40 to-white">
      {/* Brand Badge */}
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
        <span>Pascal Interactive EdTech Platform</span>
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-2xl mb-12">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-800 mb-4">
          Nền tảng Đánh giá & Học tập <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">PDF Tương tác</span>
        </h1>
        <p className="text-slate-600 text-lg md:text-xl">
          Chọn vai trò của bạn để tiếp tục vào không gian học tập và giảng dạy trực tuyến.
        </p>
      </div>

      {/* Two Large Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Teacher Card */}
        <Link
          href="/teacher"
          className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl transition-all group-hover:bg-emerald-500/20" />
          <div>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 group-hover:scale-110 transition-transform">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">I am a Teacher</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Dành cho Giáo viên: Tạo và quản lý bài kiểm tra PDF 80/20, theo dõi lớp học trực tiếp, và tự động chấm điểm.
            </p>
          </div>
          <div className="mt-8 flex items-center font-semibold text-emerald-600 group-hover:text-emerald-700">
            <span>Đăng nhập Cổng Giáo viên</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Student Card */}
        <Link
          href="/student"
          className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl hover:shadow-teal-500/10 flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-teal-500/10 blur-2xl transition-all group-hover:bg-teal-500/20" />
          <div>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/30 group-hover:scale-110 transition-transform">
              <Users className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">I am a Student</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Dành cho Học sinh: Nhập mã lớp 6 ký tự để tham gia làm bài trực tiếp trên PDF Canvas với phiếu trả lời thông minh.
            </p>
          </div>
          <div className="mt-8 flex items-center font-semibold text-teal-600 group-hover:text-teal-700">
            <span>Vào Phòng Chờ Học sinh</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
    </main>
  );
}
