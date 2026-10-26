/** Shared between the suggestion service (server-only) and the suggestion modal. */
export const LIST_SUGGESTION_TYPE = 'officialListSuggestion';
export const MAX_SUGGESTION_ITEMS = 10;
export const MAX_SUGGESTION_NOTE_LENGTH = 500;

/** Where a suggestion was submitted from (reviewers weigh item-page picks differently). */
export const LIST_SUGGESTION_SOURCES = ['list-page', 'item-page-card', 'item-page-menu'] as const;
export type ListSuggestionSource = (typeof LIST_SUGGESTION_SOURCES)[number];

/** Untrusted client value → known source (falls back to the list page, the original entry point). */
export function normalizeSuggestionSource(source: unknown): ListSuggestionSource {
  return LIST_SUGGESTION_SOURCES.find((s) => s === source) ?? 'list-page';
}
