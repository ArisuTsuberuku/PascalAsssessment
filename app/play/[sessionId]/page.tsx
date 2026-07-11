"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
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
  getDoc,
  addDoc,
  arrayUnion,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { getAssignment } from "@/services/assignmentService";
import { useAssignmentEditorStore } from "@/store/useAssignmentEditorStore";
import dynamic from "next/dynamic";
import SplitLayout from "@/components/layout/SplitLayout";
import QuestionSidebar from "@/components/sidebar/QuestionSidebar";
import { useAutoSaveProgress } from "@/hooks/useAutoSaveProgress";
import { useAntiCheat } from "@/hooks/useAntiCheat";
import { calculateScore } from "@/lib/calculateScore";
import RichTextModal from "@/components/live/RichTextModal";

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
    "active" | "paused" | "closed" | "stopped" | "archived"
  >("active");
  const [submissionStatus, setSubmissionStatus] = useState<string>("in_progress");
  const [needsHelp, setNeedsHelp] = useState(false);

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
  const setStudentAnswer = useAssignmentEditorStore(
    (state) => state.setStudentAnswer
  );
  const activeEssayId = useAssignmentEditorStore(
    (state) => state.activeEssayId
  );
  const setActiveEssayId = useAssignmentEditorStore(
    (state) => state.setActiveEssayId
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

        // Fetch session doc to retrieve teacherId securely for Principle of Least Privilege
        let teacherId = existing.teacherId || null;
        try {
          const sessionSnap = await getDoc(doc(db, "sessions", sessionId));
          if (sessionSnap.exists() && sessionSnap.data()?.teacherId) {
            teacherId = sessionSnap.data().teacherId;
          }
        } catch (err) {
          console.warn("Could not fetch session doc teacherId:", err);
        }

        // 4. Setup Submission logic — GROUP-AWARE MERGE
        try {
          const currentUser = auth.currentUser;
          if (!currentUser) throw new Error("Chưa đăng nhập ẩn danh!");

          const studentName =
            parsed.studentName ||
            sessionStorage.getItem("studentName") ||
            "Học sinh ẩn danh";

          const isGroupMode = parsed.mode === "group" && parsed.teamName;

          // Set session mode in Zustand store for AutoSave to use
          useAssignmentEditorStore.setState({
            sessionMode: isGroupMode ? "group" : "individual",
          });

          if (isGroupMode) {
            // ═══════════════════════════════════════════════════
            // GROUP MODE: Shared document, merge via arrayUnion
            // ═══════════════════════════════════════════════════
            const groupDocRef = doc(db, "student_submissions", parsed.submissionId);
            const groupSnap = await getDoc(groupDocRef);

            if (groupSnap.exists()) {
              // GROUP EXISTS: Append this student to members array
              const existingData = groupSnap.data();

              // Soft-limit check: warn if >= 6 members
              const currentMembers = existingData.members || [];
              const alreadyJoined = currentMembers.some(
                (m: any) => m.name === studentName || m.studentId === currentUser.uid
              );

              if (!alreadyJoined && currentMembers.length >= 6) {
                const proceed = window.confirm(
                  `Nhóm "${parsed.teamName}" đã có ${currentMembers.length} thành viên. Bạn có chắc muốn tham gia thêm?`
                );
                if (!proceed) {
                  if (isMounted) {
                    setErrorMsg("Bạn đã hủy tham gia nhóm.");
                    setLoadingGuard(false);
                  }
                  return;
                }
              }

              // Append member via arrayUnion (atomic, no race condition)
              if (!alreadyJoined) {
                await updateDoc(groupDocRef, {
                  members: arrayUnion({
                    studentId: currentUser.uid,
                    name: studentName,
                    joinedAt: new Date().toISOString(),
                  }),
                  updatedAt: serverTimestamp(),
                });
                console.log("👥 [Group Join] Đã thêm thành viên vào nhóm:", studentName);
              } else {
                // Takeover: update studentId if changed
                console.log("🔄 [Group Resume] Thành viên đã có trong nhóm, tiếp tục làm bài.");
              }

              if (existingData.status) {
                setSubmissionStatus(existingData.status);
              }

              // Hydrate local store from existing group data
              if (existingData.answers && typeof existingData.answers === "object") {
                useAssignmentEditorStore.setState({
                  studentAnswers: existingData.answers,
                });
              }
              if (Array.isArray(existingData.annotations)) {
                useAssignmentEditorStore.setState({
                  annotations: existingData.annotations,
                });
              }
              if (Array.isArray(existingData.members)) {
                useAssignmentEditorStore.setState({
                  groupMembers: existingData.members,
                });
              }

              setActiveSubmissionId(parsed.submissionId);
            } else {
              // GROUP DOESN'T EXIST YET: Create shared document
              await setDoc(groupDocRef, {
                sessionId: parsed.classCode,
                studentId: currentUser.uid,
                studentName: parsed.teamName, // Display name = team name
                teacherId: teacherId,
                answers: {},
                annotations: [],
                members: [{
                  studentId: currentUser.uid,
                  name: studentName,
                  joinedAt: new Date().toISOString(),
                }],
                cheatLogs: { blurCount: 0, tabSwitchCount: 0 },
                score: null,
                status: "in_progress",
                progress: "0%",
                mode: "group",
                teamName: parsed.teamName,
                startedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });

              useAssignmentEditorStore.setState({
                studentAnswers: {},
                annotations: [],
                groupMembers: [{
                  studentId: currentUser.uid,
                  name: studentName,
                  joinedAt: new Date().toISOString(),
                }],
              });

              setActiveSubmissionId(parsed.submissionId);
              setSubmissionStatus("in_progress");
              console.log("✅ [Group Create] Tạo nhóm mới:", parsed.teamName);
            }
          } else {
            // ═══════════════════════════════════════════════════
            // INDIVIDUAL MODE: Original logic (Name as Key)
            // ═══════════════════════════════════════════════════
            const submissionsRef = collection(db, "student_submissions");
            const q = query(
              submissionsRef,
              where("sessionId", "==", parsed.classCode),
              where("studentName", "==", studentName)
            );

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
              await setDoc(
                doc(db, "student_submissions", parsed.submissionId),
                {
                  sessionId: parsed.classCode,
                  studentId: currentUser.uid,
                  studentName: studentName,
                  teacherId: teacherId,
                  answers: {},
                  annotations: [],
                  cheatLogs: { blurCount: 0, tabSwitchCount: 0 },
                  score: null,
                  status: "in_progress",
                  progress: "0%",
                  mode: "individual",
                  teamName: null,
                  startedAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              );

              useAssignmentEditorStore.setState({
                studentAnswers: {},
                annotations: [],
              });

              setActiveSubmissionId(parsed.submissionId);
              setSubmissionStatus("in_progress");
              console.log("✅ [Individual Init] Tạo bài làm mới cho:", studentName);
            } else {
              const existingDoc = snapshot.docs[0];
              const existingData = existingDoc.data();

              if (existingData.status) {
                setSubmissionStatus(existingData.status);
              }

              if (
                existingData.studentId !== currentUser.uid ||
                (teacherId && !existingData.teacherId)
              ) {
                await updateDoc(existingDoc.ref, {
                  studentId: currentUser.uid,
                  ...(teacherId && !existingData.teacherId ? { teacherId } : {}),
                  updatedAt: serverTimestamp(),
                });
              }

              if (existingData.answers && typeof existingData.answers === "object") {
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
              console.log("🚀 [Individual Resume] Khôi phục bài làm cho:", studentName);
            }
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

  // Real-time auto-grading
  const gradedResult = useMemo(() => {
    if (!draft?.sections || Object.keys(studentAnswers || {}).length === 0) {
      return null;
    }
    return calculateScore(studentAnswers, draft.sections);
  }, [studentAnswers, draft?.sections]);

  // Anti-Cheat Engine
  const { cheatLogs, totalWarnings } = useAntiCheat(
    sessionData?.submissionId,
    db
  );

  // Auto-save with hydration controls
  const { markHydrated, setRemoteHydrating } = useAutoSaveProgress({
    answers: studentAnswers,
    annotations,
    totalQuestions,
    submissionId: sessionData?.submissionId,
    db,
    gradedResult,
  });

  const [liveTeacherAnnotations, setLiveTeacherAnnotations] = useState<any[]>(
    []
  );

  // Group member join toast
  const [memberToast, setMemberToast] = useState<string | null>(null);
  const prevMemberCount = useRef(0);

  const sessionMode = useAssignmentEditorStore((state) => state.sessionMode);
  const groupMembers = useAssignmentEditorStore((state) => state.groupMembers);

  // Real-time Sync (Group-aware with anti-ping-pong)
  useEffect(() => {
    if (!sessionData?.submissionId) return;

    const docRef = doc(db, "student_submissions", sessionData.submissionId);
    let isFirstSnapshot = true;

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();

      if (data.status) {
        setSubmissionStatus(data.status);
      }
      if (data.needsHelp !== undefined) {
        setNeedsHelp(!!data.needsHelp);
      }

      // ANTI-PING-PONG: Mark remote hydration BEFORE setting state
      setRemoteHydrating(true);

      // Sync answers (merge for group mode, overwrite for individual)
      if (data.answers && typeof data.answers === "object") {
        if (sessionMode === "group") {
          // MERGE: Only update keys that are different, don't overwrite local edits
          useAssignmentEditorStore.setState((state) => ({
            studentAnswers: { ...state.studentAnswers, ...data.answers },
          }));
        } else {
          useAssignmentEditorStore.setState({
            studentAnswers: data.answers,
          });
        }
      }

      // Sync annotations
      const studentLines = data.studentAnnotations || data.annotations || [];
      const teacherLines = data.teacherAnnotations || [];

      useAssignmentEditorStore.setState({
        annotations: studentLines,
      });
      setLiveTeacherAnnotations(teacherLines);

      // Sync group members + toast
      if (data.members && Array.isArray(data.members)) {
        const newCount = data.members.length;
        const oldCount = prevMemberCount.current;

        if (!isFirstSnapshot && newCount > oldCount) {
          // Someone new joined! Show toast
          const newMember = data.members[data.members.length - 1];
          setMemberToast(`👥 ${newMember.name} đã tham gia nhóm`);
          setTimeout(() => setMemberToast(null), 4000);
        }

        prevMemberCount.current = newCount;
        useAssignmentEditorStore.setState({
          groupMembers: data.members,
        });
      }

      // Mark hydration complete on first snapshot
      if (isFirstSnapshot) {
        markHydrated();
        isFirstSnapshot = false;
      }

      // ANTI-PING-PONG: Clear remote flag AFTER state has been set
      // Use requestAnimationFrame to ensure React has processed the state updates
      requestAnimationFrame(() => {
        setRemoteHydrating(false);
      });
    });

    return () => unsubscribe();
  }, [sessionData?.submissionId, sessionMode, markHydrated, setRemoteHydrating]);

  const toggleRaiseHand = async () => {
    if (!sessionData?.submissionId) return;
    const nextVal = !needsHelp;
    setNeedsHelp(nextVal);
    try {
      await updateDoc(doc(db, "student_submissions", sessionData.submissionId), {
        needsHelp: nextVal,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Lỗi cập nhật giơ tay:", err);
      setNeedsHelp(!nextVal);
    }
  };

  const handleStudentSubmit = async () => {
    const memberNames =
      groupMembers && groupMembers.length > 0
        ? groupMembers.map((m: any) => m.name).join(", ")
        : "";
    const confirmMessage =
      sessionMode === "group" && memberNames
        ? `Bạn đang nộp bài thay mặt cho CẢ NHÓM (${memberNames}). Các thành viên khác sẽ không thể làm bài tiếp. Bạn có chắc chắn?`
        : "Bạn có chắc chắn muốn nộp bài? Sau khi nộp sẽ không thể chỉnh sửa lại.";

    if (!window.confirm(confirmMessage)) return;

    if (!sessionData?.submissionId) return;

    try {
      // Calculate final score at submission time
      const finalGrade = draft?.sections
        ? calculateScore(studentAnswers, draft.sections)
        : null;

      await updateDoc(
        doc(db, "student_submissions", sessionData.submissionId),
        {
          studentId: userUid || sessionData.submissionId,
          status: "submitted",
          answers: studentAnswers,
          annotations: annotations,
          cheatLogs: {
            blurCount: cheatLogs.blurCount,
            tabSwitchCount: cheatLogs.tabSwitchCount,
            copyAttempts: cheatLogs.copyAttempts,
            pasteAttempts: cheatLogs.pasteAttempts,
            rightClickAttempts: cheatLogs.rightClickAttempts,
          },
          warnings: totalWarnings,
          ...(finalGrade
            ? {
                score: `${finalGrade.totalScore}/${finalGrade.maxScore}`,
                percentage: finalGrade.percentage,
                gradedAnswers: finalGrade.gradedAnswers,
              }
            : {}),
          submittedAt: serverTimestamp(),
        }
      );

      setSubmissionStatus("submitted");
      router.push("/");
    } catch (error) {
      console.error("Lỗi khi nộp bài:", error);
      alert("Có lỗi xảy ra khi nộp bài. Vui lòng thử lại!");
    }
  };

  // UI BLOCKER 1: ERRORS
  if (errorMsg) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f4fbf7] p-6 text-slate-800">
        <div className="flex max-w-md flex-col items-center text-center rounded-2xl border border-red-200 bg-white p-8 shadow-xl">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 border border-red-200">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">
            Không Thể Vào Phòng Thi
          </h1>
          <p className="text-sm text-slate-600 mb-6">{errorMsg}</p>
          <Link
            href={`/student?code=${sessionId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700 transition-colors"
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f4fbf7] p-6 text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-600 animate-pulse">
            Đang xác thực an ninh phòng thi...
          </p>
        </div>
      </main>
    );
  }

  // UI BLOCKER 3: SUBMITTED STATE - COMPLETION SCREEN
  if (submissionStatus === "submitted") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f4fbf7] p-6 text-slate-800">
        <div className="flex max-w-md w-full flex-col items-center text-center rounded-2xl border border-emerald-200 bg-white p-8 shadow-xl">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3">
            Đã nộp bài thành công!
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-8">
            Bài làm của bạn đã được gửi tới giáo viên. Vui lòng chờ giáo viên chấm điểm và trả kết quả.
          </p>
          <Link
            href="/student"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
          >
            <span>Về trang chủ học sinh</span>
          </Link>
        </div>
      </main>
    );
  }



  return (
    <div className="flex h-screen w-full flex-col bg-[#f4fbf7] overflow-hidden text-slate-800">
      {/* Student Exam Header */}
      <header className="h-14 border-b border-emerald-200 bg-white px-6 flex items-center justify-between z-20 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="font-mono rounded bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
            MÃ LỚP: {sessionData.classCode}
          </span>
          <h1 className="text-sm font-bold text-slate-800 truncate max-w-md">
            {draft.title || "Bài kiểm tra"}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 border border-slate-200 text-xs">
            <span className="text-slate-600">Đã làm:</span>
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

          {/* Raise Hand Signal Toggle Button */}
          <button
            onClick={toggleRaiseHand}
            title={
              needsHelp
                ? "Hạ tay xuống (Đã gọi hỗ trợ)"
                : "Giơ tay xin hỗ trợ từ giáo viên"
            }
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              needsHelp
                ? "bg-red-500 text-white border-red-400 animate-pulse shadow-lg shadow-red-500/30"
                : "bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300"
            }`}
          >
            <span>✋</span>
            <span>{needsHelp ? "Đang gọi hỗ trợ" : "Giơ tay"}</span>
          </button>

          {sessionStatus === "active" && (
            <button
              onClick={handleStudentSubmit}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg font-semibold shadow-lg transition-all active:scale-95"
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

          <span className="text-xs text-slate-500">
            Thí sinh:{" "}
            <strong className="text-slate-800">{sessionData.studentName}</strong>
          </span>

          {/* GROUP MODE: Live Member Badges */}
          {sessionMode === "group" && groupMembers.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200">
              <span className="text-emerald-800 text-[11px] font-semibold">
                👥 {sessionData.teamName}:
              </span>
              <div className="flex items-center gap-1">
                {groupMembers.map((member: any, idx: number) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-white border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded-full"
                  >
                    {member.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {sessionMode !== "group" && sessionData.teamName && (
            <span className="text-xs text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
              Nhóm: {sessionData.teamName}
            </span>
          )}
        </div>
      </header>

      {/* TOAST: Group Member Joined Notification */}
      {memberToast && (
        <div className="fixed top-4 right-4 z-[99999] animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-2xl shadow-emerald-600/40 border border-emerald-400/30">
            {memberToast}
          </div>
        </div>
      )}

      {/* Main Interactive Exam Workspace */}
      <div className="flex-1 overflow-hidden">
        <SplitLayout
          leftContent={
            <PdfCanvasWrapper
              fileUrl={draft.pdfUrl}
              initialData={draft}
              isPreviewMode={true}
              studentAnnotations={annotations}
              teacherAnnotations={liveTeacherAnnotations}
              isDrawingEnabled={true}
              mode="session"
              role="student"
              onToggleRaiseHand={toggleRaiseHand}
              needsHelp={needsHelp}
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

      {/* Global Rich Text Modal for Essay Questions */}
      <RichTextModal
        isOpen={Boolean(activeEssayId)}
        onClose={() => setActiveEssayId(null)}
        value={activeEssayId ? studentAnswers[activeEssayId] || "" : ""}
        onChange={(content) => {
          if (activeEssayId) {
            setStudentAnswer(activeEssayId, content);
          }
        }}
        questionName={
          (() => {
            if (!draft?.sections) return "Bài làm tự luận";
            for (const sec of draft.sections) {
              const found = sec.items?.find((i) => i.id === activeEssayId);
              if (found) return found.name || "Bài làm tự luận";
            }
            return "Bài làm tự luận";
          })()
        }
      />
    </div>
  );
}
