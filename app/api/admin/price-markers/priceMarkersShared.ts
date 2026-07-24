import { ItemData } from '@types';

export const MAX_MARKER_ITEM_IDS = 500;
export const MAX_MARKER_BADGE_LENGTH = 191;
export const MAX_MARKER_TITLE_LENGTH = 191;
/** Client-side only guidance; the DB column is `@db.Text` (no app-level cap). */
export const MAX_MARKER_DESCRIPTION_LENGTH = 2000;
/** hex (#rgb / #rrggbb / #rrggbbaa) — kept within the `@db.VarChar(9)` column. */
export const MARKER_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export type ManualMarkerItemRef = {
  internal_id: number;
  name: string;
  image: string | null;
};

export type ManualMarkerAdminDTO = {
  internal_id: number;
  badgeText: string | null;
  title: string | null;
  description: string | null;
  color: string;
  startAt: string;
  endAt: string | null;
  isPoint: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  items: ManualMarkerItemRef[];
};

export type ManualMarkerFields = {
  /**
   * `null` = auto translated presets; `""` = hide badge; non-empty = custom.
   */
  badgeText: string | null;
  title: string | null;
  description: string | null;
  color: string;
  startAt: string;
  endAt: string | null;
  isPoint: boolean;
};

export type ManualMarkerCreateRequest = Partial<ManualMarkerFields> & {
  itemIds?: unknown;
};

export type ManualMarkerUpdateRequest = Partial<ManualMarkerFields> & {
  itemIds?: unknown;
};

export type ManualMarkerSourceResponse = {
  items: ItemData[];
  count: number;
  notFound?: string[];
};
