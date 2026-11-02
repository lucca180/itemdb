'use client';

import { Box, Flex, Grid, Image, Text } from '@chakra-ui/react';
import { useFormatter, useTranslations } from 'next-intl';
import { ReactNode } from 'react';
import { restockShopInfo } from '@utils/utils';
import {
  RESTOCKER_TYPES,
  RestockReviewData,
  ReviewItem,
  addDaysIso,
  getLongestStreak,
} from './mockData';
import {
  COLORS,
  SLIDE_THEMES,
  SlideTheme,
  displayFont,
  pixelFont,
  shopkeeperImage,
} from './reviewTheme';

export type SlideProps = {
  data: RestockReviewData;
  theme: (typeof SLIDE_THEMES)[SlideTheme];
};

const shopName = (id: number) => restockShopInfo[String(id)]?.name ?? '';

// review dates are calendar days, so format them in UTC to avoid shifting a day
const useReviewFormat = () => {
  const format = useFormatter();

  return {
    number: (value: number) => format.number(value),
    percent: (value: number) => format.number(value / 100, { style: 'percent' }),
    day: (iso: string) =>
      format.dateTime(new Date(`${iso}T12:00:00Z`), {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      }),
    longDay: (iso: string) =>
      format.dateTime(new Date(`${iso}T12:00:00Z`), {
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      }),
  };
};

export const Eyebrow = ({ children, color }: { children: ReactNode; color: string }) => (
  <Text
    className={pixelFont.className}
    fontSize="13px"
    letterSpacing="0.06em"
    color={color}
    m={0}
    mt="24px"
  >
    {children}
  </Text>
);

const Display = ({
  children,
  size,
  color,
  lineHeight = '1.05',
  textAlign,
}: {
  children: ReactNode;
  size: string;
  color?: string;
  lineHeight?: string;
  textAlign?: 'center';
}) => (
  <Text
    className={displayFont.className}
    fontWeight={800}
    fontSize={size}
    lineHeight={lineHeight}
    letterSpacing="-0.02em"
    color={color}
    textAlign={textAlign}
    m={0}
  >
    {children}
  </Text>
);

export const StampImage = ({
  item,
  size,
  rotate = 0,
  grayscale,
}: {
  item: ReviewItem;
  size: number;
  rotate?: number;
  grayscale?: boolean;
}) => (
  <Image
    src={item.image}
    alt={item.name}
    w={`${size}px`}
    h={`${size}px`}
    bg={COLORS.cream}
    p="8px"
    border={`2px dashed ${COLORS.ink}`}
    transform={`rotate(${rotate}deg)`}
    filter={grayscale ? 'grayscale(1)' : undefined}
    opacity={grayscale ? 0.75 : 1}
    boxSizing="content-box"
  />
);

const StatTile = ({ value, label }: { value: string; label: string }) => (
  <Flex direction="column" gap="4px" p="14px 12px" borderRadius="12px" bg={COLORS.panel}>
    <Display size="26px">{value}</Display>
    <Text fontSize="12px" color={COLORS.muted}>
      {label}
    </Text>
  </Flex>
);

export const IntroSlide = ({ data }: SlideProps) => {
  const t = useTranslations('RestockReview');
  const f = useReviewFormat();
  const [a, b, c, d, e] = data.topBought;

  return (
    <>
      <Box position="relative" h="250px" mt="8px">
        <Box position="absolute" left="18px" top="24px">
          <StampImage item={a} size={80} rotate={-8} />
        </Box>
        <Box position="absolute" left="140px" top="4px">
          <StampImage item={b} size={80} rotate={5} />
        </Box>
        <Box position="absolute" left="252px" top="40px">
          <StampImage item={c} size={72} rotate={-3} />
        </Box>
        <Box position="absolute" left="70px" top="140px">
          <StampImage item={d} size={72} rotate={6} />
        </Box>
        <Box position="absolute" left="200px" top="148px">
          <StampImage item={e} size={72} rotate={-6} />
        </Box>
      </Box>
      <Flex direction="column" gap="12px">
        <Display size="64px" lineHeight="0.95">
          {t('intro-title', { year: data.year })}
        </Display>
        <Text fontSize="16px" lineHeight="1.45">
          {t('intro-text', {
            username: data.username,
            start: f.longDay(data.periodStart),
            end: f.longDay(data.periodEnd),
          })}
        </Text>
      </Flex>
    </>
  );
};

