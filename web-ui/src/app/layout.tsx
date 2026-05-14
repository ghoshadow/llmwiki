import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import StatusBar from "@/components/status-bar";

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
        <div className="flex h-screen flex-col">
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
          <StatusBar />
        </div>
      </body>
    </html>
  );
}
