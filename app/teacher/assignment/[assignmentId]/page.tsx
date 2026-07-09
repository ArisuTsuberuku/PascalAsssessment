"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Assignment } from "@/types/assignment";
import {
  getAssignment,
  initMockAssignmentToDB,
} from "@/services/assignmentService";
import SplitLayout from "@/components/layout/SplitLayout";
import PdfCanvasWrapper from "@/components/canvas/PdfCanvasWrapper";
import QuestionSidebar from "@/components/sidebar/QuestionSidebar";
import {
  ArrowLeft,
  Eye,
  Save,
  Sparkles,
  Loader2,
  Database,
  RefreshCw,
} from "lucide-react";

interface PageProps {
  params: {
    assignmentId: string;
  };
}

export default function AssignmentEditorPage({ params }: PageProps) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignmentData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAssignment(params.assignmentId);
      setAssignment(data);
    } catch (err) {
      console.error(err);
      setError("Không thể tải dữ liệu bài tập từ Firebase Firestore.");
    } finally {
      setIsLoading(false);
    }
  }, [params.assignmentId]);

  useEffect(() => {
    fetchAssignmentData();
  }, [fetchAssignmentData]);

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setError(null);
    try {
      // Seed test-123 as requested and also seed current ID if different
      await initMockAssignmentToDB("test-123");
      if (params.assignmentId !== "test-123") {
        await initMockAssignmentToDB(params.assignmentId);
      }
      await fetchAssignmentData();
    } catch (err) {
      console.error(err);
      setError("Khởi tạo dữ liệu mẫu lên Firestore thất bại. Vui lòng kiểm tra quyền Firestore Rules.");
    } finally {
      setIsSeeding(false);
    }
  };

  // 1. Loading State Spinner
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm text-slate-400">
          Đang kết nối & tải dữ liệu bài tập từ Firebase Firestore...
        </p>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white p-6">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center space-y-4">
          <h2 className="text-lg font-bold text-rose-400">Lỗi kết nối Firebase</h2>
          <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
          <button
            onClick={fetchAssignmentData}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Document Not Found -> Seed Button State
  if (!assignment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center space-y-5 shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
            <Database className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Chưa tìm thấy dữ liệu Bài tập
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Tài liệu ID <code className="text-indigo-300">{params.assignmentId}</code> chưa tồn tại trong Collection{" "}
              <code className="text-indigo-300">assignments</code> trên Firestore.
            </p>
          </div>

          <button
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all"
          >
            {isSeeding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang ghi dữ liệu mẫu vào Firestore...</span>
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                <span>Khởi tạo Dữ liệu mẫu (Seed to Firestore)</span>
              </>
            )}
          </button>

          <Link
            href="/teacher/dashboard"
            className="inline-block text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Quay lại Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // 4. Render Editor Layout with Fetched Assignment Data
  const header = (
    <div className="h-14 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
        <span className="text-slate-700">|</span>
        <span className="text-sm font-semibold text-white">
          Assignment ID: <code className="text-indigo-400">{assignment.assignmentId}</code>
        </span>
        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 inline-flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Live Firestore Data
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={fetchAssignmentData}
          title="Làm mới từ Firestore"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Sync</span>
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-md">
          <Save className="h-3.5 w-3.5" />
          <span>Lưu cấu hình</span>
        </button>
      </div>
    </div>
  );

  return (
    <SplitLayout
      headerContent={header}
      leftContent={<PdfCanvasWrapper assignment={assignment} />}
      rightContent={<QuestionSidebar assignment={assignment} />}
    />
  );
}
