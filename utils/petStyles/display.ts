/** Shared Pet Styles UI types (safe for client components). */

import type { LebronTrade, NCValue } from '@types';

export type StyleToken = {
  id: number;
  name: string;
  series: string;
  speciesName: string;
  /**
   * PetColor name, or `Unknown Colour` for colour-agnostic series (Essence, …).
   * Always set for displayable tokens.
   */
  colorName: string;
  isPrismatic: boolean;
  prismaticVariant: string | null;
  inStudio: boolean;
  seekingCount: number;
  tradingCount: number;
  ncTradeCount: number;
  /** Sample Lebron NC trade reports for expand/collapse (combo page; same source as item page). */
  trades: LebronTrade[];
  /** Lebron / itemdb NC trade value in caps (when known). */
  ncValue: NCValue | null;
  /** Wearable / token icon. */
  imageUrl: string;
  /** Wearable preview (CDN; use with API fallback via wearablePreviewSources). */
  previewUrl: string;
  /** Item image_id for CDN/API preview sources. */
  imageId: string | null;
  itemSlug: string;
  releasedAt: string;
};

export type StyleComboTile = {
  speciesId: number;
  colorId: number;
  speciesName: string;
  colorName: string;
  previewUrl: string;
  href: string;
  addedAt: Date;
  styleCount: number;
};

export type StyleTokenSeriesGroup = {
  series: string;
  items: StyleToken[];
};

export function groupStyleTokensBySeries(tokens: StyleToken[]): StyleTokenSeriesGroup[] {
  const bySeries = new Map<string, StyleToken[]>();
  for (const style of tokens) {
    const list = bySeries.get(style.series) ?? [];
    list.push(style);
    bySeries.set(style.series, list);
  }
  return [...bySeries.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([series, items]) => ({
      series,
      items: items.sort((a, b) => {
        if (a.isPrismatic !== b.isPrismatic) return a.isPrismatic ? 1 : -1;
        return (a.prismaticVariant ?? '').localeCompare(b.prismaticVariant ?? '');
      }),
    }));
}
