import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Wiki",
  description: "LLM Wiki 知识管理系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="flex h-screen">
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
