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
  Trash2,
} from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  deleteDoc,
  writeBatch,
  onSnapshot,
} from "firebase/firestore";
import { getStorage, ref, deleteObject } from "firebase/storage";
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
  const [sessionsMap, setSessionsMap] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!currentUser) return;
    const userUid = currentUser.uid;

    const qSessions = query(
      collection(db, "sessions"),
      where("teacherId", "==", userUid)
    );

    const unsubscribeSessions = onSnapshot(qSessions, (snapshot) => {
      const map: Record<string, any> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.assignmentId) {
          map[data.assignmentId] = data;
        }
      });
      setSessionsMap(map);
    });

    return () => unsubscribeSessions();
  }, [currentUser]);

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
      // 1. DIAGNOSTIC: CHECK AUTH
      await auth.authStateReady();
      const currentUser = auth.currentUser;
      console.log(
        "🔍 [Pre-flight Check] Current User:",
        currentUser ? currentUser.uid : "NULL (Not logged in)"
      );

      if (!currentUser) {
        throw new Error(
          "[CLIENT-SIDE BLOCK] Không thể tạo phòng: Bạn chưa đăng nhập hoặc Firebase Auth chưa sẵn sàng."
        );
      }

      // Force refresh the token to sync with Firebase Backend
      await currentUser.getIdToken(true);

      const newSessionId =
        classCode ||
        Math.random().toString(36).substring(2, 10).toUpperCase();

      // 2. CONSTRUCT PAYLOAD
      const sessionPayload = {
        assignmentId: assignment.assignmentId,
        assignmentName: assignment.title || "Bài tập chưa đặt tên",
        teacherId: currentUser.uid, // ENSURE THIS IS INCLUDED
        status: "active",
        classCode: newSessionId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // 3. DIAGNOSTIC: INSPECT PAYLOAD & RULE MATCHING
      console.log("🔍 [Pre-flight Check] Target Collection: 'sessions'");
      console.log("🔍 [Pre-flight Check] Target Doc ID:", newSessionId);
      console.log("🔍 [Pre-flight Check] Payload Output:", sessionPayload);

      if (sessionPayload.teacherId !== currentUser.uid) {
        throw new Error(
          `[CLIENT-SIDE BLOCK] Mismatch! Payload teacherId (${sessionPayload.teacherId}) khác với User UID (${currentUser.uid})`
        );
      }

      // 4. FIREBASE CALL
      console.log(
        "🚀 [Pre-flight Check] Đã qua vòng kiểm duyệt nội bộ. Đang gửi lên Firebase..."
      );
      await setDoc(doc(db, "sessions", newSessionId), sessionPayload, {
        merge: true,
      });
      console.log("✅ Tạo Live Session thành công! ID:", newSessionId);

      // Redirect
      router.push(`/teacher/session/${newSessionId}`);
    } catch (error: any) {
      console.error("❌ Lỗi chi tiết khi tạo Live Session:", error);
      alert(error.message);
    }
  };

  const handleDeleteAssignment = async (assignment: Assignment) => {
    const confirmDelete = window.confirm(
      `⚠️ CẢNH BÁO NGUY HIỂM: Bạn có chắc chắn muốn xóa bài tập "${assignment.title}" không?\n\nHành động này sẽ XÓA VĨNH VIỄN tệp PDF, tất cả phiên thi liên quan và bài làm của học sinh. KHÔNG THỂ KHÔI PHỤC!`
    );
    if (!confirmDelete) return;

    try {
      // 1. Delete the PDF file from Storage
      if (assignment.pdfUrl) {
        try {
          const storage = getStorage();
          const fileRef = ref(storage, assignment.pdfUrl);
          await deleteObject(fileRef);
          console.log("Deleted PDF from Storage");
        } catch (storageError) {
          console.warn("Storage deletion failed (file may not exist):", storageError);
        }
      }

      // 2. Query and delete all associated sessions
      const sessionsQ = query(
        collection(db, "sessions"),
        where("assignmentId", "==", assignment.assignmentId)
      );
      const sessionsSnapshot = await getDocs(sessionsQ);
      
      // 2b. Query and delete all associated student_submissions
      const submissionsQ = query(
        collection(db, "student_submissions"),
        where("assignmentId", "==", assignment.assignmentId)
      );
      const submissionsSnapshot = await getDocs(submissionsQ);
      
      const batch = writeBatch(db);
      sessionsSnapshot.forEach((sessionDoc) => {
        batch.delete(sessionDoc.ref);
      });
      submissionsSnapshot.forEach((subDoc) => {
        batch.delete(subDoc.ref);
      });
      await batch.commit();

      // 3. Delete the assignment document
      await deleteDoc(doc(db, "assignments", assignment.assignmentId!));
      console.log("Deleted Assignment document");

      // Update UI
      setAssignments((prev) =>
        prev.filter((a) => a.assignmentId !== assignment.assignmentId)
      );
      alert("Đã xóa bài tập và dọn dẹp dữ liệu thành công!");
    } catch (error: any) {
      console.error("Error deep deleting assignment:", error);
      alert(`Có lỗi xảy ra khi xóa: ${error.message}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-white text-slate-800">
      {/* Left Sidebar - Pastel Green */}
      <aside className="w-64 border-r border-emerald-200 bg-[#f2fbf5] flex flex-col justify-between p-4 shrink-0">
        <div>
          {/* Brand Logo Integration */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <img
              src="/pascal-logo.png"
              alt="Pascal Logo"
              className="h-10 w-auto object-contain"
            />
            <div>
              <h2 className="font-bold text-emerald-900 text-sm">Pascal Assessment</h2>
              <span className="text-xs text-emerald-600 font-medium">Cổng Giáo viên</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <Link
              href="/teacher/dashboard"
              className="flex items-center gap-3 rounded-lg bg-emerald-600/15 px-3 py-2 text-sm font-semibold text-emerald-700"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/teacher/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-emerald-100 hover:text-emerald-900 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>Bài kiểm tra PDF</span>
            </Link>
            <Link
              href="/teacher/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-emerald-100 hover:text-emerald-900 transition-colors"
            >
              <Users className="h-4 w-4" />
              <span>Lớp học trực tiếp</span>
            </Link>
            <Link
              href="/teacher/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-emerald-100 hover:text-emerald-900 transition-colors"
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
            <h1 className="text-2xl font-bold text-slate-800">Quản lý Bài kiểm tra & Giao bài</h1>
            <p className="text-sm text-slate-500">
              Danh sách bài tập PDF tương tác của bạn ({currentUser.email || "Giáo viên"})
            </p>
          </div>

          <Link
            href="/teacher/assignment/new-assignment"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-colors"
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
                    const sessionData = sessionsMap[assignment.assignmentId!];
                    const classCode = sessionData?.classCode || (assignment as any).classCode || assignment.assignmentId?.slice(0, 6).toUpperCase() || "PAS888";
                    const sessionStatus = sessionData?.status;
                    const statusText = sessionStatus === "active" ? "Đang diễn ra" : sessionStatus === "paused" || sessionStatus === "stopped" ? "Tạm dừng" : sessionStatus === "archived" ? "Đã kết thúc" : "Chưa có Live";
                    const statusColor = sessionStatus === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : sessionStatus === "paused" || sessionStatus === "stopped" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : sessionStatus === "archived" ? "bg-slate-500/10 text-slate-400 border-slate-500/20" : "bg-slate-800/50 text-slate-500 border-slate-700";

                    return (
                      <tr
                        key={assignment.assignmentId}
                        className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                        onClick={() => {
                          if (sessionStatus) {
                            router.push(`/teacher/session/${classCode}`);
                          } else {
                            router.push(`/teacher/assignment/${assignment.assignmentId}`);
                          }
                        }}
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
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusColor}`}>
                            {statusText}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/teacher/assignment/${assignment.assignmentId}`}
                              className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors inline-flex items-center gap-1.5"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>Biên tập Bài tập</span>
                            </Link>
                            <button
                              onClick={() =>
                                handleStartLiveSession(assignment, classCode)
                              }
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Play className="h-3.5 w-3.5" />
                              <span>Mở lớp Live</span>
                            </button>
                            <button
                              onClick={() => handleDeleteAssignment(assignment)}
                              className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors shadow-sm ml-1"
                              title="Xóa bài tập này"
                            >
                              <Trash2 className="h-4 w-4" />
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
