'use client';

import { useLayoutEffect } from 'react';
import Color from 'color';
import {
  LAYOUT_INK_CSS_VAR,
  LAYOUT_INK_HOVER_CSS_VAR,
  LAYOUT_MAIN_COLOR_CSS_VAR,
  LAYOUT_MAIN_COLOR_DEFAULT,
} from '@components/Layout/LayoutFrame';

type SetMainColorProps = {
  color: string;
};

/** Page background under the nav: the nav tint has alpha, so its real color depends on it. */
const NAV_BASE = '#1A202C';
// whiteAlpha.900 / .200 and blackAlpha.900 / .200
const LIGHT_INK = { ink: 'rgba(255, 255, 255, 0.92)', hover: 'rgba(255, 255, 255, 0.08)' };
const DARK_INK = { ink: 'rgba(0, 0, 0, 0.92)', hover: 'rgba(0, 0, 0, 0.08)' };

function resolveSafeColor(color: string): string {
  const trimmed = color.trim();
  // Hex (#rgb / #rrggbb / #rrggbbaa) or rgb()/rgba() only — blocks CSS injection.
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
  if (/^rgba?\([\d\s.,%]+\)$/.test(trimmed)) return trimmed;
  return LAYOUT_MAIN_COLOR_DEFAULT;
}

/**
 * Nav text color for a nav tint: dark only when white text fails WCAG AA (4.5:1) on the tint
 * and dark text reads better (e.g. yellow or light blue tints). Unparsable colors keep white.
 */
function resolveInk(color: string) {
  try {
    const tint = Color(color);
    const shown = Color(NAV_BASE).mix(tint.alpha(1), tint.alpha());
    // contrast() ignores alpha: compare against the text as it shows on the tint
    const white = shown.contrast(shown.mix(Color('#ffffff'), 0.92));
    const dark = shown.contrast(shown.mix(Color('#000000'), 0.92));
    return white < 4.5 && dark > white ? DARK_INK : LIGHT_INK;
  } catch {
    return LIGHT_INK;
  }
}

/**
 * Sets --layout-main-color on :root via inline style property, plus the nav text color that
 * reads on it (--layout-main-ink / --layout-main-ink-hover: dark text on light tints).
 *
 * Avoids React-managed <style> nodes (href/precedence leaves them in <head>;
 * manually removing them causes insertBefore errors). Cleanup only clears the
 * CSS custom properties so global.css defaults apply again.
 */
export function SetMainColor({ color }: SetMainColorProps) {
  const safeColor = resolveSafeColor(color);
  const { ink, hover } = resolveInk(safeColor);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(LAYOUT_MAIN_COLOR_CSS_VAR, safeColor);
    root.style.setProperty(LAYOUT_INK_CSS_VAR, ink);
    root.style.setProperty(LAYOUT_INK_HOVER_CSS_VAR, hover);
    return () => {
      root.style.removeProperty(LAYOUT_MAIN_COLOR_CSS_VAR);
      root.style.removeProperty(LAYOUT_INK_CSS_VAR);
      root.style.removeProperty(LAYOUT_INK_HOVER_CSS_VAR);
    };
  }, [safeColor, ink, hover]);

  // SSR / pre-hydration: paint the tint without a React-owned head stylesheet.
  return (
    <style>{`:root{${LAYOUT_MAIN_COLOR_CSS_VAR}:${safeColor};${LAYOUT_INK_CSS_VAR}:${ink};${LAYOUT_INK_HOVER_CSS_VAR}:${hover}}`}</style>
  );
}
