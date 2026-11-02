'use client';

import { Box, Button, Flex, Grid, Image, Text } from '@chakra-ui/react';
import { useToPng } from '@hugocxl/react-to-image';
import { useFormatter, useTranslations } from 'next-intl';
import { Ref, useRef, useState } from 'react';
import { FaCopy, FaDownload, FaShareAlt } from 'react-icons/fa';
import { useToast } from '@utils/theme/toast';
import { restockShopInfo } from '@utils/utils';
import { RestockReviewData } from './mockData';
import { SlideProps } from './ReviewSlides';
import { COLORS, SLIDE_HEIGHT, SLIDE_WIDTH, bodyFont, displayFont, pixelFont } from './reviewTheme';

const LOGO = '/logo_icon.svg';
const SHARE_PIXEL_RATIO = 1080 / SLIDE_WIDTH;

type ShareCardProps = {
  data: RestockReviewData;
  innerRef?: Ref<HTMLDivElement>;
};

/** The 1080x1920 story image people share, drawn at 405x720. */
export const ShareCard = ({ data, innerRef }: ShareCardProps) => {
  const t = useTranslations('RestockReview');
  const format = useFormatter();
  const day = (iso: string) =>
    format.dateTime(new Date(`${iso}T12:00:00Z`), {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });

  const stats = [
    {
      label: t('story-restocking'),
      value: t('hours-value', { hours: format.number(data.hours) }),
      big: true,
    },
    { label: t('story-sessions'), value: format.number(data.sessions), big: true },
    { label: t('story-shop'), value: restockShopInfo[String(data.topShops[0].id)]?.name ?? '' },
    { label: t('story-most-valuable'), value: `${format.number(data.topBought[0].price)} NP` },
  ];

  return (
    <Flex
      ref={innerRef}
      className={bodyFont.className}
      w={`${SLIDE_WIDTH}px`}
      h={`${SLIDE_HEIGHT}px`}
      p="28px 26px"
      direction="column"
      gap="18px"
      bg={COLORS.ink}
      color={COLORS.cream}
      overflow="hidden"
    >
      <Flex align="center" justify="space-between">
        <Flex align="center" gap="8px">
          <Image src={LOGO} alt="" w="26px" h="26px" />
          <Text
            className={pixelFont.className}
            fontSize="12px"
            letterSpacing="0.06em"
            color={COLORS.lime}
          >
            {t('brand', { year: data.year })}
          </Text>
        </Flex>
        <Text fontSize="13px" fontWeight={500} color={COLORS.muted}>
          @{data.username}
        </Text>
      </Flex>
      <Flex direction="column" gap="6px" mt="12px">
        <Text
          className={pixelFont.className}
          fontSize="12px"
          letterSpacing="0.06em"
          color={COLORS.muted}
        >
          {t('story-type')}
        </Text>
        <Text
          className={displayFont.className}
          fontWeight={800}
          fontSize="68px"
          lineHeight="0.92"
          letterSpacing="-0.03em"
          color={COLORS.lime}
        >
          {t(`type-${data.type}`)}
        </Text>
      </Flex>
      <Grid templateColumns="repeat(5, minmax(0, 1fr))" gap="8px">
        {data.topBought.map((item) => (
          <Image
            key={item.name}
            src={item.image}
            alt={item.name}
            w="100%"
            aspectRatio={1}
            p="5px"
            borderRadius="8px"
            bg={COLORS.cream}
          />
        ))}
      </Grid>
      <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="10px">
        {stats.map((stat) => (
          <Flex
            key={stat.label}
            direction="column"
            gap="4px"
            p="14px"
            borderRadius="12px"
            bg={COLORS.panel}
          >
            <Text fontSize="12px" color={COLORS.muted}>
              {stat.label}
            </Text>
            <Text
              className={displayFont.className}
              fontWeight={800}
              fontSize={stat.big ? '30px' : '18px'}
              lineHeight="1.15"
            >
              {stat.value}
            </Text>
          </Flex>
        ))}
      </Grid>
      <Text fontSize="16px" lineHeight="1.4">
        {t.rich('story-faster', {
          pct: format.number(data.percentiles.reaction / 100, { style: 'percent' }),
          b: (chunk) => (
            <Text as="strong" color={COLORS.lime}>
              {chunk}
            </Text>
          ),
        })}
      </Text>
      <Box flex="1" />
      <Flex
        align="center"
        justify="space-between"
        pt="14px"
        borderTop="1px solid rgba(243, 240, 230, 0.2)"
      >
        <Flex align="center" gap="8px">
          <Image src={LOGO} alt="" w="22px" h="22px" />
          <Text fontSize="14px" fontWeight={700}>
            itemdb.com.br/restock
          </Text>
        </Flex>
        <Text fontSize="12px" color={COLORS.muted}>
          {t('date-range', { start: day(data.periodStart), end: day(data.periodEnd) })}
        </Text>
      </Flex>
    </Flex>
  );
};

export const PetpageBadge = ({
  data,
  variant,
}: {
  data: RestockReviewData;
  variant: 'dark' | 'lime';
}) => {
  const t = useTranslations('RestockReview');
  const format = useFormatter();
  const dark = variant === 'dark';

  return (
    <Flex
      w="200px"
      h="72px"
      p="10px 12px"
      align="center"
      gap="10px"
      borderRadius="10px"
      bg={dark ? COLORS.ink : COLORS.lime}
      color={dark ? COLORS.cream : COLORS.ink}
    >
      <Image src={LOGO} alt="" w="30px" h="30px" />
      <Flex direction="column" gap="2px">
        <Text
          className={pixelFont.className}
          fontSize="9px"
          letterSpacing="0.06em"
          color={dark ? COLORS.lime : undefined}
        >
          RESTOCK {data.year}
        </Text>
        <Text className={displayFont.className} fontWeight={800} fontSize="19px" lineHeight="1">
          {t(`type-${data.type}`)}
        </Text>
        <Text fontSize="10px" color={dark ? COLORS.muted : '#2E3F36'}>
          {t('badge-stats', {
            hours: format.number(data.hours),
            sessions: format.number(data.sessions),
          })}
        </Text>
      </Flex>
    </Flex>
  );
};

