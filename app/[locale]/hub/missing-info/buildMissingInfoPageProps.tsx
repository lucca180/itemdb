import type { ReactNode } from 'react';
import { Link as I18nLink } from '@i18n/navigation';
import { Link } from '@chakra-ui/react';
import { getTranslations } from 'next-intl/server';

export type MissingInfoField =
  | 'item_id'
  | 'category'
  | 'rarity'
  | 'est_val'
  | 'weight'
  | 'description';

export type MissingInfoPageLabels = {
  heading: string;
  description: ReactNode;
  metaDescription: string;
  typeButtons: Record<MissingInfoField, string>;
  emptyMessage: string;
  prevPage: string;
  nextPage: string;
};

export async function buildMissingInfoPageProps(): Promise<MissingInfoPageLabels> {
  const t = await getTranslations();

  return {
    heading: t('MissingHub.missing-info-hub'),
    description: t.rich('MissingHub.description', {
      Link: (chunk) => (
        <Link color="yellow.200" asChild>
          <I18nLink href="/contribute" prefetch={false}>
            {chunk}
          </I18nLink>
        </Link>
      ),
    }),
    metaDescription: t('MissingHub.description').replace(/<\/?Link>/g, ''),
    typeButtons: {
      item_id: t('General.item-id'),
      category: t('General.category'),
      rarity: t('General.rarity'),
      est_val: t('General.est-val'),
      weight: t('General.weight'),
      description: t('General.description'),
    },
    emptyMessage: t('MissingHub.yay-its-empty'),
    prevPage: t('MissingHub.prev-page'),
    nextPage: t('MissingHub.next-page'),
  };
}
