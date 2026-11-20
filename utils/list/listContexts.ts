/**
 * List contexts: limits and request shapes shared by the API and the list UI.
 */

/** Shown in item card corners and list card footers, so kept short (column is VarChar(191)). */
export const MAX_LIST_CONTEXT_BADGE_LENGTH = 40;
/** `ListContext.title` is `@db.VarChar(191)`. */
export const MAX_LIST_CONTEXT_TITLE_LENGTH = 191;
/** Client-side guidance only; `description` is `@db.Text`. */
export const MAX_LIST_CONTEXT_DESCRIPTION_LENGTH = 2000;
export const MAX_LIST_CONTEXTS = 100;
/** hex (#rgb / #rrggbb / #rrggbbaa), within the `@db.VarChar(9)` column. */
export const LIST_CONTEXT_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export type ListContextFields = {
  badgeText: string;
  title: string | null;
  description: string | null;
  color: string;
  /** `Items.internal_id` of items already in the list. Replaces the context's items. */
  itemIids: number[];
};

export type ListContextCreateRequest = Partial<ListContextFields>;
export type ListContextUpdateRequest = Partial<ListContextFields>;