type ShareAction = 'download' | 'copy' | 'share';

export const ShareSlide = ({ data, theme }: SlideProps) => {
  const t = useTranslations();
  const toast = useToast();
  const [showBadge, setShowBadge] = useState(false);
  const action = useRef<ShareAction>('download');
  const [pending, setPending] = useState<ShareAction | null>(null);

  const [state, convert, cardRef] = useToPng<HTMLDivElement>({
    pixelRatio: SHARE_PIXEL_RATIO,
    onSuccess: (dataUrl) => handleImage(dataUrl),
    onError: (err) => {
      console.error(err);
      showError();
    },
  });

  const showError = () =>
    toast({
      id: 'restock-review-share-error',
      title: 'Error',
      description: t('General.an-error-occured-please-try-again-later'),
      status: 'error',
      duration: 5000,
    });

  const handleImage = async (dataUrl: string) => {
    const fileName = `itemdb-restock-review-${data.year}.png`;

    try {
      if (action.current === 'download') {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
        return;
      }

      const blob = await (await fetch(dataUrl)).blob();

      if (action.current === 'copy') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        toast({
          id: 'restock-review-copied',
          title: t('General.success'),
          description: t('Restock.image-copied-to-clipboard'),
          status: 'success',
          duration: 5000,
        });
        return;
      }

      const shareData = {
        files: [new File([blob], fileName, { type: blob.type })],
        title: t('RestockReview.seo-title', { year: data.year }),
        text: t('RestockReview.share-text', { year: data.year }),
      };
      if (!navigator.canShare?.(shareData)) throw new Error('Web Share API not supported');
      await navigator.share(shareData);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error(err);
      showError();
    }
  };

  const run = (next: ShareAction) => {
    action.current = next;
    setPending(next);
    convert();
  };

  if (showBadge)
    return (
      <>
        <Text className={displayFont.className} fontWeight={800} fontSize="28px" mt="4px">
          {t('RestockReview.badge-title')}
        </Text>
        <Text fontSize="14px" color={theme.muted}>
          {t('RestockReview.badge-hint')}
        </Text>
        <Flex
          direction="column"
          gap="16px"
          p="20px"
          borderRadius="14px"
          bg="#EDE9DD"
          align="center"
        >
          {(['dark', 'lime'] as const).map((variant) => (
            <Flex key={variant} direction="column" gap="6px">
              <Text fontSize="12px" color={COLORS.mutedDark}>
                {t(`RestockReview.badge-${variant}`)}
              </Text>
              <PetpageBadge data={data} variant={variant} />
            </Flex>
          ))}
        </Flex>
        <Button
          variant="plain"
          color={theme.accent}
          alignSelf="flex-start"
          px={0}
          onClick={() => setShowBadge(false)}
        >
          {t('RestockReview.badge-back')}
        </Button>
      </>
    );

  return (
    <>
      <Text
        className={displayFont.className}
        fontWeight={800}
        fontSize="28px"
        lineHeight="1.05"
        mt="4px"
      >
        {t('RestockReview.share-title', { year: data.year })}
      </Text>
      <Flex justify="center">
        <Box
          w={`${SLIDE_WIDTH / 2}px`}
          h={`${SLIDE_HEIGHT / 2}px`}
          overflow="hidden"
          borderRadius="12px"
          boxShadow="0 0 0 1px rgba(243, 240, 230, 0.25)"
        >
          <Box
            w={`${SLIDE_WIDTH}px`}
            h={`${SLIDE_HEIGHT}px`}
            transform="scale(0.5)"
            transformOrigin="top left"
          >
            <ShareCard data={data} innerRef={cardRef} />
          </Box>
        </Box>
      </Flex>
      <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap="8px">
        <Button
          minH="48px"
          borderRadius="12px"
          bg={COLORS.lime}
          color={COLORS.ink}
          fontWeight={700}
          loading={state.isLoading && pending === 'download'}
          onClick={() => run('download')}
        >
          <FaDownload /> {t('RestockReview.download')}
        </Button>
        <Button
          minH="48px"
          borderRadius="12px"
          variant="outline"
          borderColor="rgba(243, 240, 230, 0.35)"
          color={COLORS.cream}
          fontWeight={700}
          loading={state.isLoading && pending === 'copy'}
          onClick={() => run('copy')}
        >
          <FaCopy /> {t('RestockReview.copy')}
        </Button>
        <Button
          minH="48px"
          borderRadius="12px"
          variant="outline"
          borderColor="rgba(243, 240, 230, 0.35)"
          color={COLORS.cream}
          fontWeight={700}
          loading={state.isLoading && pending === 'share'}
          onClick={() => run('share')}
        >
          <FaShareAlt /> {t('RestockReview.share')}
        </Button>
      </Grid>
      <Button
        minH="48px"
        borderRadius="12px"
        bg={COLORS.panel}
        color={COLORS.cream}
        justifyContent="space-between"
        fontWeight={400}
        onClick={() => setShowBadge(true)}
      >
        <Text as="span">
          {t.rich('RestockReview.badge-cta', { b: (chunk) => <strong>{chunk}</strong> })}
        </Text>
        <Text as="span" color={COLORS.lime}>
          →
        </Text>
      </Button>
    </>
  );
};
