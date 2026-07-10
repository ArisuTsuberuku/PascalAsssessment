"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAssignment } from "@/services/assignmentService";
import { useAssignmentEditorStore } from "@/store/useAssignmentEditorStore";
import dynamic from "next/dynamic";
import SplitLayout from "@/components/layout/SplitLayout";
import QuestionSidebar from "@/components/sidebar/QuestionSidebar";
import { useAutoSaveProgress } from "@/hooks/useAutoSaveProgress";

const PdfCanvasWrapper = dynamic(
  () => import("@/components/canvas/PdfCanvasWrapper"),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 text-white font-medium">
        Đang tải đề kiểm tra PDF...
      </div>
    ),
  }
);

interface StudentSessionData {
  classCode: string;
  studentName: string;
  mode: "individual" | "group";
  teamName: string | null;
  submissionId: string;
}

export default function StudentPlayPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = ((params?.sessionId as string) || "").toUpperCase();

  const [sessionData, setSessionData] = useState<StudentSessionData | null>(
    null
  );
  const [loadingGuard, setLoadingGuard] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const draft = useAssignmentEditorStore((state) => state.draft);
  const loadDraft = useAssignmentEditorStore((state) => state.loadDraft);
  const clearDraft = useAssignmentEditorStore((state) => state.clearDraft);
  const studentAnswers = useAssignmentEditorStore(
    (state) => state.studentAnswers
  );
  const setActiveSubmissionId = useAssignmentEditorStore(
    (state) => state.setActiveSubmissionId
  );

  useEffect(() => {
    let isMounted = true;

    async function initExamSession() {
      // 1. Verify local storage identity
      const rawSession = localStorage.getItem("pascal_student_session");
      if (!rawSession) {
        if (isMounted) {
          setErrorMsg(
            "Không tìm thấy phiên làm bài. Vui lòng đăng nhập từ sảnh chờ."
          );
          setLoadingGuard(false);
        }
        return;
      }

      let parsed: StudentSessionData;
      try {
        parsed = JSON.parse(rawSession);
      } catch (e) {
        if (isMounted) {
          setErrorMsg("Dữ liệu phiên làm bài bị lỗi.");
          setLoadingGuard(false);
        }
        return;
      }

      if (parsed.classCode !== sessionId) {
        if (isMounted) {
          setErrorMsg(
            `Mã lớp trong URL (${sessionId}) không khớp với phiên làm bài (${parsed.classCode}).`
          );
          setLoadingGuard(false);
        }
        return;
      }

      setSessionData(parsed);
      setActiveSubmissionId(parsed.submissionId);

      // 2. Fetch assignment from Firebase
      try {
        const existing = await getAssignment(parsed.classCode);
        if (!existing) {
          if (isMounted) {
            setErrorMsg("Đề kiểm tra không tồn tại hoặc đã bị đóng.");
            setLoadingGuard(false);
          }
          return;
        }

        // 3. Initialize Submission (The "Hello" Ping to trigger Teacher Live Dashboard)
        try {
          await setDoc(
            doc(db, "student_submissions", parsed.submissionId),
            {
              sessionId: parsed.classCode,
              studentName: parsed.studentName,
              mode: parsed.mode,
              teamName: parsed.teamName || null,
              status: "Đang làm bài",
              progress: "0%",
              score: "Đang làm",
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (pingErr) {
          console.warn("Ping live session warning:", pingErr);
        }

        // 4. Load into store & FORCE preview mode for student
        if (isMounted) {
          loadDraft(existing);
          useAssignmentEditorStore.setState({ isPreviewMode: true });
          setLoadingGuard(false);
        }
      } catch (err: any) {
        console.error("Error loading exam assignment:", err);
        if (isMounted) {
          setErrorMsg(
            "Lỗi khi tải đề thi: " +
              (err?.message || "Không thể kết nối máy chủ")
          );
          setLoadingGuard(false);
        }
      }
    }

    initExamSession();

    return () => {
      isMounted = false;
      clearDraft();
    };
  }, [sessionId, router, loadDraft, clearDraft, setActiveSubmissionId]);

  // Total questions calculation
  const allItems = draft?.sections?.flatMap((sec) => sec.items || []) || [];
  const totalQuestions = allItems.length;
  const completedCount = Object.keys(studentAnswers || {}).length;

  // Phase 2 & 3: Mount Universal Progress Sync Hook with 1000ms Debounce
  useAutoSaveProgress({
    answers: studentAnswers,
    totalQuestions,
    submissionId: sessionData?.submissionId,
    db,
  });

  if (loadingGuard) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-sm text-slate-400">
            Đang chuẩn bị phòng thi và kết nối trực tiếp...
          </p>
        </div>
      </main>
    );
  }

  if (errorMsg || !draft || !sessionData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100">
        <div className="flex max-w-md flex-col items-center text-center rounded-2xl border border-red-500/30 bg-slate-900/90 p-8 shadow-2xl">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            Không thể tải phòng thi
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            {errorMsg || "Đề thi chưa sẵn sàng."}
          </p>
          <Link
            href={`/student?code=${sessionId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Đăng nhập lại Sảnh học sinh</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 overflow-hidden text-slate-100">
      {/* Student Exam Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 px-6 flex items-center justify-between z-20 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="font-mono rounded bg-purple-500/20 px-2.5 py-1 text-xs font-bold text-purple-300 border border-purple-500/30">
            MÃ LỚP: {sessionData.classCode}
          </span>
          <h1 className="text-sm font-bold text-white truncate max-w-md">
            {draft.title || "Bài kiểm tra"}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1 border border-slate-700 text-xs">
            <span className="text-slate-400">Đã làm:</span>
            <strong
              className={
                completedCount === totalQuestions && totalQuestions > 0
                  ? "text-green-400"
                  : "text-amber-400"
              }
            >
              {completedCount} / {totalQuestions}
            </strong>
          </div>
          <span className="text-xs text-slate-400">
            Thí sinh:{" "}
            <strong className="text-white">{sessionData.studentName}</strong>
          </span>
          {sessionData.teamName && (
            <span className="text-xs text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
              Nhóm: {sessionData.teamName}
            </span>
          )}
        </div>
      </header>

      {/* Main Interactive Exam Workspace */}
      <div className="flex-1 overflow-hidden">
        <SplitLayout
          leftContent={
            <PdfCanvasWrapper
              fileUrl={draft.pdfUrl}
              initialData={draft}
              isPreviewMode={true}
            />
          }
          rightContent={<QuestionSidebar />}
        />
      </div>
    </div>
  );
}
