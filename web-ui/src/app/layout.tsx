import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Sidebar from '@/components/sidebar';
import StatusBar from '@/components/status-bar';

export const metadata: Metadata = {
  title: 'LLM Wiki',
  description: 'LLM Wiki 工具链 - 知识管理与 Agent 工作台',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
            <StatusBar />
          </div>
        </div>
      </body>
    </html>
  );
}
