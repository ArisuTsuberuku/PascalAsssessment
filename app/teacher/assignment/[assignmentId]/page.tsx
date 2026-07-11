"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAssignment } from "@/services/assignmentService";
import { useAssignmentEditorStore } from "@/store/useAssignmentEditorStore";
import { generateId } from "@/utils/generateId";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { storage, db, auth } from "@/lib/firebase";
import dynamic from "next/dynamic";
import SplitLayout from "@/components/layout/SplitLayout";
const PdfCanvasWrapper = dynamic(
  () => import("@/components/canvas/PdfCanvasWrapper"),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 text-white font-medium">
        Đang tải công cụ hiển thị PDF...
      </div>
    ),
  }
);
import QuestionSidebar from "@/components/sidebar/QuestionSidebar";
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  FileEdit,
  AlertTriangle,
  Eye,
} from "lucide-react";

interface PageProps {
  params: {
    assignmentId: string;
  };
}

export default function AssignmentEditorPage({ params }: PageProps) {
  const router = useRouter();
  const {
    draft,
    isLoading,
    isSaving,
    isPdfChanged,
    pendingPdfFile,
    isPreviewMode,
    togglePreviewMode,
    initBlankDraft,
    loadDraft,
    updateTitle,
    setSaving,
    clearDraft,
  } = useAssignmentEditorStore();

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false);

  // Initialize Draft on Mount / Cleanup on Unmount
  useEffect(() => {
    let isMounted = true;

    async function init() {
      // WIPE any legacy ghost annotations from store and localStorage before mounting editor
      useAssignmentEditorStore.setState({
        annotations: [],
        undoStack: [],
        redoStack: [],
      });
      try {
        const stored = localStorage.getItem("student-exam-storage");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.state?.annotations) {
            delete parsed.state.annotations;
            localStorage.setItem("student-exam-storage", JSON.stringify(parsed));
          }
        }
      } catch (e) {
        // Ignore localStorage access errors
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        if (isMounted) setIsUnauthorized(true);
        return;
      }

      const isNew = params.assignmentId === "new" || params.assignmentId === "new-assignment";
      if (isNew) {
        initBlankDraft();
      } else {
        try {
          const existing = await getAssignment(params.assignmentId);
          if (isMounted && existing) {
            if (existing.teacherId && existing.teacherId !== currentUser.uid) {
              setIsUnauthorized(true);
              return;
            }
            loadDraft(existing);
          } else if (isMounted) {
            setIsUnauthorized(true);
          }
        } catch (err) {
          console.error("Error loading assignment:", err);
          if (isMounted) setIsUnauthorized(true);
        }
      }
    }

    init();

    return () => {
      clearDraft();
    };
  }, [params.assignmentId, initBlankDraft, loadDraft, clearDraft]);

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await auth.authStateReady();
      const user = auth.currentUser;

      if (!user?.uid) {
        alert("Vui lòng đăng nhập để lưu bài tập!");
        setSaveError("Vui lòng đăng nhập lại để lưu bài.");
        setSaving(false);
        return;
      }

      // Force refresh token to bypass ghost token issues
      await user.getIdToken(true);

      const isNew =
        params.assignmentId === "new" || params.assignmentId === "new-assignment";
      const finalId = isNew ? generateId() : params.assignmentId;
      let finalPdfUrl = draft?.pdfUrl || "";

      // 1. Upload PDF if pending
      if (pendingPdfFile) {
        const storageRef = ref(storage, `pdfs/${finalId}.pdf`);
        await uploadBytes(storageRef, pendingPdfFile);
        finalPdfUrl = await getDownloadURL(storageRef);
      }

      // 2. Prepare final draft object securely injecting teacherId and updatedAt at root level
      const finalDraft: Record<string, any> = {
        ...draft,
        assignmentId: finalId,
        pdfUrl: finalPdfUrl,
        teacherId: user.uid, // REQUIRED BY SECURITY RULES
        updatedAt: serverTimestamp(),
      };

      if (isNew) {
        finalDraft.createdAt = serverTimestamp();
      }

      // 3. Save to Firestore
      await setDoc(doc(db, "assignments", finalId), finalDraft, {
        merge: true,
      });

      // 4. Invalidate Next.js cache so dashboard reflects updated assignments
      try {
        await fetch("/api/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignmentId: finalId }),
        });
      } catch (e) {
        console.warn("Cache revalidation note:", e);
      }
      router.refresh();

      // 5. Cleanup & Route
      useAssignmentEditorStore.getState().clearPendingPdf();
      loadDraft(finalDraft as any);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);

      alert("Lưu bài tập thành công!");

      if (isNew) {
        router.replace(`/teacher/assignment/${finalId}`);
      }
    } catch (err: any) {
      console.error("Lỗi khi lưu bài tập:", err);
      setSaveError("Lỗi khi lưu bài tập: " + err?.message);
      alert(`Lỗi khi lưu: ${err?.message || "Không thể lưu bài tập"}`);
    } finally {
      setSaving(false);
    }
  };

  if (isUnauthorized) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#f4fbf7] p-6 text-slate-800">
        <div className="flex max-w-md flex-col items-center text-center rounded-2xl border border-red-200 bg-white p-8 shadow-xl">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 border border-red-200">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">⛔ Cảnh báo: Bạn không có quyền truy cập đề kiểm tra này!</h1>
          <p className="text-sm text-slate-500 mb-6">
            Bài kiểm tra này thuộc về một tài khoản giáo viên khác hoặc bạn chưa được phân quyền truy cập.
          </p>
          <Link
            href="/teacher/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-emerald-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || !draft) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#f4fbf7] text-slate-600">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-sm font-medium">
          Đang chuẩn bị không gian làm việc...
        </p>
      </div>
    );
  }

  const isNewDraft = params.assignmentId === "new" || params.assignmentId === "new-assignment";

  return (
    <div className="flex h-screen w-full flex-col bg-[#f4fbf7] overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-emerald-200 bg-white px-6 flex items-center justify-between z-20 shrink-0 shadow-sm">
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <Link
            href="/teacher/dashboard"
            className="text-slate-500 hover:text-slate-800 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
            title="Quay lại Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="flex items-center gap-2 flex-1">
            <FileEdit className="h-4 w-4 text-emerald-600 shrink-0" />
            <input
              type="text"
              value={draft.title}
              onChange={(e) => updateTitle(e.target.value)}
              placeholder="Nhập tên bài tập..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
            />
          </div>

          <span className="text-sm font-semibold text-slate-600 flex items-center gap-2">
            MÃ:{" "}
            {isNewDraft ? (
              <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                CHƯA LƯU (BẢN NHÁP)
              </span>
            ) : (
              <code className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{draft?.assignmentId}</code>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {saveError && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg shadow-sm">
              <AlertTriangle className="h-3.5 w-3.5" />
              {saveError}
            </span>
          )}

          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg shadow-sm animate-fade-in">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Đã lưu thành công!
            </span>
          )}

          <button
            onClick={togglePreviewMode}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all shadow-sm active:scale-95 ${
              isPreviewMode
                ? "bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            {isPreviewMode ? "Quay lại Chỉnh sửa" : "Xem dạng Học sinh"}
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-emerald-500 disabled:opacity-50 transition-all active:scale-95"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {isSaving ? "Đang lưu..." : "Lưu Bài Tập"}
          </button>
        </div>
      </header>

      {/* Main 80/20 Split Workspace */}
      <div className="flex-1 overflow-hidden">
        <SplitLayout
          leftContent={<PdfCanvasWrapper mode="editor" isDrawingEnabled={false} />}
          rightContent={<QuestionSidebar />}
        />
      </div>
    </div>
  );
}
