"use client";

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import QueryProvider from './QueryProvider';
import { Toaster } from 'sonner';
import { PresenceProvider } from './PresenceTracker';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <QueryProvider>
          <PresenceProvider>
            {children}
            <Toaster position="bottom-right" richColors />
          </PresenceProvider>
        </QueryProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
