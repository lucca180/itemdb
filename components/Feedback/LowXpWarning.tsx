'use client';

import { Alert, CloseButton, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'feedback_low_xp_warning_dismissed_until';
const DISMISS_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

// Umami loads with `lazyOnload`, so it may not exist yet when the alert mounts.
const UMAMI_RETRY_MS = 500;
const UMAMI_MAX_RETRIES = 20;

export const LowXpWarning = () => {
  const t = useTranslations();
  // Starts hidden so SSR and the first client render match; localStorage is read after mount.
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    let dismissedUntil = 0;
    try {
      dismissedUntil = Number(localStorage.getItem(STORAGE_KEY)) || 0;
    } catch {}

    const isVisible = Date.now() > dismissedUntil;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShouldShow(isVisible);
    if (!isVisible) return;

    let timeout: ReturnType<typeof setTimeout>;
    const trackView = (retries: number) => {
      if (window.umami) return void window.umami.track('low-xp-warning-view');
      if (retries > 0) timeout = setTimeout(() => trackView(retries - 1), UMAMI_RETRY_MS);
    };

    trackView(UMAMI_MAX_RETRIES);
    return () => clearTimeout(timeout);
  }, []);

  const onDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now() + DISMISS_DURATION_MS));
    } catch {}

    window.umami?.track('low-xp-warning-dismiss');
    setShouldShow(false);
  };

  if (!shouldShow) return null;

  return (
    <Alert.Root
      status="warning"
      variant="surface"
      borderRadius="md"
      // boxShadow="md"
      padding={4}
      w="100%"
    >
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title fontSize="md">{t('Feedback.low-xp-warning-title')}</Alert.Title>
        <Alert.Description fontSize="sm">
          <Text>{t('Feedback.low-xp-warning-desc')}</Text>
          <Text mt={2}>
            {t.rich('Feedback.low-xp-warning-tip', {
              b: (chunk) => <b>{chunk}</b>,
            })}
          </Text>
        </Alert.Description>
      </Alert.Content>
      <CloseButton
        alignSelf="flex-start"
        position="relative"
        right={-1}
        top={-1}
        size="sm"
        onClick={onDismiss}
      />
    </Alert.Root>
  );
};
