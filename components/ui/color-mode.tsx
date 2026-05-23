'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

type ColorModeProviderProps = {
  children: ReactNode;
};

/**
 * Chakra v3 resolves semantic tokens via the `.dark` condition (see preset-base).
 * `data-theme` alone does not activate `_dark` tokens — use `attribute="class"`.
 */
export function ColorModeProvider({ children }: ColorModeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
