"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Users, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function StudentLobbyPage() {
  const router = useRouter();
  const setStudentInfo = useAppStore((state) => state.setStudentInfo);

  const [classCode, setClassCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<"Individual" | "Group">("Individual");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode || classCode.length !== 6) return;
    setStudentInfo(classCode.toUpperCase(), fullName, mode);
    router.push(`/student/${classCode.toUpperCase()}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-950 to-slate-900">
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại Trang chủ
      </Link>

      {/* Centered Modal */}
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-600/40">
            <Users className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-white">Phòng Chờ Học sinh</h1>
          <p className="text-slate-400 text-sm mt-1">
            Nhập thông tin để tham gia làm bài kiểm tra trực tiếp
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Class Code Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Mã lớp học (6 ký tự) *
            </label>
            <input
              type="text"
              maxLength={6}
              required
              placeholder="VD: CALC88"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-center font-mono text-lg font-bold tracking-widest text-purple-300 placeholder-slate-600 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Full Name Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Họ và Tên *
            </label>
            <input
              type="text"
              required
              placeholder="VD: Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Mode Dropdown (Individual / Group) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Chế độ làm bài
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "Individual" | "Group")}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="Individual">Cá nhân (Individual)</option>
              <option value="Group">Nhóm (Group)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white shadow-lg shadow-purple-600/30 transition-all hover:bg-purple-500 active:scale-[0.99]"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Vào làm bài ngay</span>
          </button>
        </form>
      </div>
    </main>
  );
}
