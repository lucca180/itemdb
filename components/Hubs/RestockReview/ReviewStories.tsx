'use client';

import { Box, Button, Flex, Image, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { ComponentType, KeyboardEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import { RestockReviewData } from './mockData';
import {
  CommunitySlide,
  FastestSlide,
  FavoriteSlide,
  HeatmapSlide,
  HoursSlide,
  IntroSlide,
  LossSlide,
  ShopSlide,
  SlideProps,
  TopBoughtSlide,
  TypeSlide,
} from './ReviewSlides';
import { ShareSlide } from './ReviewShare';
import {
  SLIDE_HEIGHT,
  SLIDE_THEMES,
  SLIDE_WIDTH,
  SlideTheme,
  bodyFont,
  pixelFont,
} from './reviewTheme';

const SLIDES: { theme: SlideTheme; Slide: ComponentType<SlideProps> }[] = [
  { theme: 'lime', Slide: IntroSlide },
  { theme: 'dark', Slide: HoursSlide },
  { theme: 'dark', Slide: ShopSlide },
  { theme: 'dark', Slide: FavoriteSlide },
  { theme: 'dark', Slide: TopBoughtSlide },
  { theme: 'cream', Slide: FastestSlide },
  { theme: 'loss', Slide: LossSlide },
  { theme: 'dark', Slide: HeatmapSlide },
  { theme: 'dark', Slide: CommunitySlide },
  { theme: 'lime', Slide: TypeSlide },
  { theme: 'dark', Slide: ShareSlide },
];

// leaves room for the site header on desktop
const VERTICAL_GAP = 260;
const MAX_SCALE = 1.25;

type ReviewStoriesProps = {
  data: RestockReviewData;
};

export const ReviewStories = ({ data }: ReviewStoriesProps) => {
  const t = useTranslations('RestockReview');
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const { theme: themeName, Slide } = SLIDES[index];
  const theme = SLIDE_THEMES[themeName];
  const isFirst = index === 0;
  const isLast = index === SLIDES.length - 1;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const byWidth = container.clientWidth / SLIDE_WIDTH;
      const byHeight = Math.max(window.innerHeight - VERTICAL_GAP, 400) / SLIDE_HEIGHT;
      setScale(Math.min(byWidth, byHeight, MAX_SCALE));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const go = (next: number) => setIndex(Math.min(Math.max(next, 0), SLIDES.length - 1));

  // tap the left third to go back and the rest to go forward, like stories
  const handleTap = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const isBack = e.clientX - rect.left < rect.width / 3;
    go(isBack ? index - 1 : index + 1);
  };

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') go(index - 1);
    if (e.key === 'ArrowRight') go(index + 1);
  };

  return (
    <Flex direction="column" align="center" gap={3} py={4} w="100%">
      <Text fontSize="sm" color="whiteAlpha.700">
        {t('demo-notice')}
      </Text>
      <Box ref={containerRef} w="100%" display="flex" justifyContent="center">
        <Box
          w={`${SLIDE_WIDTH * scale}px`}
          h={`${SLIDE_HEIGHT * scale}px`}
          borderRadius="16px"
          overflow="hidden"
          boxShadow="lg"
        >
          <Flex
            role="region"
            aria-roledescription="carousel"
            aria-label={t('slide-label', { current: index + 1, total: SLIDES.length })}
            tabIndex={0}
            onClick={handleTap}
            onKeyDown={handleKey}
            className={bodyFont.className}
            w={`${SLIDE_WIDTH}px`}
            h={`${SLIDE_HEIGHT}px`}
            transform={`scale(${scale})`}
            transformOrigin="top left"
            p="20px 22px"
            direction="column"
            gap="16px"
            bg={theme.bg}
            color={theme.fg}
            overflow="hidden"
            cursor="pointer"
            userSelect="none"
            outline="none"
          >
            <Flex gap="4px" aria-hidden>
              {SLIDES.map((_, i) => (
                <Box
                  key={i}
                  flex="1"
                  h="3px"
                  borderRadius="2px"
                  bg={i <= index ? theme.accent : theme.track}
                  transition="background 0.2s"
                />
              ))}
            </Flex>
            <Flex align="center" justify="space-between">
              <Flex align="center" gap="8px">
                <Image src="/logo_icon.svg" alt="" w="22px" h="22px" />
                <Text
                  className={pixelFont.className}
                  fontSize="11px"
                  letterSpacing="0.06em"
                  color={theme.accent}
                >
                  {t('brand', { year: data.year })}
                </Text>
              </Flex>
              <Text fontSize="12px" fontWeight={500} color={theme.muted}>
                @{data.username}
              </Text>
            </Flex>
            <Slide key={index} data={data} theme={theme} />
            <Box flex="1" />
            <Flex justify="space-between" align="center">
              {isFirst ? (
                <Box />
              ) : (
                <Button
                  minH="48px"
                  px="20px"
                  borderRadius="999px"
                  variant="outline"
                  borderColor={theme.track}
                  color={theme.fg}
                  fontWeight={500}
                  onClick={() => go(index - 1)}
                >
                  {t('back')}
                </Button>
              )}
              {isLast ? (
                <Button
                  minH="48px"
                  px="16px"
                  variant="plain"
                  color={theme.accent}
                  fontWeight={500}
                  onClick={() => go(0)}
                >
                  {t('replay')}
                </Button>
              ) : (
                <Button
                  minH="48px"
                  px="24px"
                  borderRadius="999px"
                  bg={theme.buttonBg}
                  color={theme.buttonFg}
                  fontWeight={700}
                  onClick={() => go(index + 1)}
                >
                  {isFirst ? t('start') : t('next')}
                </Button>
              )}
            </Flex>
          </Flex>
        </Box>
      </Box>
    </Flex>
  );
};
