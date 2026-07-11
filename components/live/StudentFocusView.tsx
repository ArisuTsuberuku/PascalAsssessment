"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Eye,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  MinusCircle,
  HelpCircle,
  SkipForward,
} from "lucide-react";
import dynamic from "next/dynamic";
import type { Assignment, Item } from "@/types/assignment";
import type { GradedAnswer } from "@/lib/calculateScore";
import { doc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import StudentAnswerDisplay from "./StudentAnswerDisplay";
import { useAssignmentEditorStore } from "@/store/useAssignmentEditorStore";
import { evaluateAnswer } from "@/lib/evaluateAnswer";
import { STATUS_CONFIG } from "@/components/ui/StatusBadge";

const PdfCanvasWrapper = dynamic(
  () => import("@/components/canvas/PdfCanvasWrapper"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-12 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    ),
  }
);

export interface StudentFocusData {
  id: string;
  studentName?: string;
  name?: string;
  fullName?: string;
  status?: string;
  answers?: Record<string, any>;
  gradedAnswers?: Record<string, GradedAnswer>;
  cheatLogs?: {
    blurCount: number;
    tabSwitchCount: number;
    copyAttempts?: number;
    pasteAttempts?: number;
    rightClickAttempts?: number;
  };
  warnings?: number;
  score?: string;
  percentage?: number;
  progress?: string;
}

interface StudentFocusViewProps {
  student: StudentFocusData;
  assignment: Assignment | null;
  assignmentItems: Item[];
  onClose: () => void;
}

function getStatusIcon(status?: string) {
  switch (status) {
    case "correct":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
    case "incorrect":
      return <XCircle className="h-3.5 w-3.5 text-rose-400" />;
    case "partial":
      return <MinusCircle className="h-3.5 w-3.5 text-amber-400" />;
    case "ungraded":
      return <HelpCircle className="h-3.5 w-3.5 text-purple-400" />;
    case "skipped":
      return <SkipForward className="h-3.5 w-3.5 text-slate-500" />;
    default:
      return <SkipForward className="h-3.5 w-3.5 text-slate-500" />;
  }
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "correct":
      return "Đúng";
    case "incorrect":
      return "Sai";
    case "partial":
      return "Đúng 1 phần";
    case "ungraded":
      return "Chờ chấm";
    case "skipped":
      return "Bỏ qua";
    default:
      return "—";
  }
}

function getStatusColorClass(status?: string) {
  switch (status) {
    case "correct":
      return "text-emerald-400";
    case "incorrect":
      return "text-rose-400";
    case "partial":
      return "text-amber-400";
    case "ungraded":
      return "text-purple-400";
    default:
      return "text-slate-500";
  }
}