export const HoursSlide = ({ data, theme }: SlideProps) => {
  const t = useTranslations('RestockReview');
  const f = useReviewFormat();

  return (
    <>
      <Flex direction="column" gap="4px" mt="48px">
        <Text fontSize="18px" color={theme.muted}>
          {t('hours-before')}
        </Text>
        <Display size="120px" lineHeight="0.9" color={theme.accent}>
          {t('hours-value', { hours: f.number(data.hours) })}
        </Display>
        <Text fontSize="18px" color={theme.muted}>
          {t('hours-after')}
        </Text>
      </Flex>
      <Text fontSize="15px" lineHeight="1.45">
        {t('hours-text', { days: Math.floor(data.hours / 24) })}
      </Text>
      <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap="8px" mt="8px">
        <StatTile value={f.number(data.sessions)} label={t('sessions')} />
        <StatTile value={f.number(data.shops)} label={t('shops-visited')} />
        <StatTile value={f.number(data.refreshes)} label={t('refreshes')} />
      </Grid>
    </>
  );
};

export const ShopSlide = ({ data, theme }: SlideProps) => {
  const t = useTranslations('RestockReview');
  const f = useReviewFormat();
  const [top, ...others] = data.topShops;
  const name = shopName(top.id);

  return (
    <>
      <Eyebrow color={theme.accent}>{t('shop-eyebrow')}</Eyebrow>
      <Box
        borderRadius="14px"
        overflow="hidden"
        border={`2px solid ${COLORS.lime}`}
        bg={COLORS.cream}
      >
        <Image
          src={shopkeeperImage(top.id)}
          alt={t('shopkeeper-alt', { shop: name })}
          display="block"
          w="357px"
          h="119px"
        />
      </Box>
      <Display size="40px" lineHeight="1">
        {name}
      </Display>
      <Text fontSize="16px" lineHeight="1.45">
        {t.rich('shop-text', {
          hours: f.number(top.hours),
          share: f.percent(data.topShopShare * 100),
          b: (chunk) => (
            <Text as="strong" color={theme.accent}>
              {chunk}
            </Text>
          ),
        })}
      </Text>
      <Flex direction="column" gap="8px" mt="4px">
        {others.map((shop, i) => (
          <Flex
            key={shop.id}
            justify="space-between"
            align="center"
            p="10px 14px"
            borderRadius="10px"
            bg={COLORS.panel}
            fontSize="14px"
          >
            <Text>
              <Text as="span" color={theme.muted} mr="8px">
                {t('rank', { rank: i + 2 })}
              </Text>
              {shopName(shop.id)}
            </Text>
            <Text fontWeight={700}>{t('hours-value', { hours: f.number(shop.hours) })}</Text>
          </Flex>
        ))}
      </Flex>
    </>
  );
};

export const FavoriteSlide = ({ data, theme }: SlideProps) => {
  const t = useTranslations('RestockReview');
  const { item, count } = data.favorite;

  return (
    <>
      <Eyebrow color={theme.accent}>{t('favorite-eyebrow')}</Eyebrow>
      <Flex justify="center" align="center" h="240px">
        <Flex
          justify="center"
          align="center"
          w="220px"
          h="220px"
          borderRadius="50%"
          bg={COLORS.lime}
        >
          <StampImage item={item} size={100} rotate={-4} />
        </Flex>
      </Flex>
      <Display size="34px" textAlign="center">
        {item.name}
      </Display>
      <Flex justify="center" align="baseline" gap="10px">
        <Display size="72px" lineHeight="1" color={theme.accent}>
          {count}
        </Display>
        <Text fontSize="20px" fontWeight={500}>
          {t('favorite-times', { count })}
        </Text>
      </Flex>
      <Text fontSize="15px" lineHeight="1.45" textAlign="center" color={theme.muted}>
        {t('favorite-text')}
      </Text>
    </>
  );
};

