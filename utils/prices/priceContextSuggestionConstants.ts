/** Shared between the price context suggestion service (server-only) and its modal. */
import { MAX_PRICE_CONTEXT_LENGTH } from '@app/api/admin/price-context/priceContextShared';

/** `DataCollecting.type`; `subject_id` = `ItemPrices.internal_id`, `note` = suggested context. */
export const PRICE_CONTEXT_SUGGESTION_TYPE = 'priceContextSuggestion';

/** Same limit as the `ItemPrices.priceContext` column. */
export const MAX_PRICE_CONTEXT_SUGGESTION_LENGTH = MAX_PRICE_CONTEXT_LENGTH;

/** Suggestions per IP (or user, when there's no IP) in 24h. */
export const MAX_PRICE_CONTEXT_SUGGESTIONS_PER_DAY = 10;
