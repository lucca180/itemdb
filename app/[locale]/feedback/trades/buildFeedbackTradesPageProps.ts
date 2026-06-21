import 'server-only';

import { getTranslations } from 'next-intl/server';
import type { BreadcrumbItem } from '@components/Breadcrumbs/types';
import { buildFeedbackProtectedPageProps } from '../buildFeedbackProtectedPageProps';

export type FeedbackTradesPageLabels = {
  shouldShowReminder: boolean;
  breadcrumbList: BreadcrumbItem[];
  heading: string;
  description: string;
};

export async function buildFeedbackTradesPageProps(
  locale: string
): Promise<FeedbackTradesPageLabels> {
  const [{ shouldShowReminder }, t] = await Promise.all([
    buildFeedbackProtectedPageProps(locale, '/feedback/trades'),
    getTranslations(),
  ]);

  return {
    shouldShowReminder,
    breadcrumbList: [
      { position: 1, name: t('Layout.home'), item: '/' },
      { position: 2, name: t('Layout.feedback'), item: '/feedback' },
      { position: 3, name: t('Layout.trade-pricing'), item: '/feedback/trades' },
    ],
    heading: t('Feedback.the-feedback-system'),
    description: t('Feedback.feedback-system-description'),
  };
}
