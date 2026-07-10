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
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import StudentStatsCard from "@/components/live/StudentStatsCard";
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

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
            <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-300">
              Real-time Firebase Sync
            </span>
          </div>
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
          {students.map((student) => (
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
                progress={student.progress || "0%"}
                score={student.score || "Đang làm"}
                warnings={student.warnings || 0}
              />
            </div>
          ))}
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
