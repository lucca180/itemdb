'use client';

import { Box, Button, Flex, Image, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Fragment, MouseEvent, ReactNode, useCallback, useEffect, useState } from 'react';
import {
  SLIDE_HEIGHT,
  SLIDE_THEMES,
  SLIDE_WIDTH,
  SlideTheme,
  SlideThemeColors,
  bodyFont,
  pixelFont,
} from './reviewTheme';

export type Story = {
  theme: SlideTheme;
  render: (theme: SlideThemeColors) => ReactNode;
};

type StoriesPlayerProps = {
  stories: Story[];
  /** Pixel label at the top left, e.g. "RESTOCK REVIEW 2026". */
  brand: string;
  /** Shown at the top right when there is no exit button. */
  handle?: string;
  /** Adds a button to go back to the chapter list. */
  onExit?: () => void;
  /** Line above the slides, defaults to the sample data notice. */
  notice?: string;
  /** Slide to open on (read on mount only). */
  initialIndex?: number;
  /** Demo controls shown outside the slide, e.g. debug shortcuts. */
  toolbar?: ReactNode;
};

// below this width the slide fills the screen edge to edge, like a phone story
const NARROW_BREAKPOINT = 500;
const SIDE_GAP = 32;
const TOP_GAP = 44;
const BOTTOM_GAP = 16;

export const StoriesPlayer = ({
  stories,
  brand,
  handle,
  onExit,
  notice,
  initialIndex = 0,
  toolbar,
}: StoriesPlayerProps) => {
  const t = useTranslations('RestockReview');
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [isNarrow, setIsNarrow] = useState(false);

  const story = stories[index];
  const theme = SLIDE_THEMES[story.theme];
  const isFirst = index === 0;
  const isLast = index === stories.length - 1;

  // full screen: the slide takes all the height on desktop and all the width on phones
  useEffect(() => {
    const update = () => {
      const narrow = window.innerWidth < NARROW_BREAKPOINT;
      setIsNarrow(narrow);
      const byWidth = (window.innerWidth - (narrow ? 0 : SIDE_GAP)) / SLIDE_WIDTH;
      const byHeight = (window.innerHeight - (narrow ? 0 : TOP_GAP + BOTTOM_GAP)) / SLIDE_HEIGHT;
      setScale(Math.min(byWidth, byHeight));
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // the page behind the stories shouldn't scroll
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // functional update so quick taps or held arrow keys don't read a stale index
  const step = useCallback(
    (delta: number) =>
      setIndex((current) => Math.min(Math.max(current + delta, 0), stories.length - 1)),
    [stories.length]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'Escape') onExit?.();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [step, onExit]);

  // tap the left third to go back and the rest to go forward, like stories
  const handleTap = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const isBack = e.clientX - rect.left < rect.width / 3;
    step(isBack ? -1 : 1);
  };

  return (
    <Flex
      position="fixed"
      inset={0}
      zIndex={1400}
      direction="column"
      align="center"
      justify="center"
      bg={theme.bg}
      transition="background 0.3s"
    >
      {/* dims the slide color behind the slide */}
      <Box position="absolute" inset={0} bg="rgba(5, 10, 8, 0.82)" />
      {!isNarrow && (
        <Text
          position="absolute"
          top={`${(TOP_GAP - 20) / 2}px`}
          fontSize="sm"
          color="whiteAlpha.700"
        >
          {notice ?? t('demo-notice')}
        </Text>
      )}
      {toolbar && (
        // a column on the left on desktop; a strip at the top of the screen on phones, where the
        // centered slide usually leaves some room
        <Flex
          position="absolute"
          zIndex={1}
          gap="4px"
          p="4px 6px"
          borderRadius="8px"
          bg="rgba(5, 10, 8, 0.7)"
          {...(isNarrow
            ? { top: '4px', left: '4px', right: '4px', justify: 'center', flexWrap: 'wrap' }
            : { top: `${TOP_GAP}px`, left: '12px', direction: 'column', align: 'flex-start' })}
        >
          {toolbar}
        </Flex>
      )}
      <Box position="relative" mt={isNarrow ? 0 : `${TOP_GAP - BOTTOM_GAP}px`}>
        <Box
          w={`${SLIDE_WIDTH * scale}px`}
          h={`${SLIDE_HEIGHT * scale}px`}
          borderRadius={isNarrow ? 0 : '16px'}
          overflow="hidden"
          boxShadow="0 24px 80px rgba(0, 0, 0, 0.5)"
        >
          <Flex
            role="region"
            aria-roledescription="carousel"
            aria-label={t('slide-label', { current: index + 1, total: stories.length })}
            tabIndex={0}
            onClick={handleTap}
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
              {stories.map((_, i) => (
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
            <Flex align="center" justify="space-between" minH="24px">
              <Flex align="center" gap="8px">
                <Image src="/logo_icon.svg" alt="" w="22px" h="22px" />
                <Text
                  className={pixelFont.className}
                  fontSize="11px"
                  letterSpacing="0.06em"
                  color={theme.accent}
                >
                  {brand}
                </Text>
              </Flex>
              {onExit ? (
                <Button
                  size="xs"
                  variant="plain"
                  color={theme.muted}
                  fontWeight={500}
                  px={0}
                  onClick={onExit}
                >
                  {t('chapters')}
                </Button>
              ) : (
                handle && (
                  <Text fontSize="12px" fontWeight={500} color={theme.muted}>
                    {handle}
                  </Text>
                )
              )}
            </Flex>
            {/* keyed so slides with local state (quiz, badge) reset when revisited */}
            <Fragment key={index}>{story.render(theme)}</Fragment>
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
                  onClick={() => step(-1)}
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
                  onClick={() => setIndex(0)}
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
                  onClick={() => step(1)}
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
