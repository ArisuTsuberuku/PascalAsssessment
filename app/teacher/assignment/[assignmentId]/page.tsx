"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAssignment } from "@/services/assignmentService";
import { useAssignmentEditorStore } from "@/store/useAssignmentEditorStore";
import { generateId } from "@/utils/generateId";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { storage, db } from "@/lib/firebase";
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

  // Initialize Draft on Mount / Cleanup on Unmount
  useEffect(() => {
    let isMounted = true;

    async function init() {
      const isNew = params.assignmentId === "new" || params.assignmentId === "new-assignment";
      if (isNew) {
        initBlankDraft();
      } else {
        try {
          const existing = await getAssignment(params.assignmentId);
          if (isMounted && existing) {
            loadDraft(existing);
          } else if (isMounted) {
            initBlankDraft();
          }
        } catch (err) {
          console.error("Error loading assignment:", err);
          if (isMounted) initBlankDraft();
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
      const isNew = params.assignmentId === "new" || params.assignmentId === "new-assignment";
      const finalId = isNew ? generateId() : params.assignmentId;
      let finalPdfUrl = draft?.pdfUrl || "";

      // 1. Upload PDF if pending
      if (pendingPdfFile) {
        const storageRef = ref(storage, `pdfs/${finalId}.pdf`);
        await uploadBytes(storageRef, pendingPdfFile);
        finalPdfUrl = await getDownloadURL(storageRef);
      }

      // 2. Prepare final draft object
      const finalDraft = {
        ...draft,
        assignmentId: finalId,
        pdfUrl: finalPdfUrl,
      };

      // 3. Save to Firestore
      await setDoc(doc(db, "assignments", finalId), finalDraft);

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
      loadDraft(finalDraft);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);

      if (isNew) {
        router.replace(`/teacher/assignment/${finalId}`);
      }
    } catch (err: any) {
      console.error("Save failed:", err);
      setSaveError("Lỗi khi lưu bài tập: " + err?.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !draft) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 text-slate-200">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500 mb-4" />
        <p className="text-sm font-medium">
          Đang chuẩn bị không gian làm việc...
        </p>
      </div>
    );
  }

  const isNewDraft = params.assignmentId === "new" || params.assignmentId === "new-assignment";

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 px-6 flex items-center justify-between z-20 shrink-0 shadow-sm">
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <Link
            href="/teacher/dashboard"
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800"
            title="Quay lại Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="flex items-center gap-2 flex-1">
            <FileEdit className="h-4 w-4 text-purple-400 shrink-0" />
            <input
              type="text"
              value={draft.title}
              onChange={(e) => updateTitle(e.target.value)}
              placeholder="Nhập tên bài tập..."
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>

          <span className="text-sm font-semibold text-white flex items-center gap-2">
            MÃ:{" "}
            {isNewDraft ? (
              <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                CHƯA LƯU (BẢN NHÁP)
              </span>
            ) : (
              <code className="text-indigo-400">{draft?.assignmentId}</code>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {saveError && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
              <AlertTriangle className="h-3.5 w-3.5" />
              {saveError}
            </span>
          )}

          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg animate-fade-in">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Đã lưu thành công!
            </span>
          )}

          <button
            onClick={togglePreviewMode}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
              isPreviewMode
                ? "bg-amber-500/20 border-amber-500 text-amber-300 hover:bg-amber-500/30"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            {isPreviewMode ? "Quay lại Chỉnh sửa" : "Xem dạng Học sinh"}
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-purple-500 disabled:opacity-50 transition-all active:scale-95"
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
          leftContent={<PdfCanvasWrapper />}
          rightContent={<QuestionSidebar />}
        />
      </div>
    </div>
  );
}
