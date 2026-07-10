"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Users, UserCheck } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

function StudentLobbyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setStudentInfo = useAppStore((state) => state.setStudentInfo);

  const [classCode, setClassCode] = useState("");
  const [studentName, setStudentName] = useState("");
  const [mode, setMode] = useState<"individual" | "group">("individual");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const codeParam = searchParams.get("code");
    if (codeParam) {
      setClassCode(codeParam.toUpperCase());
    }
  }, [searchParams]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = classCode.trim().toUpperCase();
    const cleanName = studentName.trim();
    const cleanTeam = teamName.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      setError("Mã lớp học phải có đúng 6 ký tự.");
      return;
    }
    if (!cleanName) {
      setError("Vui lòng nhập Họ và Tên của bạn.");
      return;
    }
    if (mode === "group" && !cleanTeam) {
      setError("Vui lòng nhập Tên Nhóm khi tham gia chế độ Nhóm.");
      return;
    }

    const submissionId =
      mode === "group"
        ? `${cleanCode}_team_${cleanTeam.replace(/\s+/g, "")}`
        : `${cleanCode}_ind_${cleanName.replace(/\s+/g, "")}`;

    const sessionData = {
      classCode: cleanCode,
      studentName: cleanName,
      mode,
      teamName: mode === "group" ? cleanTeam : null,
      submissionId,
    };

    localStorage.setItem("pascal_student_session", JSON.stringify(sessionData));

    // Update global app store if needed
    setStudentInfo(
      cleanCode,
      cleanName,
      mode === "group" ? "Group" : "Individual"
    );

    router.push(`/play/${cleanCode}`);
  };

  return (
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

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleJoin} className="space-y-5">
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
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Mode Dropdown */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Chế độ làm bài
          </label>
          <select
            value={mode}
            onChange={(e) =>
              setMode(e.target.value as "individual" | "group")
            }
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="individual">Cá nhân (Individual)</option>
            <option value="group">Nhóm (Group)</option>
          </select>
        </div>

        {/* Dynamic Team Name Input for Group Mode */}
        {mode === "group" && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-purple-400" />
              <span>Tên Nhóm (VD: Nhóm 1) *</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Nhóm 1"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full rounded-xl border border-purple-500/50 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:outline-none"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white shadow-lg shadow-purple-600/30 transition-all hover:bg-purple-500 active:scale-[0.99]"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>Vào làm bài ngay</span>
        </button>
      </form>
    </div>
  );
}

export default function StudentLobbyPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-950 to-slate-900">
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại Trang chủ
      </Link>
      <Suspense fallback={<div className="text-slate-400">Đang tải...</div>}>
        <StudentLobbyForm />
      </Suspense>
    </main>
  );
}
