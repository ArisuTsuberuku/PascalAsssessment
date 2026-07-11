"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { debounce } from "lodash";
import CanvasToolbar from "@/components/canvas/CanvasToolbar";
import InteractiveCanvasItem from "@/components/canvas/InteractiveCanvasItem";
import DrawingLayer from "@/components/canvas/DrawingLayer";
import { Document, Page, pdfjs } from "react-pdf";
import { useAssignmentEditorStore } from "@/store/useAssignmentEditorStore";
import { CanvasItem } from "@/types/assignment";
import {
  FileText,
  Loader2,
  AlertCircle,
  UploadCloud,
  RefreshCw,
} from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

interface DrawingPath {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
}

function pointsToSvgPath(points: { x: number; y: number }[]) {
  if (!points || points.length === 0) return "";
  return points
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
    .join(" ");
}

interface PageCanvasLayerProps {
  pageNum: number;
  pageItems: CanvasItem[];
  baseW: number;
  isLiveMonitor?: boolean;
  liveStudentData?: any;
  activeStudentTool?: string;
  activeSubmissionId?: string | null;
  role?: "teacher" | "student";
  studentAnnotations?: any[];
  teacherAnnotations?: any[];
  onTeacherAnnotationAdd?: (ann: any) => void;
  onTeacherAnnotationRemove?: (id: string) => void;
  isDrawingEnabled?: boolean;
  mode?: "editor" | "session";
}

