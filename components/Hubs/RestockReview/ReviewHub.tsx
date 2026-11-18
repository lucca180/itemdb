'use client';

import { Box, Flex, Grid, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { GENERAL_SLIDE_COUNT, GeneralStories } from './GeneralSlides';
import { RestockReviewData } from './mockData';
import { RESTOCK_SLIDES, ReviewStories } from './ReviewStories';
import { COLORS, bodyFont, displayFont, pixelFont } from './reviewTheme';

type Chapter = 'general' | 'restock';

type ReviewHubProps = {
  year: number;
  restock: RestockReviewData;
};

/** Chapter list of the Review. In the demo every chapter is unlocked. */
export const ReviewHub = ({ year, restock }: ReviewHubProps) => {
  const t = useTranslations('ReviewGeneral');
  const tRestock = useTranslations('RestockReview');
  const [chapter, setChapter] = useState<Chapter | null>(null);

  const open = (next: Chapter | null) => {
    setChapter(next);
    window.scrollTo({ top: 0 });
  };

  if (chapter === 'general')
    return <GeneralStories onExit={() => open(null)} onNextChapter={() => open('restock')} />;

  if (chapter === 'restock') return <ReviewStories data={restock} onExit={() => open(null)} />;

  const chapters = [
    {
      id: 'general' as const,
      number: 1,
      title: t('hub-general', { year }),
      text: t('hub-general-text'),
      slides: GENERAL_SLIDE_COUNT,
      bg: COLORS.lime,
      fg: COLORS.ink,
      accent: COLORS.ink,
      muted: '#2E3F36',
    },
    {
      id: 'restock' as const,
      number: 2,
      title: tRestock('intro-title', { year }),
      text: t('hub-restock-text'),
      slides: RESTOCK_SLIDES.length,
      bg: COLORS.ink,
      fg: COLORS.cream,
      accent: COLORS.lime,
      muted: COLORS.muted,
    },
  ];

  return (
    <Flex
      className={bodyFont.className}
      direction="column"
      align="center"
      gap="20px"
      py="32px"
      w="100%"
      maxW="760px"
      mx="auto"
    >
      <Text fontSize="sm" color="whiteAlpha.700" textAlign="center">
        {t('hub-notice')}
      </Text>
      <Flex direction="column" align="center" gap="8px" textAlign="center">
        <Text
          className={displayFont.className}
          fontWeight={800}
          fontSize={{ base: '40px', md: '56px' }}
          lineHeight="1"
          letterSpacing="-0.02em"
        >
          {t('hub-title', { year })}
        </Text>
        <Text fontSize="16px" color="whiteAlpha.800">
          {t('hub-text')}
        </Text>
      </Flex>
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }} gap="16px" w="100%">
        {chapters.map((item) => (
          <Flex
            key={item.id}
            as="button"
            direction="column"
            gap="12px"
            minH="240px"
            p="22px"
            borderRadius="16px"
            bg={item.bg}
            color={item.fg}
            textAlign="left"
            cursor="pointer"
            boxShadow="lg"
            transition="transform 0.15s"
            _hover={{ transform: 'translateY(-3px)' }}
            onClick={() => open(item.id)}
          >
            <Text
              className={pixelFont.className}
              fontSize="12px"
              letterSpacing="0.06em"
              color={item.accent}
            >
              {t('hub-chapter', { number: item.number })}
            </Text>
            <Text
              className={displayFont.className}
              fontWeight={800}
              fontSize="36px"
              lineHeight="1"
              letterSpacing="-0.02em"
            >
              {item.title}
            </Text>
            <Text fontSize="15px" lineHeight="1.45" color={item.muted}>
              {item.text}
            </Text>
            <Box flex="1" />
            <Flex justify="space-between" align="center" fontSize="14px" fontWeight={700}>
              <Text color={item.muted} fontWeight={500}>
                {t('hub-slides', { count: item.slides })}
              </Text>
              <Text color={item.accent}>{t('hub-open')}</Text>
            </Flex>
          </Flex>
        ))}
      </Grid>
      <Text fontSize="13px" color="whiteAlpha.600" textAlign="center" maxW="560px">
        {t('hub-note', { year })}
      </Text>
    </Flex>
  );
};
