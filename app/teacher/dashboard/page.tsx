"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Loader2,
  ShieldAlert,
} from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { Assignment } from "@/types/assignment";

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Track authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (!user) {
        router.replace("/teacher");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Phase 2: Fetch assignments strictly matching logged-in teacherId
  useEffect(() => {
    if (!currentUser) return;
    const userUid = currentUser.uid;

    let isMounted = true;
    async function fetchTeacherAssignments() {
      setLoadingAssignments(true);
      try {
        const q = query(
          collection(db, "assignments"),
          where("teacherId", "==", userUid)
        );
        const snapshot = await getDocs(q);
        const list: Assignment[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            ...data,
            assignmentId: data.assignmentId || docSnap.id,
          } as Assignment);
        });

        // Sort by createdAt desc in memory
        list.sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds || a.updatedAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || b.updatedAt?.seconds || 0;
          return timeB - timeA;
        });

        if (isMounted) {
          setAssignments(list);
        }
      } catch (error) {
        console.error("Error fetching teacher assignments:", error);
      } finally {
        if (isMounted) {
          setLoadingAssignments(false);
        }
      }
    }

    fetchTeacherAssignments();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/teacher");
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 text-slate-300">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
        <p className="text-sm">Đang xác thực tài khoản giáo viên...</p>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const filteredAssignments = assignments.filter((item) =>
    (item.title || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleStartLiveSession = async (
    assignment: Assignment,
    classCode?: string
  ) => {
    try {
      // Force wait for auth state to be resolved (Production safety)
      await auth.authStateReady();

      const user = auth.currentUser;
      if (!user?.uid) {
        alert(
          "Phiên đăng nhập đã hết hạn. Vui lòng tải lại trang và đăng nhập lại."
        );
        return;
      }

      // THE MAGIC FIX: Force refresh the token to sync with Firebase Backend
      // This guarantees request.auth will not be null in Security Rules
      await user.getIdToken(true);

      // 1. Native JS Random ID Generation (No uuid package needed)
      const newSessionId =
        classCode ||
        Math.random().toString(36).substring(2, 10).toUpperCase();

      // 2. Clean payload
      const sessionPayload = {
        assignmentId: assignment.assignmentId,
        assignmentName: assignment.title || "Bài tập chưa đặt tên",
        teacherId: user.uid,
        status: "active",
        classCode: newSessionId,
        createdAt: serverTimestamp(),
      };

      // 3. Write to Firestore
      await setDoc(doc(db, "sessions", newSessionId), sessionPayload);

      // 4. Redirect
      router.push(`/teacher/session/${newSessionId}`);
    } catch (error: any) {
      console.error("Lỗi chi tiết khi tạo Live Session:", error);
      // Hiển thị chính xác mã lỗi để dễ debug
      alert(`Lỗi: ${error?.message || "Không thể kết nối Firebase"}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col justify-between p-4 shrink-0">
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

        {/* Phase 1: Show Google Avatar & Profile */}
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || "Avatar"}
                className="w-8 h-8 rounded-full object-cover border border-indigo-500/30"
              />
            ) : (
              <div className="flex w-8 h-8 rounded-full bg-indigo-600 text-white font-bold items-center justify-center text-xs shrink-0">
                {(currentUser.displayName || currentUser.email || "T")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-white truncate">
                {currentUser.displayName || "Giáo viên Pascal"}
              </span>
              <span className="text-xs text-slate-400 truncate">
                {currentUser.email || currentUser.uid.slice(0, 8)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Quản lý Bài kiểm tra & Giao bài</h1>
            <p className="text-sm text-slate-400">
              Danh sách bài tập PDF 80/20 của bạn ({currentUser.email || "Giáo viên"})
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài tập theo tên..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Data Grid View */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          {loadingAssignments ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mb-2" />
              <p className="text-sm">Đang tải danh sách bài tập...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900 text-xs uppercase font-semibold text-slate-400">
                  <th className="px-6 py-4">Tên bài kiểm tra</th>
                  <th className="px-6 py-4">Mã lớp</th>
                  <th className="px-6 py-4">Số câu hỏi</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      Chưa có bài kiểm tra nào. Nhấn &quot;Tạo bài tập PDF mới&quot; để bắt đầu.
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map((assignment) => {
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
                            <button
                              onClick={() =>
                                handleStartLiveSession(assignment, classCode)
                              }
                              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Play className="h-3.5 w-3.5" />
                              <span>Live Session</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
