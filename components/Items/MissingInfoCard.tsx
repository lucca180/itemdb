import { Alert, Button, Text } from '@chakra-ui/react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@i18n/navigation';

export default async function MissingInfoCard() {
  const t = await getTranslations();

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
            <Link href="/contribute">{t('General.learnHelp')}!</Link>
          </Button>
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}
