'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button, Center, Heading, Image, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { SetMainColor } from '@components/Layout/SetMainColor';

type ErrorPageProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  const t = useTranslations();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <>
      <title>{`${t('Error.internal-server-error')} | itemdb - Neopets Item Database`}</title>
      <meta name="robots" content="noindex" />
      <SetMainColor color="#4A5568c7" />
      <Center height="75vh" flexFlow="column" gap={3} textAlign="center">
        <Heading mb={3}>{t('General.something-went-wrong')} :(</Heading>
        <Image
          src="https://images.neopets.com/homepage/maint/images/bottombg_maintenance_mobile.png"
          alt="meepits maintenance"
        />
        <Text>{t('Error.500-text-1')}</Text>
        <Button size="sm" variant="subtle" onClick={() => retry()}>
          {t('General.try-again')}
        </Button>
      </Center>
    </>
  );
}
