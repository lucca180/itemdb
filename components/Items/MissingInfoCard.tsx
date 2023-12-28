import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Box,
  Text,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import React from 'react';

const MissingInfoCard = () => {
  const t = useTranslations();

  return (
    <Alert
      status="error"
      borderRadius="md"
      variant="subtle"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
    >
      <AlertIcon />
      <Box>
        <AlertTitle>{t('ItemPage.missingInfoTitle')}</AlertTitle>
        <AlertDescription>
          <Text fontSize="sm">{t('ItemPage.missingInfoDescription')}</Text>
          <Button mt={2} as={Link} href="/contribute" size="sm">
            {t('General.learnHelp')}!
          </Button>
        </AlertDescription>
      </Box>
    </Alert>
  );
};

export default MissingInfoCard;
