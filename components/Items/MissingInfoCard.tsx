import { Alert, Button, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';
import React from 'react';

const MissingInfoCard = () => {
  const t = useTranslations();

  return (
    <Alert.Root
      status="error"
      borderRadius="md"
      variant="subtle"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      bg="red.400/30"
      color="white"
    >
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t('ItemPage.missingInfoTitle')}</Alert.Title>
        <Alert.Description>
          <Text fontSize="sm">{t('ItemPage.missingInfoDescription')}</Text>
          <Button asChild mt={2} size="sm">
            <NextLink href="/contribute">{t('General.learnHelp')}!</NextLink>
          </Button>
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
};

export default MissingInfoCard;
