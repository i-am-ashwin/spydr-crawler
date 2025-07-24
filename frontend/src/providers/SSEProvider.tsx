"use client";

import { useEffect } from 'react';
import { useCrawlStore } from '@/lib/crawlStore';
import { useAuth } from './AuthProvider';

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const connectSSE = useCrawlStore(state => state.connectSSE);
  const disconnectSSE = useCrawlStore(state => state.disconnectSSE);
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      connectSSE();
    } else {
      disconnectSSE();
    }
    
    return () => {
      disconnectSSE();
    };
  }, [isAuthenticated, isLoading, connectSSE, disconnectSSE]);

  return <>{children}</>;
}