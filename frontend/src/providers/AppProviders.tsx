"use client";

import { SSEProvider } from './SSEProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SSEProvider>
      {children}
    </SSEProvider>
  );
}