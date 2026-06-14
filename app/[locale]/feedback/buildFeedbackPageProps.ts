import { getTranslations } from 'next-intl/server';
import type { BreadcrumbItem } from '@components/Breadcrumbs/types';

export type FeedbackCardLabels = {
  tradesTitle: string;
  tradesDescription: string;
  contactTitle: string;
  contactDescription: string;
  voteTitle: string;
  voteDescription: string;
};

export type FeedbackPageLabels = {
  breadcrumbList: BreadcrumbItem[];
  heading: string;
  description: string;
  cards: FeedbackCardLabels;
};

export async function buildFeedbackPageProps(): Promise<FeedbackPageLabels> {
  const t = await getTranslations();

  return {
    breadcrumbList: [
      { position: 1, name: t('Layout.home'), item: '/' },
      { position: 2, name: t('Layout.feedback'), item: '/feedback' },
    ],
    heading: t('Feedback.the-feedback-system'),
    description: t('Feedback.feedback-system-description'),
    cards: {
      tradesTitle: t('Feedback.trade-lot-pricing'),
      tradesDescription: t('Feedback.trade-lot-pricing-txt'),
      contactTitle: t('Feedback.contact-us'),
      contactDescription: t('Feedback.contact-us-text'),
      voteTitle: t('Feedback.suggestion-voting'),
      voteDescription: t('Feedback.suggestion-voting-txt'),
    },
  };
}
