'use server';

import { headers } from 'next/headers';
import { getClientIp } from '@utils/api/clientIp';
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
    const ip = getClientIp(await headers());

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