export const TopBoughtSlide = ({ data, theme }: SlideProps) => {
  const t = useTranslations('RestockReview');
  const f = useReviewFormat();

  return (
    <>
      <Eyebrow color={theme.accent}>{t('top-eyebrow')}</Eyebrow>
      <Display size="36px">{t('top-title')}</Display>
      <Flex direction="column" gap="8px">
        {data.topBought.map((item, i) => (
          <Flex
            key={item.name}
            align="center"
            gap="12px"
            p="8px 12px 8px 8px"
            borderRadius="12px"
            bg={COLORS.panel}
          >
            <Box w="22px" textAlign="center">
              <Display size="20px" color={theme.accent}>
                {i + 1}
              </Display>
            </Box>
            <Image
              src={item.image}
              alt={item.name}
              w="48px"
              h="48px"
              borderRadius="8px"
              bg={COLORS.cream}
              p="3px"
            />
            <Text flex="1" fontSize="14px" fontWeight={500} lineHeight="1.25">
              {item.name}
            </Text>
            <Text fontSize="14px" fontWeight={700} whiteSpace="nowrap">
              {f.number(item.price)} NP
            </Text>
          </Flex>
        ))}
      </Flex>
      <Text fontSize="13px" color={theme.muted}>
        {t.rich('top-note', {
          value: f.number(data.totalBoughtValue),
          b: (chunk) => (
            <Text as="strong" color={theme.fg}>
              {chunk}
            </Text>
          ),
        })}
      </Text>
    </>
  );
};

export const FastestSlide = ({ data, theme }: SlideProps) => {
  const t = useTranslations('RestockReview');
  const f = useFormatter();
  const { item, shopId, seconds } = data.fastest;
  const formatSeconds = (value: number) => f.number(value, { maximumFractionDigits: 1 });

  return (
    <>
      <Eyebrow color={theme.accent}>{t('fastest-eyebrow')}</Eyebrow>
      <Flex align="baseline" gap="8px">
        <Text
          className={displayFont.className}
          fontWeight={800}
          fontSize="150px"
          lineHeight="0.85"
          letterSpacing="-0.05em"
        >
          {formatSeconds(seconds)}
        </Text>
        <Display size="48px">s</Display>
      </Flex>
      <Text fontSize="16px" lineHeight="1.45">
        {t.rich('fastest-text', { item: item.name, b: (chunk) => <strong>{chunk}</strong> })}
      </Text>
      <Flex
        direction="column"
        gap="10px"
        p="16px"
        borderRadius="14px"
        bg={COLORS.ink}
        color={COLORS.cream}
      >
        <Flex align="center" gap="12px">
          <Image
            src={item.image}
            alt={item.name}
            w="56px"
            h="56px"
            borderRadius="8px"
            bg={COLORS.cream}
            p="4px"
          />
          <Flex direction="column" gap="2px">
            <Text fontSize="15px" fontWeight={700}>
              {item.name}
            </Text>
            <Text fontSize="13px" color={COLORS.muted}>
              {shopName(shopId)} · {f.number(item.price)} NP
            </Text>
          </Flex>
        </Flex>
        <Flex align="center" gap="8px" fontSize="12px" color={COLORS.muted}>
          <Text>{t('fastest-appeared')}</Text>
          <Box flex="1" h="4px" borderRadius="2px" bg={COLORS.lime} />
          <Text>{t('fastest-bought')}</Text>
        </Flex>
      </Flex>
      <Text fontSize="14px" color={theme.muted}>
        {t('fastest-avg', { seconds: formatSeconds(data.avgReactionSeconds) })}
      </Text>
    </>
  );
};

