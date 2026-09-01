'use client';

import { Box, Flex, Heading, Icon, Link, Text } from '@chakra-ui/react';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';
import { LuExternalLink } from 'react-icons/lu';
import type { PriceCheckerPage } from './priceCheckerPages';
import { DYNAMIC_LIST_ACCENT_RGB } from './priceCheckerTheme';

type PriceCheckerPageCardProps = {
  page: PriceCheckerPage;
};

export function PriceCheckerPageCard({ page }: PriceCheckerPageCardProps) {
  const t = useTranslations();
  const isChecklist = page.isChecklist;
  const label = t(page.labelKey);
  const textColor = isChecklist ? undefined : 'white';
  const mutedColor = isChecklist ? 'gray.400' : 'whiteAlpha.900';

  return (
    <Box
      asChild
      w="full"
      borderWidth="1px"
      borderColor={isChecklist ? `rgba(${DYNAMIC_LIST_ACCENT_RGB}, 0.34)` : 'whiteAlpha.200'}
      borderRadius="lg"
      bg={isChecklist ? `rgba(${DYNAMIC_LIST_ACCENT_RGB}, 0.06)` : 'whiteAlpha.50'}
      transition="transform 160ms ease, border-color 160ms ease, background 160ms ease"
      _hover={{
        transform: 'translateY(-2px)',
        borderColor: isChecklist ? `rgba(${DYNAMIC_LIST_ACCENT_RGB}, 0.72)` : 'whiteAlpha.400',
        bg: isChecklist ? `rgba(${DYNAMIC_LIST_ACCENT_RGB}, 0.11)` : 'whiteAlpha.100',
        textDecoration: 'none',
      }}
    >
      <Link
        href={page.href}
        target="_blank"
        rel="noopener noreferrer"
        color={isChecklist ? 'inherit' : 'white'}
        w="full"
        _hover={{ color: isChecklist ? 'inherit' : 'white', textDecoration: 'none' }}
      >
        <Flex align="stretch" gap={3} p={3} w="full">
          <Box
            flexShrink={0}
            boxSize="72px"
            borderRadius="md"
            overflow="hidden"
            bg="blackAlpha.400"
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={2}
          >
            <NextImage
              src={page.imageSrc}
              alt=""
              width={56}
              height={56}
              style={{
                width: '56px',
                height: '56px',
                objectFit: 'contain',
                filter: !isChecklist ? 'grayscale(1)' : undefined,
              }}
            />
          </Box>

          <Flex direction="column" flex="1" minW={0} justify="center" gap={1}>
            <Flex align="flex-start" justify="space-between" gap={2}>
              <Heading as="h4" size="sm" lineHeight="1.25" color={textColor}>
                {label}
              </Heading>
              <Icon
                as={LuExternalLink}
                color={isChecklist ? 'whiteAlpha.400' : 'white'}
                boxSize={3.5}
                mt={0.5}
                flexShrink={0}
              />
            </Flex>
            <Text fontSize="xs" color={mutedColor} lineHeight="1.45">
              {t(page.descriptionKey)}
            </Text>
          </Flex>
        </Flex>
      </Link>
    </Box>
  );
}
