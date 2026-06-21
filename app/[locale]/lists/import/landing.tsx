'use client';

import { Alert, Flex, Link, Separator } from '@chakra-ui/react';
import { ImportInfo } from '@components/Import/ImportInfo';
import MainLink from '@components/Utils/MainLink';
import { useTranslations } from 'next-intl';
import { useScriptStatus } from '@utils/scriptUtils';

export function ImportLanding() {
  return (
    <Flex flexFlow="column" gap={3} css={{ '& a': { color: '#b8e9a9' } }}>
      <Separator />
      <OutdatedListImporterAlert />
      <ImportInfo />
    </Flex>
  );
}

function OutdatedListImporterAlert() {
  const t = useTranslations();
  const { scriptStatus } = useScriptStatus();
  const listImporter = scriptStatus?.itemdb_listImporter;

  if (!listImporter || listImporter?.status !== 'outdated') return null;

  return (
    <Alert.Root
      status="warning"
      variant="surface"
      maxW="750px"
      css={{ '& a': { color: 'colorPalette.100' } }}
    >
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t('Lists.import-outdated-script-title')}</Alert.Title>
        <Alert.Description>
          {t.rich('Lists.import-outdated-script', {
            Link: (chunk) => (
              <Link asChild>
                <MainLink href={listImporter?.link} isExternal>
                  {chunk}
                </MainLink>
              </Link>
            ),
          })}
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}