export const LossSlide = ({ data, theme }: SlideProps) => {
  const t = useTranslations('RestockReview');
  const f = useReviewFormat();
  const item = data.biggestLoss;

  return (
    <>
      <Eyebrow color={theme.accent}>{t('loss-eyebrow')}</Eyebrow>
      <Display size="36px">{t('loss-title')}</Display>
      <Flex justify="center" align="center" h="200px" position="relative">
        <StampImage item={item} size={120} grayscale />
        <Text
          className={pixelFont.className}
          position="absolute"
          p="6px 14px"
          border={`3px solid ${theme.accent}`}
          borderRadius="6px"
          color={theme.accent}
          fontSize="22px"
          letterSpacing="0.08em"
          transform="rotate(-14deg)"
          bg="rgba(31, 20, 18, 0.85)"
        >
          {t('sold-out')}
        </Text>
      </Flex>
      <Flex direction="column" gap="2px" align="center">
        <Text fontSize="18px" fontWeight={700}>
          {item.name}
        </Text>
        <Display size="32px" color={theme.accent}>
          {f.number(item.price)} NP
        </Display>
      </Flex>
      <Text fontSize="15px" lineHeight="1.45" textAlign="center" color="#E2DDD0">
        {t.rich('loss-text', {
          count: data.lostCount,
          value: f.number(data.lostValue),
          b: (chunk) => (
            <Text as="strong" color={theme.fg}>
              {chunk}
            </Text>
          ),
        })}
      </Text>
    </>
  );
};

/** Splits the daily levels into calendar months (weeks start on Sunday). */
const buildMonths = (data: RestockReviewData) => {
  const months: { key: string; date: string; cells: ({ level: number; day: number } | null)[] }[] =
    [];

  data.daily.forEach((level, i) => {
    const iso = addDaysIso(data.periodStart, i);
    const key = iso.slice(0, 7);
    let month = months.at(-1);

    if (!month || month.key !== key) {
      const offset = new Date(`${iso}T12:00:00Z`).getUTCDay();
      month = { key, date: iso, cells: Array(offset).fill(null) };
      months.push(month);
    }

    month.cells.push({ level, day: i });
  });

  return months;
};

export const HeatmapSlide = ({ data, theme }: SlideProps) => {
  const t = useTranslations('RestockReview');
  const f = useReviewFormat();
  const format = useFormatter();
  const months = buildMonths(data);
  const streak = getLongestStreak(data.daily);
  const bestIndex = Math.round(
    (Date.parse(data.bestDay.date) - Date.parse(data.periodStart)) / 86400000
  );
  const active = data.daily.filter(Boolean).length;

  return (
    <>
      <Eyebrow color={theme.accent}>{t('heatmap-eyebrow')}</Eyebrow>
      <Display size="32px">{t('heatmap-title', { active, total: data.daily.length })}</Display>
      <Grid templateColumns="repeat(4, minmax(0, 1fr))" gap="12px 14px">
        {months.map((month) => (
          <Flex key={month.key} direction="column" gap="4px">
            <Text fontSize="11px" color={theme.muted}>
              {format.dateTime(new Date(`${month.date}T12:00:00Z`), {
                month: 'short',
                timeZone: 'UTC',
              })}
            </Text>
            <Grid templateColumns="repeat(7, 9px)" gap="2px">
              {month.cells.map((cell, i) =>
                cell ? (
                  <Box
                    key={i}
                    w="9px"
                    h="9px"
                    borderRadius="2px"
                    bg={COLORS.heat[cell.level]}
                    boxShadow={cell.day === bestIndex ? `0 0 0 2px ${COLORS.cream}` : undefined}
                  />
                ) : (
                  <Box key={i} w="9px" h="9px" />
                )
              )}
            </Grid>
          </Flex>
        ))}
      </Grid>
      <Flex align="center" gap="4px" fontSize="11px" color={theme.muted}>
        <Text>{t('less')}</Text>
        {COLORS.heat.map((color) => (
          <Box key={color} w="9px" h="9px" borderRadius="2px" bg={color} />
        ))}
        <Text>{t('more')}</Text>
      </Flex>
      <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="8px">
        <Flex direction="column" gap="4px" p="12px" borderRadius="12px" bg={COLORS.panel}>
          <Text fontSize="12px" color={theme.muted}>
            {t('streak-label')}
          </Text>
          <Display size="24px">{t('streak-value', { days: streak.length })}</Display>
          <Text fontSize="12px" color={theme.muted}>
            {t('date-range', {
              start: f.day(addDaysIso(data.periodStart, streak.start)),
              end: f.day(addDaysIso(data.periodStart, streak.end)),
            })}
          </Text>
        </Flex>
        <Flex direction="column" gap="4px" p="12px" borderRadius="12px" bg={COLORS.panel}>
          <Text fontSize="12px" color={theme.muted}>
            {t('best-day-label')}
          </Text>
          <Display size="24px">{f.longDay(data.bestDay.date)}</Display>
          <Text fontSize="12px" color={theme.muted}>
            {t('best-day-text', { value: f.number(data.bestDay.value) })}
          </Text>
        </Flex>
      </Grid>
    </>
  );
};

