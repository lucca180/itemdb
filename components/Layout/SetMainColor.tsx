'use client';

import { useLayoutEffect } from 'react';
import {
  LAYOUT_MAIN_COLOR_CSS_VAR,
  LAYOUT_MAIN_COLOR_DEFAULT,
} from '@components/Layout/LayoutFrame';

type SetMainColorProps = {
  color: string;
};

function resolveSafeColor(color: string): string {
  const trimmed = color.trim();
  // Hex (#rgb / #rrggbb / #rrggbbaa) or rgb()/rgba() only — blocks CSS injection.
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
  if (/^rgba?\([\d\s.,%]+\)$/.test(trimmed)) return trimmed;
  return LAYOUT_MAIN_COLOR_DEFAULT;
}

/**
 * Sets --layout-main-color on :root via inline style property.
 *
 * Avoids React-managed <style> nodes (href/precedence leaves them in <head>;
 * manually removing them causes insertBefore errors). Cleanup only clears the
 * CSS custom property so global.css default applies again.
 */
export function SetMainColor({ color }: SetMainColorProps) {
  const safeColor = resolveSafeColor(color);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(LAYOUT_MAIN_COLOR_CSS_VAR, safeColor);
    return () => {
      root.style.removeProperty(LAYOUT_MAIN_COLOR_CSS_VAR);
    };
  }, [safeColor]);

  // SSR / pre-hydration: paint the tint without a React-owned head stylesheet.
  return <style>{`:root{${LAYOUT_MAIN_COLOR_CSS_VAR}:${safeColor}}`}</style>;
}
