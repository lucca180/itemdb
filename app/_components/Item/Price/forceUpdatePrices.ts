import axios from 'axios';

export type ProcessAdminPricesResult =
  | { status: 'no_queue' }
  | { status: 'updated'; price: number }
  | { status: 'manual_check'; price: number; reason: string | null }
  | { status: 'skipped'; reason: string | null };

const SKIP_REASON_LABELS: Record<string, string> = {
  not_enough_data: 'Not enough recent data points yet.',
  usershop_only: 'Only user shop listings are available — needs more reliable sources.',
  low_confidence: 'Available data sources are too low-confidence.',
  high_deviation: 'Queued prices are too inconsistent with each other.',
  stale_data: 'Queued data is older than the current price.',
  same_day_update: 'A price was already set for this item very recently.',
  insignificant_change: 'The computed price is too close to the current one.',
  awaiting_confirmation: 'Not enough signal yet to confirm this price change.',
  new_item: 'Item was added too recently to set a first price.',
  error: 'An internal error prevented pricing this item.',
};

export async function requestForceUpdatePrices(itemId: number): Promise<ProcessAdminPricesResult> {
  const { data } = await axios.patch<ProcessAdminPricesResult>('/api/admin/prices/', {
    item_iid: itemId,
  });
  return data;
}

export type ForceUpdateToastContent = {
  status: 'success' | 'warning' | 'info';
  title: string;
  description: string;
};

export function getForceUpdateToastContent(
  data: ProcessAdminPricesResult,
  formatNumber: (value: number) => string
): ForceUpdateToastContent {
  if (data.status === 'updated') {
    return {
      status: 'success',
      title: 'Price Updated',
      description: `New price: ${formatNumber(data.price)} NP`,
    };
  }

  if (data.status === 'manual_check') {
    return {
      status: 'warning',
      title: 'Flagged for Manual Review',
      description: `New price: ${formatNumber(data.price)} NP — needs manual approval${
        data.reason ? ` (${data.reason})` : ''
      }.`,
    };
  }

  if (data.status === 'no_queue') {
    return {
      status: 'info',
      title: 'Nothing to Process',
      description: 'No new data queued for this item yet.',
    };
  }

  return {
    status: 'info',
    title: 'No Price Change',
    description:
      (data.reason && SKIP_REASON_LABELS[data.reason]) ||
      'The algorithm chose not to set a new price.',
  };
}
