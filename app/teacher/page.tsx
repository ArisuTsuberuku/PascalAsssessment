"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowLeft, ShieldCheck, Loader2, Code2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

export default function TeacherLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDevNotice, setShowDevNotice] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    setShowDevNotice(false);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/teacher/dashboard");
    } catch (error: any) {
      console.error("Firebase Google Login Error:", error);
      if (error?.code === "auth/unauthorized-domain") {
        setErrorMsg(
          "Tên miền Local (localhost/127.0.0.1) chưa có trong danh sách Authorized Domains của Firebase Console. Vui lòng sử dụng Đăng nhập Local Dev Mode bên dưới để kiểm thử."
        );
        setShowDevNotice(true);
      } else {
        setErrorMsg(error?.message || "Đăng nhập Google thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLocalDevLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    const devEmail = "dev@pascal.edu.vn";
    const devPass = "pascal123456";

    try {
      try {
        await signInWithEmailAndPassword(auth, devEmail, devPass);
      } catch (err: any) {
        if (
          err?.code === "auth/user-not-found" ||
          err?.code === "auth/invalid-credential"
        ) {
          await createUserWithEmailAndPassword(auth, devEmail, devPass);
        } else {
          throw err;
        }
      }
      router.push("/teacher/dashboard");
    } catch (error: any) {
      console.error("Dev login error:", error);
      setErrorMsg("Lỗi đăng nhập Dev Mode: " + (error?.message || error));
    } finally {
      setLoading(false);
    }
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

      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/40">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-white">Đăng nhập Giáo viên</h1>
          <p className="text-slate-400 text-sm mt-1">
            Quản lý bài giảng, tài liệu PDF và theo dõi lớp học
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Real Google Sign-in Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 font-semibold text-slate-900 shadow-md transition-all hover:bg-slate-100 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-700" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          <span>Tiếp tục với Google</span>
        </button>

        {/* Local Dev Mode Section */}
        <div className="mt-5 pt-5 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleLocalDevLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all disabled:opacity-50"
          >
            <Code2 className="h-4 w-4 text-indigo-400" />
            <span>Đăng xuất/Đăng nhập Local Dev Mode (Không cần domain)</span>
          </button>
          <p className="mt-2 text-[11px] text-slate-500 text-center leading-relaxed">
            Dành cho môi trường Local (localhost / 127.0.0.1) tự động cấp quyền tài khoản test để kiểm thử chức năng lưu/tạo bài thi.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-indigo-400" />
          <span>Bảo mật bởi Firebase Authentication</span>
        </div>
      </div>
    </main>
  );
}
