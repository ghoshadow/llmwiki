'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, XCircle, Circle } from 'lucide-react';

export type ExecutionStatus = 'idle' | 'running' | 'done' | 'error';

interface ExecutionLogProps {
  lines: string[];
  status: ExecutionStatus;
  className?: string;
}

export default function ExecutionLog({ lines, status, className }: ExecutionLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  const statusIcon = {
    idle: <Circle className="size-4 text-muted-foreground" />,
    running: <Loader2 className="size-4 animate-spin text-blue-400" />,
    done: <CheckCircle2 className="size-4 text-green-400" />,
    error: <XCircle className="size-4 text-destructive" />,
  }[status];

  const statusLabel = {
    idle: '等待执行',
    running: '执行中...',
    done: '执行完成',
    error: '执行出错',
  }[status];

  return (
    <div className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}>
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          {statusIcon}
          <span>{statusLabel}</span>
        </div>
        {lines.length > 0 && (
          <span className="text-xs text-muted-foreground">{lines.length} 行</span>
        )}
      </div>
      <div
        ref={containerRef}
        className="h-64 overflow-y-auto p-4"
      >
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无输出</p>
        ) : (
          <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">
            {lines.map((line, i) => (
              <div key={i} className="leading-relaxed">
                {line}
              </div>
            ))}
          </pre>
        )}
      </div>
    </div>
  );
}