function QuestionGradeCard({
  item,
  idx,
  student,
  onFocusItem,
}: {
  item: Item;
  idx: number;
  student: StudentFocusData;
  onFocusItem: (payload: { pageNumber?: number; targetId: string; boundingBox?: any }) => void;
}) {
  const graded = student.gradedAnswers?.[item.id];
  const rawAnswer = student.answers?.[item.id];
  const gradingResult = useMemo(
    () => evaluateAnswer(item, rawAnswer),
    [item, rawAnswer]
  );

  const maxPoints =
    item.points ||
    (item as any).maxScore ||
    gradingResult.maxScore ||
    10;

  const currentUI =
    STATUS_CONFIG[gradingResult.status] || STATUS_CONFIG.skipped;

  const [isEditingScore, setIsEditingScore] = useState(false);
  const [manualScoreVal, setManualScoreVal] = useState<number | string>("");
  const [feedbackVal, setFeedbackVal] = useState<string>(
    graded?.feedback || ""
  );
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setFeedbackVal(graded?.feedback || "");
  }, [graded?.feedback]);

  const displayedScore = isEditingScore ? manualScoreVal : gradingResult.score;

  const handleSave = async (
    scoreInput: number | string,
    feedbackInput: string
  ) => {
    if (!student.id) return;
    const numScore =
      typeof scoreInput === "number"
        ? scoreInput
        : parseFloat(String(scoreInput));

    if (isNaN(numScore)) return;

    setSaving(true);
    const status =
      numScore > 0
        ? numScore >= maxPoints
          ? "correct"
          : "partial"
        : "incorrect";

    const payloadKey = `gradedAnswers.${item.id}`;
    try {
      await updateDoc(doc(db, "student_submissions", student.id), {
        [payloadKey]: {
          itemId: item.id,
          itemName: item.name || `Câu ${idx + 1}`,
          itemType: item.type || "unknown",
          earnedPoints: numScore,
          maxPoints: maxPoints,
          score: numScore,
          feedback: feedbackInput,
          status,
        },
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Lỗi cập nhật điểm Firestore:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`p-3 rounded-xl border transition-all shadow-sm ${currentUI.border} ${currentUI.bg}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-[11px] font-mono font-bold text-slate-400">
            #{idx + 1}
          </span>
          <span className="text-sm">{currentUI.icon}</span>
          <span className="text-xs font-semibold text-slate-200 truncate">
            {item.name || `Câu ${idx + 1}`}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 shrink-0">
          Tối đa: {maxPoints}đ
        </span>
      </div>

      <StudentAnswerDisplay
        item={item}
        rawAnswer={rawAnswer}
        onFocusItem={onFocusItem}
      />

      <div className="flex flex-col gap-2 mt-1">
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] text-slate-300 shrink-0 font-semibold">
            Chấm điểm:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={maxPoints}
              step={0.25}
              value={displayedScore}
              onFocus={() => {
                setIsEditingScore(true);
                setManualScoreVal(gradingResult.score);
              }}
              onChange={(e) => setManualScoreVal(e.target.value)}
              onBlur={() => {
                setIsEditingScore(false);
                handleSave(manualScoreVal, feedbackVal);
              }}
              style={{
                width: `${Math.max(String(displayedScore ?? "").length, 1) + 3}ch`,
              }}
              className="appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-w-[40px] rounded-lg bg-slate-950 border border-slate-700 px-1 py-1 text-xs font-bold text-white text-center focus:border-purple-500 focus:outline-none transition-colors"
              placeholder="0"
            />
            {saving && (
              <span className="text-[10px] text-purple-400 font-medium animate-pulse">
                Đang lưu...
              </span>
            )}
          </div>
        </div>

        <div>
          <textarea
            rows={2}
            value={feedbackVal}
            onChange={(e) => setFeedbackVal(e.target.value)}
            onBlur={() => handleSave(displayedScore, feedbackVal)}
            placeholder="Nhận xét của giáo viên..."
            className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none resize-none transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

export default function StudentFocusView({
  student,
  assignment,
  assignmentItems,
  onClose,
}: StudentFocusViewProps) {
  const [liveStudentData, setLiveStudentData] = useState<any>(student);
  const { setActivePdfPage } = useAssignmentEditorStore();

  const handleFocusItem = (payload: { pageNumber?: number; targetId: string; boundingBox?: any }) => {
    if (payload.pageNumber !== undefined && payload.pageNumber !== null) {
      setActivePdfPage(payload.pageNumber);
      setTimeout(() => {
        document.getElementById(`pdf-page-${payload.pageNumber}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 50);
    }
  };

  useEffect(() => {
    setLiveStudentData(student);
  }, [student]);

  useEffect(() => {
    if (!student?.id) return;
    const docRef = doc(db, "student_submissions", student.id);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = { id: snapshot.id, ...snapshot.data() } as any;
      setLiveStudentData(data);
    });
    return () => unsubscribe();
  }, [student?.id]);

  const effectiveStudent = liveStudentData || student;

  const displayName =
    effectiveStudent.studentName ||
    effectiveStudent.name ||
    effectiveStudent.fullName ||
    effectiveStudent.id;

  const tabSwitches =
    student.cheatLogs?.tabSwitchCount ?? student.warnings ?? 0;
  const blurCount = student.cheatLogs?.blurCount ?? 0;
  const copyAttempts = student.cheatLogs?.copyAttempts ?? 0;
  const pasteAttempts = student.cheatLogs?.pasteAttempts ?? 0;
  const rightClicks = student.cheatLogs?.rightClickAttempts ?? 0;
  const totalViolations =
    tabSwitches + blurCount + copyAttempts + pasteAttempts + rightClicks;

  const totalScore = useMemo(() => {
    let sum = 0;
    for (const item of assignmentItems) {
      const graded = student.gradedAnswers?.[item.id];
      if (
        graded &&
        (graded.score !== undefined || graded.earnedPoints !== undefined)
      ) {
        const val =
          typeof graded.score === "number"
            ? graded.score
            : typeof graded.earnedPoints === "number"
            ? graded.earnedPoints
            : parseFloat(String(graded.score ?? graded.earnedPoints ?? 0)) || 0;
        sum += val;
      } else {
        const rawAns = student.answers?.[item.id];
        sum += evaluateAnswer(item, rawAns).score;
      }
    }
    return Number(sum.toFixed(2));
  }, [student.gradedAnswers, student.answers, assignmentItems]);

  const isDone =
    student.status === "submitted" || student.status === "Đã nộp";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col overflow-hidden animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-3 shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
            <Eye className="h-3.5 w-3.5" />
            FOCUS VIEW
          </span>
          <h2 className="text-base font-bold text-white">
            Bài làm:{" "}
            <span className="text-purple-400">{displayName}</span>
          </h2>

          {/* Status Badge */}
          {isDone && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
              ✅ Đã nộp
            </span>
          )}

          {/* Reactive Total Score Header */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30 shadow-sm">
            <span>Tổng điểm:</span>
            <strong className="text-white text-sm font-extrabold">
              {totalScore}
            </strong>
            {student.score && (
              <span className="text-slate-400 font-normal ml-0.5">
                (Tự động: {student.score})
              </span>
            )}
          </span>

          {/* Anti-cheat Warning */}
          {totalViolations > 0 && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                tabSwitches > 3
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/30"
              }`}
            >
              {tabSwitches > 3 ? (
                <ShieldAlert className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {totalViolations} vi phạm
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-rose-600 hover:border-rose-500 hover:text-white transition-all shadow"
        >
          <X className="h-4 w-4" />
          <span>Đóng</span>
        </button>
      </div>

      {/* Main Content: PDF + Info Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Viewer (Main Area) */}
        <div className="flex-1 relative w-full h-full overflow-hidden bg-slate-800">
          {assignment ? (
            <PdfCanvasWrapper
              fileUrl={assignment.pdfUrl}
              initialData={assignment}
              liveStudentData={effectiveStudent}
              studentAnnotations={
                effectiveStudent.studentAnnotations ||
                effectiveStudent.annotations ||
                []
              }
              teacherAnnotations={effectiveStudent.teacherAnnotations || []}
              isPreviewMode={true}
              isLiveMonitor={true}
              role="teacher"
              isDrawingEnabled={true}
              mode="session"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 text-sm">
              Đang tải PDF...
            </div>
          )}
        </div>

        {/* Info Sidebar (Right Panel) */}
        <div className="w-80 shrink-0 border-l border-slate-800 bg-slate-900/95 overflow-y-auto">
          {/* Question Status List & Interactive Grading */}
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3">
              Chấm điểm & Trạng thái câu hỏi
            </h3>
            <div className="space-y-3">
              {assignmentItems.map((item, idx) => (
                <QuestionGradeCard
                  key={item.id}
                  item={item}
                  idx={idx}
                  student={student}
                  onFocusItem={handleFocusItem}
                />
              ))}
            </div>
          </div>

          {/* Anti-Cheat Violations Detail */}
          <div className="p-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              Anti-Cheat Log
            </h3>

            {totalViolations === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Không phát hiện vi phạm ✅
              </p>
            ) : (
              <div className="space-y-2">
                <ViolationRow
                  label="Chuyển tab"
                  count={tabSwitches}
                  severity={tabSwitches > 3 ? "high" : tabSwitches > 0 ? "low" : "none"}
                />
                <ViolationRow
                  label="Rời cửa sổ"
                  count={blurCount}
                  severity={blurCount > 3 ? "high" : blurCount > 0 ? "low" : "none"}
                />
                <ViolationRow
                  label="Copy (Ctrl+C)"
                  count={copyAttempts}
                  severity={copyAttempts > 0 ? "low" : "none"}
                />
                <ViolationRow
                  label="Paste (Ctrl+V)"
                  count={pasteAttempts}
                  severity={pasteAttempts > 0 ? "low" : "none"}
                />
                <ViolationRow
                  label="Chuột phải"
                  count={rightClicks}
                  severity={rightClicks > 0 ? "low" : "none"}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Single violation row in the sidebar */
function ViolationRow({
  label,
  count,
  severity,
}: {
  label: string;
  count: number;
  severity: "none" | "low" | "high";
}) {
  if (count === 0) return null;
  return (
    <div
      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs ${
        severity === "high"
          ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
          : "bg-amber-500/10 border-amber-500/30 text-amber-300"
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className="font-bold">{count}x</span>
    </div>
  );
}
