import { Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { SeenHistoryRateLimitError } from './seenHistoryRequest';

type SeenHistoryErrorProps = {
  error: unknown;
};

export const SeenHistoryError = ({ error }: SeenHistoryErrorProps) => {
  const t = useTranslations();

  return (
    <Text textAlign="center" fontSize="xs" color="red.300">
      {error instanceof SeenHistoryRateLimitError
        ? t('ItemPage.seen-history-rate-limited', {
            x: Math.max(1, Math.ceil(error.retryAfter / 60)),
          })
        : t('General.error')}
    </Text>
  );
};
