"use client";

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import QueryProvider from './QueryProvider';
import { Toaster } from 'sonner';
import { PresenceProvider } from './PresenceTracker';
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import CommandPalette from '../shared/CommandPalette';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <QueryProvider>
          <PresenceProvider>
            {children}
            <CommandPalette />
            <Toaster position="bottom-right" richColors />
            <ProgressBar
              height="2px"
              color="#6366f1"
              options={{ showSpinner: false }}
              shallowRouting
            />
          </PresenceProvider>
        </QueryProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
