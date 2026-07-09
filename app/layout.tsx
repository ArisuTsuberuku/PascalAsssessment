import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pascal EdTech Platform",
  description: "Interactive 80/20 PDF Classroom Quizzes and Assignments",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {children}
      </body>
    </html>
  );
}
