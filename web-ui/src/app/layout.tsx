import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'LLM Wiki',
  description: 'LLM Wiki 工具链 - 知识管理与 Agent 工作台',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen">
          {/* sidebar 占位,LLMWI-11 会实现完整组件 */}
          <aside className="w-64 border-r bg-muted/30 p-4">
            <h1 className="text-lg font-semibold">LLM Wiki</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              脚手架阶段 (Phase 1)
            </p>
          </aside>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
