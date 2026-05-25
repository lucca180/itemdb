'use client';

import { Fragment, type ReactNode } from 'react';

type ColorModeProviderProps = {
  children: ReactNode;
};

export function ColorModeProvider({ children }: ColorModeProviderProps) {
  return <Fragment>{children}</Fragment>;
}
