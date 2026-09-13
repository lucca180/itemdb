import Color, { type ColorInstance } from 'color';

// Colors extracted from a thumbnail can come out too dark to read as text/backgrounds, or
// too desaturated to read as "color" once flattened to a fixed lightness (gray/muddy
// tones). Clamp lightness into a legible range and enforce a saturation floor so every
// place deriving a UI color from an article's palette looks consistent and stays readable.
const MIN_LIGHTNESS = 55;
const MAX_LIGHTNESS = 80;
const MIN_SATURATION = 40;

// Target lightness per use case. `background` is shared by the article page header wash
// and the article cards (ArticlesCard, LatestArticleCard) so their tint visually matches it.
const TARGET_LIGHTNESS = {
  background: 55,
  link: 65,
  bold: 60,
} as const;

export type ColorTarget = keyof typeof TARGET_LIGHTNESS;

export const ARTICLE_FALLBACK_COLOR = '#05B7E8';

export function getNormalizedColor(
  source: string | ColorInstance,
  target: ColorTarget
): ColorInstance {
  const color = typeof source === 'string' ? Color(source) : source;
  const withSaturationFloor =
    color.saturationl() < MIN_SATURATION ? color.saturationl(MIN_SATURATION) : color;
  const clampedLightness = Math.min(
    Math.max(TARGET_LIGHTNESS[target], MIN_LIGHTNESS),
    MAX_LIGHTNESS
  );

  return withSaturationFloor.lightness(clampedLightness);
}
