'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { healthApi } from '@/lib/api-client';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

type ConnectionStatus = 'connected' | 'disconnected' | 'checking';

export default function StatusBar() {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      setStatus('checking');
      const result = await healthApi.ping();
      if (cancelled) return;
      setStatus(result.ok ? 'connected' : 'disconnected');
      setLatency(result.ok ? result.latency : null);
    }

    check();
    const timer = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex h-8 items-center justify-between border-t bg-muted/50 px-4 text-xs">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex items-center gap-1',
            status === 'connected' && 'text-green-600',
            status === 'disconnected' && 'text-destructive',
            status === 'checking' && 'text-muted-foreground',
          )}
        >
          {status === 'connected' && <Wifi className="size-3" />}
          {status === 'disconnected' && <WifiOff className="size-3" />}
          {status === 'checking' && (
            <Loader2 className="size-3 animate-spin" />
          )}
          <span>
            {status === 'connected' && 'MCP 已连接'}
            {status === 'disconnected' && 'MCP 未连接'}
            {status === 'checking' && '检测中...'}
          </span>
        </span>
        {latency !== null && (
          <span className="text-muted-foreground">{latency}ms</span>
        )}
      </div>
      <div className="text-muted-foreground">localhost:3001</div>
    </div>
  );
}