const PercentileBar = ({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: string;
  pct: number;
  color: string;
}) => (
  <Flex direction="column" gap="6px">
    <Flex justify="space-between" fontSize="14px">
      <Text>{label}</Text>
      <Text fontWeight={700}>{value}</Text>
    </Flex>
    <Box h="10px" borderRadius="5px" bg={COLORS.panel}>
      <Box w={`${pct}%`} h="10px" borderRadius="5px" bg={color} />
    </Box>
  </Flex>
);

export const CommunitySlide = ({ data, theme }: SlideProps) => {
  const t = useTranslations('RestockReview');
  const f = useReviewFormat();
  const { reaction, hours, shops } = data.percentiles;

  return (
    <>
      <Eyebrow color={theme.accent}>{t('community-eyebrow')}</Eyebrow>
      <Flex direction="column" gap="6px">
        <Display size="120px" lineHeight="0.9" color={theme.accent}>
          {f.percent(reaction)}
        </Display>
        <Text fontSize="17px" lineHeight="1.4">
          {t('community-text', { pct: f.percent(reaction), year: data.year })}
        </Text>
      </Flex>
      <Flex direction="column" gap="16px" mt="12px">
        <PercentileBar
          label={t('reaction-label')}
          value={t('faster-than', { pct: f.percent(reaction) })}
          pct={reaction}
          color={COLORS.lime}
        />
        <PercentileBar
          label={t('hours-label')}
          value={t('more-than', { pct: f.percent(hours) })}
          pct={hours}
          color={COLORS.heat[3]}
        />
        <PercentileBar
          label={t('shops-label')}
          value={t('more-than', { pct: f.percent(shops) })}
          pct={shops}
          color={COLORS.heat[3]}
        />
      </Flex>
      <Text fontSize="13px" color={theme.muted}>
        {t('community-note', {
          count: f.number(data.communitySize),
          start: f.day(data.periodStart),
          end: f.day(data.periodEnd),
        })}
      </Text>
    </>
  );
};

export const TypeSlide = ({ data, theme }: SlideProps) => {
  const t = useTranslations('RestockReview');
  const f = useReviewFormat();
  const shop = shopName(data.topShops[0].id);
  const otherTypes = RESTOCKER_TYPES.filter((type) => type !== data.type)
    .map((type) => t(`type-${type}`))
    .join(' · ');

  return (
    <>
      <Eyebrow color={theme.accent}>{t('type-eyebrow')}</Eyebrow>
      <Display size="72px" lineHeight="0.92">
        {t(`type-${data.type}`)}
      </Display>
      <Box
        p="10px"
        bg={COLORS.cream}
        border={`3px dashed ${COLORS.ink}`}
        borderRadius="6px"
        transform="rotate(-2deg)"
      >
        <Image
          src={shopkeeperImage(data.topShops[0].id)}
          alt={t('shopkeeper-alt', { shop })}
          display="block"
          w="100%"
          h="112px"
          objectFit="cover"
        />
      </Box>
      <Text fontSize="16px" lineHeight="1.45">
        {t('type-loyal-text', {
          share: f.percent(data.topShopShare * 100),
          shop,
          item: data.biggestLoss.name,
        })}
      </Text>
      <Flex wrap="wrap" gap="8px">
        <Chip>{t('chip-hours', { hours: f.number(data.topShops[0].hours), shop })}</Chip>
        <Chip>
          {t('chip-favorite', { count: data.favorite.count, item: data.favorite.item.name })}
        </Chip>
      </Flex>
      <Text fontSize="12px" color={theme.muted}>
        {t('other-types', { types: otherTypes })}
      </Text>
    </>
  );
};

const Chip = ({ children }: { children: ReactNode }) => (
  <Text
    p="8px 12px"
    borderRadius="999px"
    bg={COLORS.ink}
    color={COLORS.lime}
    fontSize="13px"
    fontWeight={700}
  >
    {children}
  </Text>
);