function PageCanvasLayer({
  pageNum,
  pageItems,
  baseW,
  isLiveMonitor = false,
  liveStudentData = null,
  activeStudentTool = "pointer",
  activeSubmissionId = null,
  role,
  studentAnnotations,
  teacherAnnotations,
  onTeacherAnnotationAdd,
  onTeacherAnnotationRemove,
  isDrawingEnabled = false,
  mode,
}: PageCanvasLayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(850);
  const [containerHeight, setContainerHeight] = useState<number>(1200);
  const setActivePdfPage = useAssignmentEditorStore(
    (state) => state.setActivePdfPage
  );
  const setPdfPage = useAssignmentEditorStore((state) => state.setPdfPage);

  // Phase 3: Drawing Overlay State (Making the Pen Work & Syncing to Firebase)
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(prev => prev !== entry.contentRect.width ? entry.contentRect.width : prev);
        }
        if (entry.contentRect.height > 0) {
          setContainerHeight(prev => prev !== entry.contentRect.height ? entry.contentRect.height : prev);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            setActivePdfPage(pageNum);
          }
        });
      },
      { threshold: 0.3 }
    );
    intersectionObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [pageNum, setActivePdfPage]);

  const scale = containerWidth / baseW;

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isLiveMonitor) return;
    if (activeStudentTool !== "pen" && activeStudentTool !== "highlighter")
      return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentPath({
      id: `stroke_${Date.now()}`,
      points: [{ x, y }],
      color: activeStudentTool === "highlighter" ? "#facc15" : "#ef4444",
      strokeWidth: activeStudentTool === "highlighter" ? 14 : 2.5,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!currentPath) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPath({
      ...currentPath,
      points: [...currentPath.points, { x, y }],
    });
  };

  const handlePointerUp = () => {
    if (!currentPath) return;
    const updatedPaths = [...paths, currentPath];
    setPaths(updatedPaths);
    setCurrentPath(null);

    // Sync drawing strokes to Firebase student_submissions so Teacher sees them in real-time
    if (!isLiveMonitor && activeSubmissionId) {
      updateDoc(doc(db, "student_submissions", activeSubmissionId), {
        paths: updatedPaths,
        updatedAt: serverTimestamp(),
      }).catch((err) =>
        console.warn("Realtime drawing sync to Firestore error:", err)
      );
    }
  };

  // If teacher is live monitoring, display the student's synced paths from Firebase
  const displayedPaths: DrawingPath[] = isLiveMonitor
    ? liveStudentData?.paths || liveStudentData?.drawings || []
    : [];

  // 🎯 DEBOUNCE LOGIC FOR TEACHER INK
  const incomingTeacherRaw = teacherAnnotations || liveStudentData?.teacherAnnotations || [];
  const incomingTeacherStr = JSON.stringify(incomingTeacherRaw);
  const incomingTeacher = React.useMemo(() => incomingTeacherRaw, [incomingTeacherStr]);
  
  const [localTeacherAnns, setLocalTeacherAnns] = useState<any[]>(incomingTeacher);
  const pendingTeacherAnns = useRef<any[]>(incomingTeacher);
  const hasPendingChanges = useRef<boolean>(false);

  useEffect(() => {
    if (!hasPendingChanges.current) {
      setLocalTeacherAnns(incomingTeacher);
      pendingTeacherAnns.current = incomingTeacher;
    }
  }, [incomingTeacher]);

  const debouncedTeacherSync = useCallback(
    debounce(async (targetId: string, currentStudent: any[], syncTeacherAnns: any[]) => {
      try {
        await updateDoc(doc(db, "student_submissions", targetId), {
          teacherAnnotations: syncTeacherAnns,
          studentAnnotations: currentStudent,
          updatedAt: serverTimestamp(),
        });
        console.log("✅ [Debounced Sync] Teacher ink synced to Firestore!");
        hasPendingChanges.current = false;
      } catch (err) {
        console.warn("Error updating teacher annotation in Firestore:", err);
      }
    }, 1000),
    []
  );

  const handleTeacherAnnAdd = (newAnn: any) => {
    newAnn.owner = "teacher";
    if (onTeacherAnnotationAdd) {
      onTeacherAnnotationAdd(newAnn);
      return;
    }
    const targetId = liveStudentData?.id || activeSubmissionId;
    if (!targetId) return;

    hasPendingChanges.current = true;
    const existingIdx = pendingTeacherAnns.current.findIndex((a: any) => a.id === newAnn.id);
    const updated = [...pendingTeacherAnns.current];
    if (existingIdx >= 0) {
      updated[existingIdx] = newAnn;
    } else {
      updated.push(newAnn);
    }
    
    pendingTeacherAnns.current = updated;
    setLocalTeacherAnns(updated);

    const currentStudent =
      studentAnnotations ||
      liveStudentData?.studentAnnotations ||
      liveStudentData?.annotations ||
      [];
    
    debouncedTeacherSync(targetId, currentStudent, updated);
  };

  const handleTeacherAnnRemove = (idToRemove: string) => {
    if (onTeacherAnnotationRemove) {
      onTeacherAnnotationRemove(idToRemove);
      return;
    }
    const targetId = liveStudentData?.id || activeSubmissionId;
    if (!targetId) return;

    hasPendingChanges.current = true;
    const updated = pendingTeacherAnns.current.filter(
      (ann: any) => ann.id !== idToRemove
    );
    
    pendingTeacherAnns.current = updated;
    setLocalTeacherAnns(updated);

    const currentStudent =
      studentAnnotations ||
      liveStudentData?.studentAnnotations ||
      liveStudentData?.annotations ||
      [];
    const updatedStudent = currentStudent.filter(
      (ann: any) => ann.id !== idToRemove
    );

    debouncedTeacherSync(targetId, updatedStudent, updated);
  };

  return (
    <div
      id={`pdf-page-${pageNum}`}
      ref={containerRef}
      onClick={() => setActivePdfPage(pageNum)}
      className="w-full max-w-[850px] aspect-[1000/1414] relative rounded-lg border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden flex flex-col"
    >
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <Page
          pageNumber={pageNum}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          onLoadSuccess={(pageProxy) => {
            setPdfPage(pageNum, pageProxy);
          }}
          className="w-full h-full flex items-center justify-center [&>canvas]:!w-full [&>canvas]:!h-full"
        />
      </div>

      {/* PHASE 3: REACT-KONVA HIGH PERFORMANCE DRAWING LAYER */}
      <DrawingLayer
        width={containerWidth}
        height={containerHeight || Math.round(containerWidth * 1.414)}
        pageNumber={pageNum}
        role={role}
        studentAnnotations={
          studentAnnotations ||
          liveStudentData?.studentAnnotations ||
          liveStudentData?.annotations ||
          liveStudentData?.drawings ||
          liveStudentData?.paths
        }
        teacherAnnotations={localTeacherAnns}
        onTeacherAnnotationAdd={handleTeacherAnnAdd}
        onTeacherAnnotationRemove={handleTeacherAnnRemove}
        isDrawingEnabled={isDrawingEnabled}
        mode={mode}
      />

      {/* REACT-RND INTERACTIVE OVERLAYS */}
      <div className="absolute inset-0 z-50 pointer-events-none">
        <div className="w-full h-full relative pointer-events-none">
          {pageItems.map((item) => (
            <InteractiveCanvasItem
              key={item.id}
              item={item}
              scale={scale}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export interface PdfCanvasWrapperProps {
  fileUrl?: string;
  readOnly?: boolean;
  isPreviewMode?: boolean;
  isLiveMonitor?: boolean;
  initialData?: any;
  liveStudentData?: any;
  role?: "teacher" | "student";
  studentAnnotations?: any[];
  teacherAnnotations?: any[];
  isDrawingEnabled?: boolean;
  mode?: "editor" | "session";
  onToggleRaiseHand?: () => void;
  needsHelp?: boolean;
}

export default function PdfCanvasWrapper({
  fileUrl,
  readOnly = false,
  isPreviewMode: propIsPreviewMode,
  isLiveMonitor = false,
  initialData = null,
  liveStudentData = null,
  role,
  studentAnnotations,
  teacherAnnotations,
  isDrawingEnabled = false,
  mode,
  onToggleRaiseHand,
  needsHelp,
}: PdfCanvasWrapperProps = {}) {
  const {
    draft: storeDraft,
    pdfPreviewUrl,
    setLocalPdf,
    activePdfPage,
    isPreviewMode: storeIsPreviewMode,
    studentAnswers,
    activeStudentTool,
    activeSubmissionId,
    zoomLevel,
  } = useAssignmentEditorStore();

  const draft = initialData || storeDraft;

  const isPreviewMode =
    propIsPreviewMode !== undefined ? propIsPreviewMode : storeIsPreviewMode;

  const [numPages, setNumPages] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTool = useAssignmentEditorStore((state) => state.activeTool);
  const activeTargetingQuestionId = useAssignmentEditorStore((state) => state.activeTargetingQuestionId);

  const handleTeacherAnnAdd = async (newAnn: any) => {
    newAnn.owner = "teacher";
    const targetId = liveStudentData?.id || activeSubmissionId;
    if (!targetId) return;
    const currentTeacher =
      teacherAnnotations || liveStudentData?.teacherAnnotations || [];
    const currentStudent =
      studentAnnotations ||
      liveStudentData?.studentAnnotations ||
      liveStudentData?.annotations ||
      [];
    const existingIdx = currentTeacher.findIndex((a: any) => a.id === newAnn.id);
    const updatedTeacher =
      existingIdx >= 0
        ? currentTeacher.map((a: any) => (a.id === newAnn.id ? newAnn : a))
        : [...currentTeacher, newAnn];
    try {
      await updateDoc(doc(db, "student_submissions", targetId), {
        teacherAnnotations: updatedTeacher,
        studentAnnotations: currentStudent,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Lỗi đồng bộ ghi chú của giáo viên:", err);
    }
  };

  const handleClearPage = async () => {
    if (mode === "editor" || !isDrawingEnabled) {
      useAssignmentEditorStore.getState().setAnnotations((prev) =>
        prev.filter((ann) => ann.pageNumber !== activePdfPage)
      );
      return;
    }

    const targetId = liveStudentData?.id || activeSubmissionId;
    if (!targetId) return;

    if (confirm(role === "teacher" ? "Bạn có chắc chắn muốn xóa TOÀN BỘ nội dung (bài làm và ghi chú) trên trang này?" : "Bạn có chắc chắn muốn xóa tất cả bài làm của bạn trên trang này?")) {
      try {
        const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
        if (role === "teacher") {
          const currentTeacher = teacherAnnotations || liveStudentData?.teacherAnnotations || [];
          const updatedTeacher = currentTeacher.filter((ann: any) => ann.pageNumber !== activePdfPage);
          
          const currentStudent = studentAnnotations || liveStudentData?.studentAnnotations || liveStudentData?.annotations || [];
          const updatedStudent = currentStudent.filter((ann: any) => ann.pageNumber !== activePdfPage);

          await updateDoc(doc(db, "student_submissions", targetId), {
            teacherAnnotations: updatedTeacher,
            studentAnnotations: updatedStudent,
            updatedAt: serverTimestamp(),
          });
        } else {
          const currentStudent = studentAnnotations || liveStudentData?.studentAnnotations || liveStudentData?.annotations || [];
          const updatedStudent = currentStudent.filter((ann: any) => ann.pageNumber !== activePdfPage);
          await updateDoc(doc(db, "student_submissions", targetId), {
            studentAnnotations: updatedStudent,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error("Lỗi xóa ghi chú trên trang:", err);
      }
    }
  };

  const allItems = draft?.sections?.flatMap((sec: any) => sec.items || []) || [];
  const totalQuestions = allItems.length;

  const completedCount = Object.keys(studentAnswers || {}).length;

  if (!draft) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setFileError("Vui lòng chọn tệp định dạng .pdf");
      return;
    }

    setLocalPdf(file);
  };

  const activePdfSource = fileUrl || pdfPreviewUrl || draft.pdfUrl;

  if (!activePdfSource) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 bg-slate-900/40">
        <div className="max-w-md w-full rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/80 p-8 text-center shadow-2xl flex flex-col items-center">
          <div className="mb-4 rounded-full bg-purple-500/10 p-4 border border-purple-500/20">
            <UploadCloud className="h-10 w-10 text-purple-400" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-white">
            Tải lên Đề thi PDF
          </h3>
          <p className="mb-6 text-xs leading-relaxed text-slate-400">
            Tệp PDF sẽ được xem trước trực tiếp trên bộ nhớ máy tính của bạn.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-purple-500 transition-all active:scale-95"
          >
            <UploadCloud className="h-4 w-4" />
            Chọn tệp PDF từ máy tính
          </button>

          {fileError && (
            <div className="mt-4 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const canvasItems: CanvasItem[] = [];
  draft.sections.forEach((section: any) => {
    section.items.forEach((item: any) => {
      if (item.placement === "canvas") {
        canvasItems.push(item as CanvasItem);
      }
    });
  });

  const baseW = draft.baseResolution?.width || 850;

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setFileError(null);
  };

  const onDocumentLoadError = (err: Error) => {
    console.error("Error loading PDF document:", err);
    setFileError("Không thể hiển thị PDF. Vui lòng kiểm tra định dạng tệp.");
  };



  const getCursorClass = () => {
    if (activeTool === "question_box" && activeTargetingQuestionId) return "cursor-crosshair";
    if (mode === "editor" || isLiveMonitor || !isDrawingEnabled)
      return "cursor-default";
    if (activeStudentTool === "pen" || activeStudentTool === "highlighter")
      return "cursor-crosshair";
    if (activeStudentTool === "text") return "cursor-text";
    if (activeStudentTool === "eraser") return "cursor-pointer";
    return "cursor-default";
  };

  return (
    <div
      className={`pdf-scroll-container w-full h-full overflow-y-auto bg-slate-900/60 p-6 md:p-8 flex flex-col items-center gap-6 relative ${getCursorClass()}`}
    >
      {/* FLOATING STUDENT PROGRESS COUNTER BADGE */}
      {isPreviewMode && !isLiveMonitor && (
        <div className="absolute top-4 right-4 z-50 bg-slate-900/90 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-xl border border-slate-700 flex items-center gap-3 pointer-events-none transition-all">
          <div className="relative flex h-3 w-3">
            {completedCount === totalQuestions && totalQuestions > 0 ? (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            ) : (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </>
            )}
          </div>
          <span className="text-sm font-semibold tracking-wide">
            Đã làm:{" "}
            <span
              className={
                completedCount === totalQuestions && totalQuestions > 0
                  ? "text-green-400"
                  : "text-amber-400"
              }
            >
              {completedCount}
            </span>{" "}
            / {totalQuestions}
          </span>
        </div>
      )}

      {/* FLOATING CANVAS TOOLBAR */}
      {(!isLiveMonitor || role === "teacher") && !readOnly && (
        <CanvasToolbar
          currentPageNumber={activePdfPage || 1}
          role={role}
          mode={mode || (isDrawingEnabled ? "session" : "editor")}
          onTeacherAnnotationAdd={handleTeacherAnnAdd}
          onToggleRaiseHand={onToggleRaiseHand}
          needsHelp={needsHelp}
          onClearPage={handleClearPage}
        />
      )}

      {/* Top Banner */}
      <div className="w-full max-w-[850px] flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/80 px-4 py-2.5 text-xs text-slate-300 shadow">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-purple-400" />
          <span className="font-semibold text-white">{draft.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-purple-300">
            {isLiveMonitor
              ? "🔴 LIVE 1-ON-1 MONITORING"
              : `Hệ tọa độ ảo: ${baseW}px`}
          </span>
          {numPages && (
            <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 font-mono">
              {numPages} Trang
            </span>
          )}
          {!isPreviewMode && !isLiveMonitor && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Đổi tệp PDF khác"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Đổi tệp PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* PDF Document Container with Zoom Scale */}
      <div
        className="w-full max-w-[850px] flex flex-col items-center gap-8 transition-transform duration-200 origin-top"
        style={{ transform: `scale(${zoomLevel || 1})` }}
      >
        <Document
          file={activePdfSource}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="w-full max-w-[850px] aspect-[1000/1414] rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col items-center justify-center gap-3 text-slate-400 shadow-2xl">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
              <span className="text-sm font-medium">
                Đang xử lý hiển thị PDF...
              </span>
            </div>
          }
          error={
            <div className="w-full max-w-[850px] aspect-[1000/1414] rounded-xl border border-red-900/40 bg-slate-950/90 flex flex-col items-center justify-center gap-3 text-red-400 shadow-2xl p-6 text-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-sm font-semibold">
                {fileError || "Lỗi tải tệp PDF"}
              </p>
            </div>
          }
          className="w-full flex flex-col items-center gap-8"
        >
          {numPages &&
            Array.from(new Array(numPages), (el, index) => {
              const pageNum = index + 1;
              const pageItems = canvasItems.filter(
                (item) => item.pageNumber === pageNum
              );

              return (
                <PageCanvasLayer
                  key={`page_${pageNum}`}
                  pageNum={pageNum}
                  pageItems={pageItems}
                  baseW={baseW}
                  isLiveMonitor={isLiveMonitor}
                  liveStudentData={liveStudentData}
                  activeStudentTool={activeStudentTool}
                  activeSubmissionId={activeSubmissionId}
                  role={role}
                  studentAnnotations={studentAnnotations}
                  teacherAnnotations={teacherAnnotations}
                  isDrawingEnabled={isDrawingEnabled}
                  mode={mode || (isDrawingEnabled ? "session" : "editor")}
                />
              );
            })}
        </Document>
      </div>
    </div>
  );
}
