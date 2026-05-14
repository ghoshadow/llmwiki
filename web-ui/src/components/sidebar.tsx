'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Download,
  Search,
  ShieldCheck,
  ListTree,
  ScrollText,
  FolderOpen,
  FileText,
} from 'lucide-react';

const navItems = [
  { href: '/', label: '仪表盘', icon: LayoutDashboard },
  { href: '/ingest', label: '入库', icon: Download },
  { href: '/query', label: '查询', icon: Search },
  { href: '/lint', label: '检查', icon: ShieldCheck },
  { href: '/index-view', label: '索引', icon: ListTree },
  { href: '/log-view', label: '日志', icon: ScrollText },
  { href: '/sources', label: '数据源', icon: FolderOpen },
  { href: '/pages-view', label: '页面', icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-muted/30">
      {/* Header */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-bold text-primary-foreground">W</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-tight">LLM Wiki</h1>
          <p className="text-[10px] text-muted-foreground">知识管理工具链</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-3">
        <p className="text-[11px] leading-tight text-muted-foreground">
          LLM Wiki v0.1.0
        </p>
      </div>
    </aside>
  );
}
