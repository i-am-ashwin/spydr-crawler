"use client";

import { useEffect } from 'react';
import { useCrawlStore } from '@/lib/crawlStore';

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const connectSSE = useCrawlStore(state => state.connectSSE);
  const disconnectSSE = useCrawlStore(state => state.disconnectSSE);

  useEffect(() => {
    connectSSE();
    
    return () => {
      disconnectSSE();
    };
  }, [connectSSE, disconnectSSE]);

  return <>{children}</>;
}