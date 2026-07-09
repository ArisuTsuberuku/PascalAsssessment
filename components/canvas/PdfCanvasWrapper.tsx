import React from "react";
import { Assignment, CanvasItem } from "@/types/assignment";
import { FileText, Target, Award } from "lucide-react";

interface PdfCanvasWrapperProps {
  assignment: Assignment;
}

export default function PdfCanvasWrapper({
  assignment,
}: PdfCanvasWrapperProps) {
  // Filter all items where placement === 'canvas'
  const canvasItems: CanvasItem[] = [];
  assignment.sections.forEach((section) => {
    section.items.forEach((item) => {
      if (item.placement === "canvas") {
        canvasItems.push(item as CanvasItem);
      }
    });
  });

  const { width: baseW, height: baseH } = assignment.baseResolution;

  // We simulate 2 pages (Page 1 and Page 2)
  const pages = [1, 2];

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-900/60 p-6 md:p-8 flex flex-col items-center gap-8">
      {/* Top Banner indicating Virtual Resolution */}
      <div className="w-full max-w-[850px] flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-purple-400" />
          <span className="font-semibold text-white">{assignment.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-purple-300">
            Base Resolution: {baseW} x {baseH}
          </span>
          <span className="rounded bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-purple-300 font-semibold">
            {canvasItems.length} Canvas Zones
          </span>
        </div>
      </div>

      {/* Render Dummy PDF Pages */}
      {pages.map((pageNum) => {
        const pageItems = canvasItems.filter(
          (item) => item.pageNumber === pageNum
        );

        return (
          <div
            key={pageNum}
            className="w-full max-w-[850px] aspect-[1000/1414] relative rounded-lg border border-slate-700 bg-slate-950/80 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Simulated Page Watermark / Header */}
            <div className="absolute top-4 left-6 right-6 flex items-center justify-between pointer-events-none text-[11px] text-slate-600 font-mono uppercase tracking-widest border-b border-slate-800/60 pb-2">
              <span>{assignment.title}</span>
              <span>Trang {pageNum} / 2</span>
            </div>

            {/* Dummy Page Content grid background lines */}
            <div
              className="absolute inset-0 pointer-events-none opacity-5"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            {/* Simulated Page Body Text placeholder */}
            <div className="p-12 pt-16 pointer-events-none text-slate-500 text-xs space-y-4">
              <div className="h-4 w-1/3 rounded bg-slate-800/80" />
              <div className="h-3 w-3/4 rounded bg-slate-800/50" />
              <div className="h-3 w-5/6 rounded bg-slate-800/50" />
            </div>

            {/* RENDER ABSOLUTE POSITIONED CANVAS ITEMS USING VIRTUAL PERCENTAGES */}
            {pageItems.map((item) => {
              const leftPct = (item.boundingBox.x / baseW) * 100;
              const topPct = (item.boundingBox.y / baseH) * 100;
              const widthPct = (item.boundingBox.width / baseW) * 100;
              const heightPct = (item.boundingBox.height / baseH) * 100;

              return (
                <div
                  key={item.id}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                  }}
                  className="absolute border-2 border-dashed border-purple-500/80 bg-purple-500/15 rounded-xl p-3 flex flex-col justify-between shadow-lg backdrop-blur-sm transition-all hover:border-purple-400 hover:bg-purple-500/25 group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded bg-purple-600 px-2 py-0.5 text-[11px] font-bold text-white shadow">
                      <Target className="h-3 w-3" />
                      {item.name}
                    </span>
                    <span className="rounded bg-slate-900/90 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-purple-300">
                      {item.points}đ
                    </span>
                  </div>

                  {item.prompt && (
                    <p className="text-[11px] text-slate-200 line-clamp-2 my-1">
                      {item.prompt}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-purple-500/30 pt-1">
                    <span>Type: {item.type}</span>
                    <span>
                      Box: [{item.boundingBox.x},{item.boundingBox.y}]
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
