'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';
import Background from '@assets/hub/faeriefest2023.png';
import MainLink from '@components/Utils/MainLink';

export function FaerieFestivalSidebarPromo() {
  const t = useTranslations();

  return (
    <Box asChild borderRadius="lg" overflow="hidden" position="relative" h="110px" w="100%">
      <MainLink href="/hub/faeriefestival" prefetch={false}>
        <NextImage
          src={Background}
          alt=""
          fill
          style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
        />
        <Box
          position="absolute"
          inset={0}
          bgGradient="linear-gradient(180deg, rgba(40,10,35,.15) 0%, rgba(40,10,35,.9) 100%)"
        />
        <Flex position="absolute" inset={0} direction="column" justify="flex-end" p={3} gap={0.5}>
          <Text
            fontSize="2xs"
            letterSpacing="0.14em"
            textTransform="uppercase"
            color="pink.200"
            fontWeight="bold"
          >
            {t('Lists.importV2-ff-promo-kicker')}
          </Text>
          <Text fontSize="md" fontWeight="bold" color="white" lineHeight="1.2">
            {t('Lists.importV2-ff-promo-title')}
          </Text>
          <Text fontSize="xs" fontWeight="semibold" color="pink.200">
            {t('Lists.importV2-ff-promo-cta')} →
          </Text>
        </Flex>
      </MainLink>
    </Box>
  );
}
