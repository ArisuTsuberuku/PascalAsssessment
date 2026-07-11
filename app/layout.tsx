import type { Metadata } from "next";
import "./globals.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "katex/dist/katex.min.css";
import "react-quill/dist/quill.snow.css";

export const metadata: Metadata = {
  title: "Pascal EdTech Platform",
  description: "Nền tảng Đánh giá & Học tập PDF Tương tác",
  icons: {
    icon: "/pascal-logo.png",
    apple: "/pascal-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
        {children}
      </body>
    </html>
  );
}
