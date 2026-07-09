"use client";

import React, { useState, useRef } from "react";
import CanvasToolbar from "@/components/canvas/CanvasToolbar";
import InteractiveCanvasItem from "@/components/canvas/InteractiveCanvasItem";

interface PageCanvasLayerProps {
  pageNum: number;
  pageItems: CanvasItem[];
  baseW: number;
}

function PageCanvasLayer({ pageNum, pageItems, baseW }: PageCanvasLayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(850);
  const setActivePdfPage = useAssignmentEditorStore(
    (state) => state.setActivePdfPage
  );

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
          className="w-full h-full flex items-center justify-center [&>canvas]:!w-full [&>canvas]:!h-full"
        />
      </div>

      {/* REACT-RND INTERACTIVE OVERLAYS */}
      <div className="absolute inset-0 pointer-events-none">
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
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { useAssignmentEditorStore } from "@/store/useAssignmentEditorStore";
import { CanvasItem } from "@/types/assignment";
import {
  FileText,
  Target,
  Loader2,
  AlertCircle,
  UploadCloud,
  Trash2,
  CheckSquare,
  TextCursorInput,
  RefreshCw,
} from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

export default function PdfCanvasWrapper() {
  const {
    draft,
    pdfPreviewUrl,
    setLocalPdf,
    addCanvasItem,
    deleteItem,
    activePdfPage,
  } = useAssignmentEditorStore();

  const [numPages, setNumPages] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!draft) return null;

  // Handle local file selection -> RAM Object URL preview (Zero Firebase Calls)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setFileError("Vui lòng chọn tệp PDF (.pdf).");
      return;
    }

    setFileError(null);
    setLocalPdf(file);
  };

  const activePdfSource = pdfPreviewUrl || draft.pdfUrl;

  // Filter all items where placement === 'canvas'
  const canvasItems: CanvasItem[] = [];
  draft.sections.forEach((section) => {
    section.items.forEach((item) => {
      if (item.placement === "canvas") {
        canvasItems.push(item as CanvasItem);
      }
    });
  });

  const { width: baseW, height: baseH } = draft.baseResolution;

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setFileError(null);
  };

  const onDocumentLoadError = (err: Error) => {
    console.error("Error loading PDF document:", err);
    setFileError("Không thể hiển thị PDF. Vui lòng kiểm tra định dạng tệp.");
  };

  // 1. EMPTY STATE: No PDF loaded (in preview or draft) -> Show clean upload area
  if (!activePdfSource) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-200">
        <div className="max-w-md w-full border-2 border-dashed border-slate-700 hover:border-purple-500/80 rounded-2xl p-8 flex flex-col items-center text-center bg-slate-900/40 transition-all">
          <div className="h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
            <UploadCloud className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            Chọn tệp PDF đề kiểm tra
          </h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Tệp PDF sẽ được xem trước trực tiếp trên bộ nhớ máy tính của bạn
            (Không gọi server/Firebase). Chỉ tải lên khi bạn nhấn nút "Lưu Bài
            Tập".
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

  // 2. CANVAS TOOLBAR RIBBON & PDF VIEWER
  return (
    <div className="w-full h-full overflow-y-auto bg-slate-900/60 p-6 md:p-8 flex flex-col items-center gap-6">
      {/* FLOATING CANVAS TOOLBAR */}
      <CanvasToolbar currentPageNumber={activePdfPage || 1} />

      {/* Top Banner */}
      <div className="w-full max-w-[850px] flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/80 px-4 py-2.5 text-xs text-slate-300 shadow">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-purple-400" />
          <span className="font-semibold text-white">{draft.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-purple-300">
            Hệ tọa độ ảo: {baseW} x {baseH}
          </span>
          {numPages && (
            <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 font-mono">
              {numPages} Trang
            </span>
          )}
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
                />
              );
            })}
        </Document>
      </div>
    </div>
  );
}
