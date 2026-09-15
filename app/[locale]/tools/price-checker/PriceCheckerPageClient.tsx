'use client';

import { Box, Flex, Heading, Link, SimpleGrid, Text } from '@chakra-ui/react';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';
import DynamicIcon from '@assets/icons/dynamic.png';
import FaerieFestivalBanner from '@assets/hub/faeriefest2023.png';
import HeaderCard from '@components/Card/HeaderCard';
import MainLink from '@components/Utils/MainLink';
import { PriceCheckerHowItWorks } from './PriceCheckerHowItWorks';
import { PriceCheckerPageCard } from './PriceCheckerPageCard';
import { checklistPages, inventoryPages } from './priceCheckerPages';
import {
  DYNAMIC_LIST_ACCENT_RGB,
  FAERIE_FESTIVAL_ACCENT_RGB,
  PRICE_CHECKER_ACCENT,
  PRICE_CHECKER_ACCENT_LIGHT,
} from './priceCheckerTheme';

export function PriceCheckerPageClient() {
  const t = useTranslations();

  return (
    <>
      <HeaderCard
        color={PRICE_CHECKER_ACCENT}
        image={{
          src: 'https://images.neopets.com/nt/ntimages/128_bruce_ring.gif',
          alt: t('PriceChecker.title'),
        }}
      >
        <Heading as="h1" size="lg">
          {t('PriceChecker.h1')}
        </Heading>
        <Text fontSize={{ base: 'sm', md: undefined }}>{t('PriceChecker.description')}</Text>
      </HeaderCard>

      <Flex direction="column" gap={{ base: 8, md: 10 }} w="full" maxW="1100px">
        <PriceCheckerHowItWorks />

        <Box
          position="relative"
          borderRadius="xl"
          overflow="hidden"
          borderWidth="1px"
          borderColor={`rgba(${FAERIE_FESTIVAL_ACCENT_RGB}, 0.34)`}
          minH={{ base: '200px', md: '220px' }}
        >
          <NextImage
            src={FaerieFestivalBanner}
            alt=""
            fill
            style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
          />
          <Box
            position="absolute"
            inset={0}
            bgGradient="linear-gradient(180deg, rgba(15,6,15,.45) 0%, rgba(15,6,15,.75) 45%, rgba(15,6,15,.96) 100%)"
          />
          <Flex
            position="relative"
            direction="column"
            justify="flex-end"
            h="100%"
            p={{ base: 4, md: 6 }}
            gap={1.5}
          >
            <Text
              fontSize="xs"
              letterSpacing="0.14em"
              textTransform="uppercase"
              color="pink.200"
              fontWeight="bold"
            >
              {t('PriceChecker.ff-promo-kicker')}
            </Text>
            <Heading as="h2" size="lg" color="white">
              {t('PriceChecker.ff-promo-title')}
            </Heading>
            <Text color="whiteAlpha.800" fontSize="sm" maxW="520px">
              {t('PriceChecker.ff-promo-description')}
            </Text>
            <Link asChild fontSize="sm" fontWeight="semibold" color="pink.200" mt={1}>
              <MainLink href="/hub/faeriefestival">{t('PriceChecker.ff-promo-cta')} →</MainLink>
            </Link>
          </Flex>
        </Box>

        <Box>
          <Text
            color={PRICE_CHECKER_ACCENT_LIGHT}
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="0.14em"
            textTransform="uppercase"
          >
            {t('PriceChecker.choose-source')}
          </Text>
          <Heading as="h2" size="lg" mt={1} mb={4}>
            {t('PriceChecker.inventory-pages')}
          </Heading>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={3}>
            {inventoryPages.map((page) => (
              <PriceCheckerPageCard key={page.id} page={page} />
            ))}
          </SimpleGrid>
        </Box>

        <Box
          borderRadius="xl"
          borderWidth="1px"
          borderColor={`rgba(${DYNAMIC_LIST_ACCENT_RGB}, 0.24)`}
          bg={`linear-gradient(145deg, rgba(${DYNAMIC_LIST_ACCENT_RGB}, 0.09), rgba(${DYNAMIC_LIST_ACCENT_RGB}, 0.025))`}
          p={{ base: 4, md: 5 }}
        >
          <Flex align="center" gap={3} mb={4}>
            <Flex
              boxSize="38px"
              borderRadius="md"
              align="center"
              justify="center"
              bg={`rgba(${DYNAMIC_LIST_ACCENT_RGB}, 0.18)`}
            >
              <NextImage src={DynamicIcon} alt="" width={12} style={{ height: 'auto' }} />
            </Flex>
            <Box>
              <Heading as="h2" size="lg">
                {t('PriceChecker.checklist-pages')}
              </Heading>
              <Text color="gray.400" fontSize="sm" mt={0.5}>
                {t('PriceChecker.dynamic-list-hint')}
              </Text>
            </Box>
          </Flex>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={3}>
            {checklistPages.map((page) => (
              <PriceCheckerPageCard key={page.id} page={page} />
            ))}
          </SimpleGrid>
        </Box>
      </Flex>
    </>
  );
}
