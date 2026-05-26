import { Alert, Box, CloseButton } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { setCookie } from 'cookies-next';
import { useState } from 'react';

export const NewPolicyReminder = () => {
  const t = useTranslations();
  const [shouldShow, setShouldShow] = useState(true);

  const onClose = () => {
    setCookie('bbpb_new_policy_reminder', 'true', { maxAge: 60 * 60 * 24 * 365 });
    setShouldShow(false);
  };

  if (!shouldShow) return null;

  return (
    <Alert.Root
      status="warning"
      variant="subtle"
      borderRadius="md"
      boxShadow="md"
      padding={4}
      mb={3}
      position="relative"
    >
      <Alert.Indicator />
      <Alert.Content>
        <Box flex="1">
          <Alert.Title fontSize="md">{t('Feedback.updated-trade-pricing-policy')}</Alert.Title>
          <Alert.Description fontSize="xs">{t('Feedback.review-pricing-policy')}</Alert.Description>
        </Box>
      </Alert.Content>
      <CloseButton
        alignSelf="flex-start"
        position="relative"
        right={-1}
        top={-1}
        onClick={onClose}
      />
    </Alert.Root>
  );
};
