import Link from "next/link";
import { ArrowLeft, Users, Activity, CheckCircle2, Clock } from "lucide-react";

interface PageProps {
  params: {
    classCode: string;
  };
}

export default function LiveSessionPage({ params }: PageProps) {
  const mockStudents = [
    { id: "s1", name: "Nguyễn Văn An", progress: "8/10", score: "80%", status: "Done" },
    { id: "s2", name: "Trần Thị Mai", progress: "6/10", score: "Đang làm", status: "Active" },
    { id: "s3", name: "Lê Hoàng Đạt", progress: "10/10", score: "100%", status: "Done" },
    { id: "s4", name: "Phạm Hữu Long", progress: "4/10", score: "Đang làm", status: "Active" },
    { id: "s5", name: "Đỗ Khánh Linh", progress: "9/10", score: "90%", status: "Done" },
    { id: "s6", name: "Vũ Trọng Phụng", progress: "3/10", score: "Đang làm", status: "Active" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
        <div>
          <Link
            href="/teacher/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span>Giám sát Lớp học Trực tiếp</span>
            <span className="font-mono rounded-lg bg-indigo-500/20 px-3 py-1 text-base text-indigo-300">
              {params.classCode}
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Theo dõi tiến độ làm bài và trạng thái nộp bài của từng học sinh theo thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2">
            <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">Live Updating via Firebase</span>
          </div>
        </div>
      </div>

      {/* Grid Layout Placeholder to monitor multiple students */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockStudents.map((student) => (
          <div
            key={student.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-white text-base">{student.name}</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    student.status === "Done"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  }`}
                >
                  {student.status === "Done" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                  <span>{student.status === "Done" ? "Đã nộp" : "Đang làm bài"}</span>
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Tiến độ câu hỏi:</span>
                  <span className="font-semibold text-white">{student.progress}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kết quả tạm tính:</span>
                  <span className="font-semibold text-indigo-300">{student.score}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                Xem chi tiết bài làm →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
