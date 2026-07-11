"use client";

import React from "react";
import dynamic from "next/dynamic";
import BaseModal from "@/components/ui/BaseModal";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-slate-100 dark:bg-slate-800 rounded-lg">
      <span className="text-sm font-medium text-slate-500">
        Đang tải trình soạn thảo...
      </span>
    </div>
  ),
});

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    [{ color: [] }, { background: [] }],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "blockquote",
  "code-block",
  "color",
  "background",
];

export interface RichTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (content: string) => void;
  questionName?: string;
}

export default function RichTextModal({
  isOpen,
  onClose,
  value,
  onChange,
  questionName = "Bài làm tự luận",
}: RichTextModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={questionName}
      icon="📝"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all"
        >
          Hoàn tất & Lưu
        </button>
      }
    >
      <ReactQuill
        theme="snow"
        modules={modules}
        formats={formats}
        value={value || ""}
        onChange={onChange}
        className="min-h-[280px] pb-10"
      />
    </BaseModal>
  );
}
