"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Activity,
  Loader2,
  AlertCircle,
  X,
  Eye,
  AlertTriangle,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import StudentStatsCard from "@/components/live/StudentStatsCard";
import { getAssignment } from "@/services/assignmentService";
import dynamic from "next/dynamic";
import { useAssignmentEditorStore } from "@/store/useAssignmentEditorStore";

const PdfCanvasWrapper = dynamic(
  () => import("@/components/canvas/PdfCanvasWrapper"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-12 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    ),
  }
);

interface PageProps {
  params: {
    classCode: string;
  };
}

export default function LiveSessionPage({ params }: PageProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const draft = useAssignmentEditorStore((state) => state.draft);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [sessionStatus, setSessionStatus] = useState<
    "active" | "paused" | "closed" | "stopped"
  >("active");

  const togglePause = async () => {
    const newStatus = sessionStatus === "paused" ? "active" : "paused";
    try {
      await updateDoc(doc(db, "sessions", params.classCode), {
        status: newStatus,
      });
    } catch (err) {
      console.error("Error toggling pause:", err);
    }
  };

  const closeSessionAndForceSubmit = async () => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn kết thúc? Hệ thống sẽ tự động thu bài của tất cả học sinh đang làm."
      )
    )
      return;

    try {
      const batch = writeBatch(db);

      // 1. Mark session as closed
      batch.update(doc(db, "sessions", params.classCode), {
        status: "closed",
      });

      // 2. Find all students currently in progress for this session
      const submissionsRef = collection(db, "student_submissions");
      const q = query(
        submissionsRef,
        where("sessionId", "==", params.classCode)
      );
      const snapshot = await getDocs(q);

      // 3. Force submit their work
      snapshot.forEach((submissionDoc) => {
        const data = submissionDoc.data();
        if (data.status !== "submitted" && data.status !== "Đã nộp") {
          batch.update(submissionDoc.ref, {
            status: "submitted",
            submittedAt: serverTimestamp(),
          });
        }
      });

      await batch.commit();
      alert("Đã thu bài toàn bộ học sinh!");
    } catch (error) {
      console.error("Lỗi khi đóng phòng thi:", error);
    }
  };

  useEffect(() => {
    // Phase 1: Secure Session Creation (Teacher Side)
    const ensureSessionExists = async () => {
      const user = auth.currentUser;
      if (!user?.uid) return;
      try {
        await setDoc(
          doc(db, "sessions", params.classCode),
          {
            classCode: params.classCode,
            teacherId: user.uid,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (e) {
        console.error("Error ensuring secure session doc:", e);
      }
    };
    ensureSessionExists();

    const unsubSession = onSnapshot(
      doc(db, "sessions", params.classCode),
      (snapshot) => {
        if (snapshot.exists() && snapshot.data()?.status) {
          setSessionStatus(snapshot.data().status);
        }
      }
    );
    return () => unsubSession();
  }, [params.classCode]);

  useEffect(() => {
    const fetchAssignmentTotal = async () => {
      try {
        const assignment = await getAssignment(params.classCode);
        if (assignment?.sections) {
          const count = assignment.sections.reduce(
            (acc: number, sec: any) => acc + (sec.items?.length || 0),
            0
          );
          setTotalQuestions(count);
        }
      } catch (err) {
        console.error("Error fetching assignment totalQuestions:", err);
      }
    };
    fetchAssignmentTotal();
  }, [params.classCode]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const q = query(
      collection(db, "student_submissions"),
      where("sessionId", "==", params.classCode)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const realData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStudents(realData);

        // Keep selectedStudent in sync if modal is open
        setSelectedStudent((prev: any) => {
          if (!prev) return null;
          const updated = realData.find((s) => s.id === prev.id);
          return updated || prev;
        });

        setLoading(false);
      },
      (err) => {
        console.error("Error listening to live session submissions:", err);
        setError("Lỗi kết nối thời gian thực: " + err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [params.classCode]);

  const session = { status: sessionStatus };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-8 text-slate-100 relative">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
        <div>
          <Link
            href="/teacher/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span>Giám sát Lớp học Trực tiếp (Live Statistics & Anti-Cheat)</span>
            <span className="font-mono rounded-lg bg-indigo-500/20 px-3 py-1 text-base text-indigo-300 border border-indigo-500/30">
              {params.classCode}
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Lưới thẻ thống kê hiệu năng cao — Nhấp vào từng học sinh để xem Livestream 1-on-1 đồng bộ nét vẽ và câu trả lời
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800">
            <span className={`relative flex h-3 w-3`}>
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  session.status === "active" ? "bg-emerald-400" : "bg-amber-400"
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  session.status === "active" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              ></span>
            </span>
            <span className="text-sm font-medium text-slate-300">
              {session.status === "active" ? "Đang diễn ra" : "Đang tạm dừng"}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-1"></div> {/* Divider */}

          {/* Pause / Play Button */}
          {session.status === "active" ? (
            <button
              onClick={togglePause}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-colors shadow-sm"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
              >
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              Tạm dừng
            </button>
          ) : (
            <button
              onClick={togglePause}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-colors shadow-sm"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
              >
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
              Tiếp tục
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={closeSessionAndForceSubmit}
            disabled={session.status === "closed" || session.status === "stopped"}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg hover:bg-rose-500/20 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
            Thu bài ngay
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2">
            <Users className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300">
              {students.length} học sinh
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
          <p className="text-sm font-medium">Đang kết nối luồng dữ liệu thời gian thực...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-16 text-center">
          <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">
            Chưa có học sinh nào tham gia phiên thi này
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Học sinh tham gia bằng mã lớp <span className="font-mono font-bold text-indigo-300">{params.classCode}</span> tại phòng thi học sinh sẽ tự động hiển thị ở đây.
          </p>
        </div>
      ) : (
        /* Phase 2: High-Performance StudentStatsCard Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {students.map((student) => {
            const answeredCount = Object.keys(student?.answers || {}).length;
            const progressPercent =
              totalQuestions > 0
                ? Math.round((answeredCount / totalQuestions) * 100)
                : parseInt((student?.progress || "0%").replace("%", ""), 10) ||
                  0;

            return (
              <div
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className="transition-transform hover:-translate-y-1 active:scale-[0.98]"
              >
                <StudentStatsCard
                  studentId={student.id}
                  studentName={
                    student.name ||
                    student.studentName ||
                    student.fullName ||
                    "HS #" + student.id.slice(0, 4)
                  }
                  status={student.status || "Online"}
                  progress={`${progressPercent}%`}
                  score={student.score || "Đang làm"}
                  warnings={student.warnings || 0}
                  answeredCount={answeredCount}
                  totalQuestions={totalQuestions}
                  answers={student?.answers}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Phase 3: The Livestream Fullscreen Modal Overlay */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col overflow-hidden animate-fade-in">
          {/* Livestream 1-on-1 Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-3.5 shadow-lg shrink-0">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
                <Eye className="h-3.5 w-3.5" />
                LIVESTREAM 1-ON-1
              </span>
              <h2 className="text-base font-bold text-white">
                Bài làm trực tiếp của:{" "}
                <span className="text-purple-400">
                  {selectedStudent.name ||
                    selectedStudent.studentName ||
                    selectedStudent.fullName ||
                    selectedStudent.id}
                </span>
              </h2>
              <span className="text-xs text-slate-400">
                (Tiến độ: <strong className="text-white">{selectedStudent.progress || "0%"}</strong> | Điểm:{" "}
                <strong className="text-indigo-300">{selectedStudent.score || "Đang tính"}</strong>)
              </span>
              {selectedStudent.warnings > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/30">
                  <AlertTriangle className="h-3 w-3" />
                  Rời tab {selectedStudent.warnings} lần
                </span>
              )}
            </div>

            <button
              onClick={() => setSelectedStudent(null)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-rose-600 hover:border-rose-500 hover:text-white transition-all shadow"
            >
              <X className="h-4 w-4" />
              <span>Đóng Livestream</span>
            </button>
          </div>

          {/* Full-Fidelity Real-time Synced Document & Strokes Viewer */}
          <div className="flex-1 relative w-full h-full overflow-hidden bg-slate-800">
            <PdfCanvasWrapper
              fileUrl={draft?.pdfUrl}
              initialData={draft}
              liveStudentData={selectedStudent}
              isPreviewMode={true}
              isLiveMonitor={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
