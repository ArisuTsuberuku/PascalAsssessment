"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Users, UserCheck } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { auth } from "@/lib/firebase";
import { signInAnonymously, signOut } from "firebase/auth";

function StudentLobbyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setStudentInfo = useAppStore((state) => state.setStudentInfo);

  const [classCode, setClassCode] = useState("");
  const [studentName, setStudentName] = useState("");
  const [mode, setMode] = useState<"individual" | "group">("individual");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

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

    setJoining(true);

    try {
      // 1. CỰC KỲ QUAN TRỌNG: Đăng xuất tài khoản cũ (nếu có) trên máy này
      await signOut(auth);

      // 2. Tạo một danh tính ẩn danh HOÀN TOÀN MỚI
      const userCredential = await signInAnonymously(auth);
      const firebaseStudentUid = userCredential.user.uid;

      const submissionId =
        mode === "group"
          ? `${cleanCode}_team_${cleanTeam.replace(/\s+/g, "")}`
          : `${cleanCode}_ind_${cleanName.replace(/\s+/g, "")}`;

      // 3. Lưu thông tin vào Session Storage (để phân tách độc lập giữa các Tab)
      sessionStorage.setItem("studentName", cleanName);
      sessionStorage.setItem("studentId", firebaseStudentUid);

      const sessionData = {
        classCode: cleanCode,
        studentName: cleanName,
        studentId: firebaseStudentUid,
        mode,
        teamName: mode === "group" ? cleanTeam : null,
        submissionId,
      };

      sessionStorage.setItem(
        "pascal_student_session",
        JSON.stringify(sessionData)
      );
      localStorage.setItem(
        "pascal_student_session",
        JSON.stringify(sessionData)
      );

      // Update global app store if needed
      setStudentInfo(
        cleanCode,
        cleanName,
        mode === "group" ? "Group" : "Individual"
      );

      // 3. Redirect to the session
      router.push(`/play/${cleanCode}`);
    } catch (err: any) {
      console.error("Lỗi khi tạo phiên ẩn danh:", err);
      setError("Không thể kết nối an ninh phòng thi. Vui lòng thử lại.");
      setJoining(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-8 shadow-xl">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
          <Users className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Phòng Chờ Học sinh</h1>
        <p className="text-slate-600 text-sm mt-1">
          Nhập thông tin để tham gia làm bài kiểm tra trực tiếp
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-50 p-3 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleJoin} className="space-y-5">
        {/* Class Code Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Mã lớp học (6 ký tự) *
          </label>
          <input
            type="text"
            maxLength={6}
            required
            placeholder="VD: CALC88"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value.toUpperCase())}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center font-mono text-lg font-bold tracking-widest text-emerald-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Full Name Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Họ và Tên *
          </label>
          <input
            type="text"
            required
            placeholder="VD: Nguyễn Văn A"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Mode Dropdown */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Chế độ làm bài
          </label>
          <select
            value={mode}
            onChange={(e) =>
              setMode(e.target.value as "individual" | "group")
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            <option value="individual">Cá nhân (Individual)</option>
            <option value="group">Nhóm (Group)</option>
          </select>
        </div>

        {/* Dynamic Team Name Input for Group Mode */}
        {mode === "group" && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Tên Nhóm (VD: Nhóm 1) *</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Nhóm 1"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full rounded-xl border border-emerald-400 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={joining}
          className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>{joining ? "Đang kết nối..." : "Vào Phòng Thi"}</span>
        </button>
      </form>
    </div>
  );
}

export default function StudentLobbyPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-[#f4fbf7] to-white">
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại Trang chủ
      </Link>
      <Suspense fallback={<div className="text-slate-600">Đang tải...</div>}>
        <StudentLobbyForm />
      </Suspense>
    </main>
  );
}
