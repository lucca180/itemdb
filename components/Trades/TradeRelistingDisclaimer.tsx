'use client';

import { Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import type { TradeData } from '@types';

type Props = {
  trades: TradeData[];
};

export const TradeRelistingDisclaimer = ({ trades }: Props) => {
  const t = useTranslations();
  const hasRelisting = trades.some((trade) => trade.items.some((item) => item.relisting));

  if (!hasRelisting) return null;

  return (
    <Text px={3} pb={3} color="whiteAlpha.700" fontSize="2xs" textAlign="center">
      {t('ItemPage.relisting-disclaimer')}
    </Text>
  );
};
