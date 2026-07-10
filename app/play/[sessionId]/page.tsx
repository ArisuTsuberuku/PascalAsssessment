"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
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
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userUid, setUserUid] = useState<string | null>(null);
  const [loadingGuard, setLoadingGuard] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [sessionStatus, setSessionStatus] = useState<
    "active" | "paused" | "closed" | "stopped"
  >("active");

  const draft = useAssignmentEditorStore((state) => state.draft);
  const loadDraft = useAssignmentEditorStore((state) => state.loadDraft);
  const clearDraft = useAssignmentEditorStore((state) => state.clearDraft);
  const studentAnswers = useAssignmentEditorStore(
    (state) => state.studentAnswers
  );
  const annotations = useAssignmentEditorStore((state) => state.annotations);
  const setActiveSubmissionId = useAssignmentEditorStore(
    (state) => state.setActiveSubmissionId
  );

  // EFFECT 1: STRICT AUTHENTICATION GATE
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await auth.authStateReady();
        let user = auth.currentUser;
        if (!user) {
          // If student refreshed page directly, silently sign in anonymously
          const cred = await signInAnonymously(auth);
          user = cred.user;
        }
        await user.getIdToken(true); // Kill ghost tokens
        setUserUid(user.uid);
        setIsAuthReady(true); // Open the gate
      } catch (err) {
        console.error("Lỗi xác thực:", err);
        setErrorMsg("Lỗi xác thực hệ thống.");
      }
    };
    verifyAuth();
  }, []);

  // EFFECT 2: STRICT DATA FETCHING (Only runs after Auth is Ready & userUid is confirmed)
  useEffect(() => {
    if (!isAuthReady || !userUid || !sessionId) return; // THE IRON GATE

    let isMounted = true;
    let unsubscribeSession = () => {};

    const fetchSessionAndAssignment = async () => {
      try {
        // 1. Verify session storage / local storage identity
        const rawSession =
          sessionStorage.getItem("pascal_student_session") ||
          localStorage.getItem("pascal_student_session");
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

        if (isMounted) {
          setSessionData(parsed);
          setActiveSubmissionId(parsed.submissionId);
        }

        // 2. Setup Session Snapshot
        unsubscribeSession = onSnapshot(
          doc(db, "sessions", sessionId),
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              if (data?.status) {
                setSessionStatus(data.status as any);
              }
            }
          }
        );

        // 3. Fetch Assignment SAFELY
        const existing = await getAssignment(parsed.classCode);
        if (!existing) {
          if (isMounted) {
            setErrorMsg("Đề kiểm tra không tồn tại hoặc đã bị đóng.");
            setLoadingGuard(false);
          }
          return;
        }

        // 4. Setup Submission logic (Name as Key & Takeover mechanism)
        try {
          const currentUser = auth.currentUser;
          if (!currentUser) throw new Error("Chưa đăng nhập ẩn danh!");

          const studentName =
            parsed.studentName ||
            sessionStorage.getItem("studentName") ||
            "Học sinh ẩn danh";

          // 1. Query by SESSION and NAME (Name is the key)
          const submissionsRef = collection(db, "student_submissions");
          const q = query(
            submissionsRef,
            where("sessionId", "==", parsed.classCode),
            where("studentName", "==", studentName)
          );

          const snapshot = await getDocs(q);

          if (snapshot.empty) {
            // 2A. NEW STUDENT: Create new submission
            await setDoc(
              doc(db, "student_submissions", parsed.submissionId),
              {
                sessionId: parsed.classCode,
                studentId: currentUser.uid,
                studentName: studentName,
                mode: parsed.mode || "individual",
                teamName: parsed.teamName || null,
                status: "Đang làm bài",
                answers: {},
                progress: "0%",
                score: "Đang làm",
                startedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );

            // CRITICAL FIX: TẨY TRẮNG BỘ NHỚ TRÌNH DUYỆT (Prevent memory ghosting / state leak)
            useAssignmentEditorStore.setState({
              studentAnswers: {},
              annotations: [],
            });

            setActiveSubmissionId(parsed.submissionId);
            console.log(
              "✅ [Student Init] Tạo bài làm mới & tẩy trắng state thành công cho:",
              studentName
            );
          } else {
            // 2B. RETURNING STUDENT: Resume existing submission
            const existingDoc = snapshot.docs[0];
            const existingData = existingDoc.data();

            // "Takeover" mechanism: If the student lost their previous anonymous session,
            // link this new UID to their old document so Auto-save works.
            if (existingData.studentId !== currentUser.uid) {
              await updateDoc(existingDoc.ref, {
                studentId: currentUser.uid,
                updatedAt: serverTimestamp(),
              });
              console.log(
                "🔄 [Takeover] Cập nhật sở hữu bài làm sang UID mới cho:",
                studentName
              );
            }

            // LOAD PREVIOUS ANSWERS INTO UI STATE
            if (
              existingData.answers &&
              typeof existingData.answers === "object"
            ) {
              useAssignmentEditorStore.setState({
                studentAnswers: existingData.answers,
              });
            }
            if (Array.isArray(existingData.annotations)) {
              useAssignmentEditorStore.setState({
                annotations: existingData.annotations,
              });
            }
            setActiveSubmissionId(existingDoc.id);
            console.log(
              "🚀 [Resume] Khôi phục bài làm hiện có thành công cho:",
              studentName
            );
          }
        } catch (subErr) {
          console.error("❌ [Student Init] Lỗi khởi tạo bài làm:", subErr);
        }

        // 5. Load into store & FORCE preview mode for student
        if (isMounted) {
          loadDraft(existing);
          useAssignmentEditorStore.setState({ isPreviewMode: true });
          setLoadingGuard(false);
        }
      } catch (err: any) {
        console.error("Error loading exam assignment:", err);
        if (isMounted) {
          setErrorMsg(
            `Lỗi tải dữ liệu: ${err?.message || "Không thể tải phòng thi"}`
          );
          setLoadingGuard(false);
        }
      }
    };

    fetchSessionAndAssignment();

    return () => {
      isMounted = false;
      unsubscribeSession();
      clearDraft();
    };
  }, [
    isAuthReady,
    userUid,
    sessionId,
    loadDraft,
    clearDraft,
    setActiveSubmissionId,
  ]);

  // Total questions calculation
  const allItems = draft?.sections?.flatMap((sec) => sec.items || []) || [];
  const totalQuestions = allItems.length;
  const completedCount = Object.keys(studentAnswers || {}).length;

  useAutoSaveProgress({
    answers: studentAnswers,
    annotations,
    totalQuestions,
    submissionId: sessionData?.submissionId,
    db,
  });

  const handleStudentSubmit = async () => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn nộp bài? Sau khi nộp sẽ không thể chỉnh sửa lại."
      )
    )
      return;

    if (!sessionData?.submissionId) return;

    try {
      await updateDoc(
        doc(db, "student_submissions", sessionData.submissionId),
        {
          studentId: userUid || sessionData.submissionId,
          status: "submitted",
          answers: studentAnswers,
          annotations: annotations,
          submittedAt: serverTimestamp(),
        }
      );

      router.push("/");
    } catch (error) {
      console.error("Lỗi khi nộp bài:", error);
      alert("Có lỗi xảy ra khi nộp bài. Vui lòng thử lại!");
    }
  };

  // UI BLOCKER 1: ERRORS
  if (errorMsg) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100">
        <div className="flex max-w-md flex-col items-center text-center rounded-2xl border border-red-500/30 bg-slate-900/90 p-8 shadow-2xl">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            Không Thể Vào Phòng Thi
          </h1>
          <p className="text-sm text-slate-400 mb-6">{errorMsg}</p>
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

  // UI BLOCKER 2: HARD LOADING SCREEN (User MUST see this while !isAuthReady || loadingGuard)
  if (!isAuthReady || loadingGuard || !draft || !sessionData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-300 animate-pulse">
            Đang xác thực an ninh phòng thi...
          </p>
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

          {sessionStatus === "active" && (
            <button
              onClick={handleStudentSubmit}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg font-semibold shadow-lg transition-all active:scale-95"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2L11 13"></path>
                <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
              </svg>
              Nộp bài
            </button>
          )}

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

      {/* Phase 1.3: Student Lock Overlay - Paused */}
      {sessionStatus === "paused" && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-md flex items-center justify-center pointer-events-auto">
          <div className="bg-white p-8 rounded-2xl text-center shadow-2xl max-w-md border-t-8 border-yellow-500 animate-in fade-in zoom-in duration-300">
            <div className="text-6xl mb-4">⏸️</div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              Đang Tạm Dừng
            </h2>
            <p className="text-slate-600 text-lg">
              Giáo viên đã tạm dừng bài làm. Vui lòng giữ nguyên vị trí và đợi hiệu lệnh tiếp theo.
            </p>
          </div>
        </div>
      )}

      {/* Phase 1.3: Student Lock Overlay - Closed or Stopped */}
      {(sessionStatus === "closed" || sessionStatus === "stopped") && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/90 backdrop-blur-md flex items-center justify-center pointer-events-auto">
          <div className="bg-white p-8 rounded-2xl text-center shadow-2xl max-w-md border-t-8 border-red-600 animate-in fade-in zoom-in duration-300">
            <div className="text-6xl mb-4">⏹️</div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              Đã Kết Thúc
            </h2>
            <p className="text-slate-600 text-lg mb-6">
              Thời gian làm bài đã kết thúc. Bài làm của bạn đã được hệ thống tự động nộp.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors w-full"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
