import { UTCDate } from '@date-fns/utc';
import type { LebronTrade, NCTradeReport } from '@types';

export function tradeReportToLebronTrade(report: NCTradeReport): LebronTrade {
  const trade: LebronTrade = {
    tradeDate: new UTCDate(report.date).getTime(),
    notes: report.notes,
    itemsSent: '',
    itemsReceived: '',
  };

  report.offered.forEach((item, i) => {
    if (i > 0) trade.itemsSent += ' + ';
    if (item.quantity > 1) trade.itemsSent += `${item.quantity}x `;
    trade.itemsSent += `${item.itemName} (${item.personalValue})`;
  });

  report.received.forEach((item, i) => {
    if (i > 0) trade.itemsReceived += ' + ';
    if (item.quantity > 1) trade.itemsReceived += `${item.quantity}x `;
    trade.itemsReceived += `${item.itemName} (${item.personalValue})`;
  });

  return trade;
}
