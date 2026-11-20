'use server';

import { headers } from 'next/headers';
import requestIp from 'request-ip';
import {
  PriceContextSuggestionError,
  submitPriceContextSuggestion,
  type PriceContextSuggestionErrorCode,
} from '@services/PriceContextSuggestionService';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { normalizeIP } from '@utils/api/api-utils';

/**
 * Submits a context suggestion for one price entry (SuggestPriceContextModal).
 * Never throws for expected errors: returns `{ success: false, error }` so the modal can
 * show a translated message.
 */
export async function suggestPriceContext(
  priceId: number,
  context: string
): Promise<
  { success: true } | { success: false; error: PriceContextSuggestionErrorCode | 'unknown' }
> {
  try {
    const { user } = await getServerCurrentUser();
    // server actions have no req object: build a req-like one so request-ip can read the headers
    const headerStore = await headers();
    const reqLike = { headers: Object.fromEntries(headerStore.entries()) };
    const ip = requestIp.getClientIp(reqLike as Parameters<typeof requestIp.getClientIp>[0]);

    return await submitPriceContextSuggestion({
      priceId,
      context,
      user,
      ip: ip ? normalizeIP(ip) : null,
    });
  } catch (error) {
    if (error instanceof PriceContextSuggestionError) return { success: false, error: error.code };

    console.error(error);
    return { success: false, error: 'unknown' };
  }
}
