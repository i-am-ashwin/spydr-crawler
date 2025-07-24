"use client";

import { AuthProvider } from './AuthProvider';
import { SSEProvider } from './SSEProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
    <SSEProvider>
      {children}
    </SSEProvider>
    </AuthProvider>
  );
}