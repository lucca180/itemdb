'use client';

import { Alert, Button } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { LuArrowLeft } from 'react-icons/lu';
import MainLink from '@components/Utils/MainLink';

type ImportSessionAlertProps = {
  variant: 'expired' | 'need-token';
};

export function ImportSessionAlert({ variant }: ImportSessionAlertProps) {
  const t = useTranslations();
  const isExpired = variant === 'expired';

  return (
    <Alert.Root status={isExpired ? 'error' : 'info'} variant="surface" maxW="750px">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>
          {isExpired ? t('Lists.import-error-expired-title') : t('Lists.importV2-need-token-title')}
        </Alert.Title>
        <Alert.Description>
          {isExpired ? t('Lists.import-error-expired') : t('Lists.importV2-need-token')}
        </Alert.Description>
        <Button asChild size="sm" mt={2} variant="outline" w="fit-content">
          <MainLink href="/lists/import" prefetch={false}>
            <LuArrowLeft />
            {t('Lists.importV2-back-to-import')}
          </MainLink>
        </Button>
      </Alert.Content>
    </Alert.Root>
  );
}
