import 'server-only';

import { getTranslations } from 'next-intl/server';
import type { BreadcrumbItem } from '@components/Breadcrumbs/types';
import { buildFeedbackProtectedPageProps } from '../buildFeedbackProtectedPageProps';

export type FeedbackVotePageLabels = {
  shouldShowReminder: boolean;
  breadcrumbList: BreadcrumbItem[];
  heading: string;
  description: string;
};

export async function buildFeedbackVotePageProps(locale: string): Promise<FeedbackVotePageLabels> {
  const [{ shouldShowReminder }, t] = await Promise.all([
    buildFeedbackProtectedPageProps(locale, '/feedback/vote'),
    getTranslations(),
  ]);

  return {
    shouldShowReminder,
    breadcrumbList: [
      { position: 1, name: t('Layout.home'), item: '/' },
      { position: 2, name: t('Layout.feedback'), item: '/feedback' },
      { position: 3, name: t('Feedback.feedback-voting'), item: '/feedback/vote' },
    ],
    heading: t('Feedback.the-feedback-system'),
    description: t('Feedback.feedback-system-description'),
  };
}
