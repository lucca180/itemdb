import Color, { type ColorInstance } from 'color';
import { getPalette } from 'colorthief';
import type { Pallete, WP_Article } from '@types';

// A secondary color is only used as a distinct accent (see ArticlePageContent/ArticlesCard)
// when it's actually different enough from the dominant one; otherwise a plain lightened
// version of the dominant color is a safer accent than a near-duplicate cluster.
const MIN_HUE_DIFF = 20;
const MIN_LIGHTNESS_DIFF = 20;

function toPallete(color: ColorInstance, type: string, population = 0): Pallete {
  return {
    lab: color.lab().round().array(),
    hsv: color.hsv().round().array(),
    rgb: color.rgb().round().array(),
    hex: color.hex(),
    type,
    population,
  };
}

// colorthief's Node loader passes the source straight into `sharp()`, which
// can't fetch remote URLs itself, so the image has to be downloaded first.
export async function getArticlePalette(imageUrl: string | null): Promise<WP_Article['palette']> {
  if (!imageUrl) return null;

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    const palette = await getPalette(buffer);

    if (!palette || palette.length === 0) return null;

    // getPalette() sorts by population, so the first entry is the dominant color.
    const dominant = palette[0];
    const mainColor = Color.rgb(dominant.array() as number[]);

    const secondaryMatch = palette.slice(1).find((c) => {
      const candidate = Color.rgb(c.array() as number[]);
      return (
        Math.abs(candidate.hue() - mainColor.hue()) > MIN_HUE_DIFF ||
        Math.abs(candidate.lightness() - mainColor.lightness()) > MIN_LIGHTNESS_DIFF
      );
    });

    const secondaryColor = secondaryMatch
      ? Color.rgb(secondaryMatch.array() as number[])
      : mainColor.lightness(Math.min(Math.max(mainColor.lightness() + 25, 65), 90));

    return {
      main: toPallete(mainColor, 'main', dominant.population),
      secondary: toPallete(secondaryColor, 'secondary', secondaryMatch?.population ?? 0),
    };
  } catch (e) {
    console.error(e);
    return null;
  }
}
