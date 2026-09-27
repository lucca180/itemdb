'use client';

import { Alert, Box, Collapsible, Flex, HStack, Icon, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { LuChevronDown, LuExternalLink } from 'react-icons/lu';
import MainLink from '@components/Utils/MainLink';
import { ItemImageV2 } from '@components/Items/v2/ItemImageV2';
import type { ImportAmbiguity } from './importV2Shared';

/** Above this many options the list starts collapsed. */
const MAX_INLINE_OPTIONS = 4;

type ImportAmbiguityAlertProps = {
  ambiguous: ImportAmbiguity[];
};

export function ImportAmbiguityAlert({ ambiguous }: ImportAmbiguityAlertProps) {
  const t = useTranslations();
  if (!ambiguous.length) return null;

  const optionCount = ambiguous.reduce((sum, entry) => sum + entry.candidates.length, 0);

  const groups = (
    <Flex direction="column" gap={3} pt={2}>
      {ambiguous.map((entry) => (
        <Box key={entry.key}>
          <Text fontSize="xs" color="whiteAlpha.700" mb={1.5}>
            {t('Lists.importV2-ambiguous-group', {
              count: entry.count,
              total: entry.candidates.length,
            })}
          </Text>
          <Flex gap={2} flexWrap="wrap">
            {entry.candidates.map((item) => (
              <MainLink
                key={item.internal_id}
                href={`/item/${item.slug ?? item.internal_id}`}
                prefetch={false}
                target="_blank"
                trackEvent="import-v2-ambiguous-option"
              >
                <HStack
                  gap={2}
                  p={1.5}
                  pe={2.5}
                  bg="blackAlpha.300"
                  borderWidth="1px"
                  borderColor="whiteAlpha.200"
                  borderRadius="md"
                  _hover={{ borderColor: 'teal.400' }}
                >
                  <Box w="32px" h="32px" flexShrink={0} borderRadius="sm" overflow="hidden">
                    <ItemImageV2 item={item} width={32} height={32} />
                  </Box>
                  <Text fontSize="sm" color="whiteAlpha.900">
                    {item.name}
                  </Text>
                  <Icon as={LuExternalLink} boxSize={2.5} color="whiteAlpha.400" />
                </HStack>
              </MainLink>
            ))}
          </Flex>
        </Box>
      ))}
    </Flex>
  );

  return (
    <Alert.Root status="warning" variant="surface" maxW="750px">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>
          {t('Lists.importV2-ambiguous-title', { count: ambiguous.length })}
        </Alert.Title>
        <Alert.Description>{t('Lists.importV2-ambiguous-desc')}</Alert.Description>
        {optionCount > MAX_INLINE_OPTIONS ? (
          <Collapsible.Root>
            <Collapsible.Trigger
              display="flex"
              alignItems="center"
              gap={1}
              mt={2}
              fontSize="sm"
              fontWeight="semibold"
              cursor="pointer"
              onClick={() => window.umami?.track('import-v2-ambiguous-toggle')}
            >
              <Collapsible.Indicator
                transition="transform 0.15s"
                _open={{ transform: 'rotate(180deg)' }}
              >
                <LuChevronDown />
              </Collapsible.Indicator>
              {t('Lists.importV2-ambiguous-show-options', { count: optionCount })}
            </Collapsible.Trigger>
            <Collapsible.Content>{groups}</Collapsible.Content>
          </Collapsible.Root>
        ) : (
          groups
        )}
      </Alert.Content>
    </Alert.Root>
  );
}
