"use client";

import React, { useState, useRef } from "react";
import CanvasToolbar from "@/components/canvas/CanvasToolbar";
import InteractiveCanvasItem from "@/components/canvas/InteractiveCanvasItem";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
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
}

function PageCanvasLayer({
  pageNum,
  pageItems,
  baseW,
  isLiveMonitor = false,
  liveStudentData = null,
  activeStudentTool = "pointer",
  activeSubmissionId = null,
}: PageCanvasLayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(850);
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
          setContainerWidth(entry.contentRect.width);
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
    : paths;

  return (
    <div
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

      {/* PHASE 3: FUNCTIONAL DRAWING SVG OVERLAY */}
      <svg
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`absolute inset-0 w-full h-full z-20 ${
          !isLiveMonitor &&
          (activeStudentTool === "pen" || activeStudentTool === "highlighter")
            ? "pointer-events-auto touch-none cursor-crosshair"
            : "pointer-events-none"
        }`}
      >
        {displayedPaths.map((p) => (
          <path
            key={p.id}
            d={pointsToSvgPath(p.points)}
            stroke={p.color || "#ef4444"}
            strokeWidth={p.strokeWidth || 2.5}
            opacity={p.color === "#facc15" ? 0.45 : 1}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {currentPath && (
          <path
            d={pointsToSvgPath(currentPath.points)}
            stroke={currentPath.color}
            strokeWidth={currentPath.strokeWidth}
            opacity={currentPath.color === "#facc15" ? 0.45 : 1}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>

      {/* REACT-RND INTERACTIVE OVERLAYS */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        <div className="w-full h-full relative pointer-events-auto">
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
}

export default function PdfCanvasWrapper({
  fileUrl,
  readOnly = false,
  isPreviewMode: propIsPreviewMode,
  isLiveMonitor = false,
  initialData = null,
  liveStudentData = null,
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
  } = useAssignmentEditorStore();

  const draft = initialData || storeDraft;

  const isPreviewMode =
    propIsPreviewMode !== undefined ? propIsPreviewMode : storeIsPreviewMode;

  const [numPages, setNumPages] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (isLiveMonitor) return "cursor-default";
    if (activeStudentTool === "pen" || activeStudentTool === "highlighter")
      return "cursor-crosshair";
    if (activeStudentTool === "text") return "cursor-text";
    if (activeStudentTool === "eraser") return "cursor-pointer";
    return "cursor-default";
  };

  return (
    <div
      className={`w-full h-full overflow-y-auto bg-slate-900/60 p-6 md:p-8 flex flex-col items-center gap-6 relative ${getCursorClass()}`}
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
      {!isLiveMonitor && (
        <CanvasToolbar currentPageNumber={activePdfPage || 1} />
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

      {/* PDF Document Container */}
      <div className="w-full max-w-[850px] flex flex-col items-center gap-8">
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
                />
              );
            })}
        </Document>
      </div>
    </div>
  );
}
