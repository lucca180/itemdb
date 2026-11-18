'use client';

import { Box, Button, Flex, Grid, Image, Text } from '@chakra-ui/react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { ComponentType, ReactNode, Ref, useState } from 'react';
import {
  BOOK_QUIZ_START,
  GENERAL_REVIEW,
  GeneralReviewData,
  QUIZ_ORDER,
  QuizId,
  QuizOption,
  RankedItem,
  getResultTier,
} from './generalData';
import { SharePreview, useShareImage } from './ReviewShare';
import { Display, Eyebrow, StampImage, StatTile, useReviewFormat } from './ReviewSlides';
import {
  COLORS,
  SlideTheme,
  SlideThemeColors,
  bodyFont,
  displayFont,
  pixelFont,
} from './reviewTheme';
import { Story, StoriesPlayer } from './StoriesPlayer';

type GeneralSlideProps = {
  data: GeneralReviewData;
  theme: SlideThemeColors;
};

type Answers = Partial<Record<QuizId, number>>;

const LOGO = '/logo_icon.svg';

// Neopets players write 984k, 1.5m and 2b, not "984 mil" or "1,5 mi" like Intl's compact notation
const COMPACT_UNITS: Record<'pt' | 'en', [number, string][]> = {
  pt: [
    [1e12, ' tri'],
    [1e9, ' bi'],
    [1e6, 'm'],
    [1e3, 'k'],
  ],
  en: [
    [1e12, 't'],
    [1e9, 'b'],
    [1e6, 'm'],
    [1e3, 'k'],
  ],
};

const useGeneralFormat = () => {
  const format = useFormatter();
  const locale = useLocale();
  const base = useReviewFormat();
  const units = COMPACT_UNITS[locale.startsWith('pt') ? 'pt' : 'en'];

  const compactWith = (value: number, maximumFractionDigits: number) => {
    const unit = units.find(([size]) => Math.abs(value) >= size);
    if (!unit) return format.number(value, { maximumFractionDigits: 0 });
    const scaled = value / unit[0];
    // 984k reads better than 984.2k; decimals only help below 100 (1.1m, 28.4 bi)
    const digits = Math.abs(scaled) >= 100 ? 0 : maximumFractionDigits;
    return `${format.number(scaled, { maximumFractionDigits: digits })}${unit[1]}`;
  };

  return {
    ...base,
    compact: (value: number) => compactWith(value, 1),
    compactInt: (value: number) => compactWith(value, 0),
    signedPercent: (value: number) =>
      format.number(value / 100, {
        style: 'percent',
        maximumFractionDigits: 0,
        signDisplay: 'exceptZero',
      }),
  };
};

const Bold = ({ children, color }: { children: ReactNode; color?: string }) => (
  <Text as="strong" color={color}>
    {children}
  </Text>
);

const ItemThumb = ({ src, alt, size = 40 }: { src: string; alt: string; size?: number }) => (
  <Image
    src={src}
    alt={alt}
    w={`${size}px`}
    h={`${size}px`}
    flexShrink={0}
    borderRadius="8px"
    bg={COLORS.cream}
    p="3px"
  />
);

/** Ranked list with rank, image, name and a value label. */
const RankList = ({
  items,
  theme,
  label,
  rowBg,
}: {
  items: RankedItem[];
  theme: SlideThemeColors;
  label: (row: RankedItem) => string;
  rowBg: string;
}) => (
  <Flex direction="column" gap="7px">
    {items.map((row, i) => (
      <Flex
        key={row.item.name}
        align="center"
        gap="10px"
        p="6px 12px 6px 6px"
        borderRadius="12px"
        bg={rowBg}
      >
        <Box w="20px" textAlign="center">
          <Display size="18px" color={theme.accent}>
            {i + 1}
          </Display>
        </Box>
        <ItemThumb src={row.item.image} alt={row.item.name} />
        <Text flex="1" fontSize="13px" fontWeight={500} lineHeight="1.2">
          {row.item.name}
        </Text>
        <Text fontSize="12px" fontWeight={700} whiteSpace="nowrap">
          {label(row)}
        </Text>
      </Flex>
    ))}
  </Flex>
);

const lightRow = 'rgba(15, 31, 24, 0.08)';

export const GeneralIntroSlide = ({ data }: GeneralSlideProps) => {
  const t = useTranslations('ReviewGeneral');
  const f = useGeneralFormat();
  const [a, b, c, d, e] = [
    data.quizzes.drop.options[0].item!,
    data.bookRush.examples[0].item,
    data.mostWanted[0].item,
    data.quizzes.rise.options[0].item!,
    data.openables[0].item,
  ];

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
          {t('intro-text', { date: f.longDay(data.dataUntil), count: QUIZ_ORDER.length })}
        </Text>
      </Flex>
    </>
  );
};

export const GeneralNumbersSlide = ({ data, theme }: GeneralSlideProps) => {
  const t = useTranslations('ReviewGeneral');
  const f = useGeneralFormat();
  const { totals } = data;

  return (
    <>
      <Eyebrow color={theme.accent}>{t('numbers-eyebrow')}</Eyebrow>
      <Display size="44px">{t('numbers-title')}</Display>
      <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="8px">
        <StatTile value={f.compact(totals.priceUpdates)} label={t('stat-price-updates')} />
        <StatTile value={f.compact(totals.auctionsSeen)} label={t('stat-auctions')} />
        <StatTile value={f.compact(totals.trades)} label={t('stat-trades')} />
        <StatTile value={f.compact(totals.searches)} label={t('stat-searches')} />
        <StatTile value={f.compact(totals.openings)} label={t('stat-openings')} />
        <StatTile value={f.compact(totals.listItems)} label={t('stat-list-items')} />
      </Grid>
      <Text fontSize="15px" lineHeight="1.45">
        {t.rich('numbers-note', {
          count: f.number(totals.newAccounts),
          b: (chunk) => <Bold color={theme.accent}>{chunk}</Bold>,
        })}
      </Text>
    </>
  );
};

export const GeneralViewedSlide = ({ data, theme }: GeneralSlideProps) => {
  const t = useTranslations('ReviewGeneral');
  const f = useGeneralFormat();

  return (
    <>
      <Eyebrow color={theme.accent}>{t('viewed-eyebrow')}</Eyebrow>
      <Display size="34px">{t('viewed-title')}</Display>
      <RankList
        items={data.mostViewed}
        theme={theme}
        rowBg={COLORS.panel}
        label={(row) => t('viewed-value', { count: f.number(row.value) })}
      />
      <Text fontSize="13px" color={theme.muted}>
        {t('viewed-note', { date: f.longDay(data.viewsSince) })}
      </Text>
    </>
  );
};

export const GeneralOpenablesSlide = ({ data, theme }: GeneralSlideProps) => {
  const t = useTranslations('ReviewGeneral');
  const f = useGeneralFormat();

  return (
    <>
      <Eyebrow color={theme.accent}>{t('openables-eyebrow')}</Eyebrow>
      <Display size="34px">{t('openables-title')}</Display>
      <RankList
        items={data.openables}
        theme={theme}
        rowBg={lightRow}
        label={(row) => t('openables-value', { count: f.number(row.value) })}
      />
      <Text fontSize="13px" color={theme.muted}>
        {t.rich('openables-note', {
          count: f.number(data.totals.openings),
          b: (chunk) => <Bold color={theme.fg}>{chunk}</Bold>,
        })}
      </Text>
    </>
  );
};

export const GeneralNcSlide = ({ data, theme }: GeneralSlideProps) => {
  const t = useTranslations('ReviewGeneral');
  const f = useGeneralFormat();

  return (
    <>
      <Eyebrow color={theme.accent}>{t('nc-eyebrow')}</Eyebrow>
      <Display size="34px">{t('nc-title')}</Display>
      <RankList
        items={data.ncTraded}
        theme={theme}
        rowBg={COLORS.panel}
        label={(row) => t('nc-value', { count: f.number(row.value) })}
      />
      <Text fontSize="13px" color={theme.muted}>
        {t('nc-note', { year: data.year })}
      </Text>
    </>
  );
};

export const GeneralWantedSlide = ({ data, theme }: GeneralSlideProps) => {
  const t = useTranslations('ReviewGeneral');
  const f = useGeneralFormat();

  return (
    <>
      <Eyebrow color={theme.accent}>{t('wanted-eyebrow')}</Eyebrow>
      <Display size="34px">{t('wanted-title')}</Display>
      <RankList
        items={data.mostWanted}
        theme={theme}
        rowBg={COLORS.panel}
        label={(row) => t('wanted-value', { count: f.number(row.value) })}
      />
      <Text fontSize="13px" color={theme.muted}>
        {t('wanted-note', { lists: f.number(data.totals.lists), year: data.year })}
      </Text>
    </>
  );
};

export const GeneralAuctionsSlide = ({ data, theme }: GeneralSlideProps) => {
  const t = useTranslations('ReviewGeneral');
  const f = useGeneralFormat();
  const { auctions } = data;

  return (
    <>
      <Eyebrow color={theme.accent}>{t('auctions-eyebrow')}</Eyebrow>
      <Box whiteSpace="nowrap">
        <Display size="64px" lineHeight="0.95" color={theme.accent}>
          {f.compact(auctions.np)} NP
        </Display>
      </Box>
      <Text fontSize="15px" lineHeight="1.45">
        {t.rich('auctions-text', {
          sold: f.number(auctions.sold),
          items: f.number(auctions.items),
          b: (chunk) => <Bold color={theme.accent}>{chunk}</Bold>,
        })}
      </Text>
      <RankList
        items={auctions.top}
        theme={theme}
        rowBg={COLORS.panel}
        label={(row) => `${f.compact(row.value)} NP`}
      />
      <Flex direction="column" gap="8px" p="12px" borderRadius="12px" bg={COLORS.panel}>
        <Text fontSize="13px" lineHeight="1.4">
          {t.rich('auctions-capped', {
            count: auctions.cappedCount,
            value: f.number(2147483647),
            b: (chunk) => <Bold color={theme.accent}>{chunk}</Bold>,
          })}
        </Text>
        <Flex gap="6px">
          {auctions.capped.map((item) => (
            <ItemThumb key={item.name} src={item.image} alt={item.name} size={36} />
          ))}
        </Flex>
      </Flex>
    </>
  );
};

// the zero line sits near the right edge: almost every category went down
const ZERO_AT = 80;
const SCALE_MAX = 75;

const InflationBar = ({
  value,
  color,
  height,
}: {
  value: number;
  color: string;
  height: string;
}) => {
  const width = (Math.min(Math.abs(value), SCALE_MAX) / SCALE_MAX) * ZERO_AT;

  return (
    <Box position="relative" h={height}>
      <Box
        position="absolute"
        top={0}
        h={height}
        borderRadius="3px"
        bg={color}
        left={value < 0 ? `${ZERO_AT - width}%` : `${ZERO_AT}%`}
        w={`${Math.max(width, 0.8)}%`}
      />
    </Box>
  );
};

export const GeneralInflationSlide = ({ data, theme }: GeneralSlideProps) => {
  const t = useTranslations('ReviewGeneral');
  const f = useGeneralFormat();

  return (
    <>
      <Eyebrow color={theme.accent}>{t('inflation-eyebrow', { year: data.year })}</Eyebrow>
      <Display size="34px">{t('inflation-title')}</Display>
      <Flex gap="14px" fontSize="11px" color={theme.muted}>
        <Flex align="center" gap="6px">
          <Box w="12px" h="8px" borderRadius="2px" bg={theme.accent} />
          {t('inflation-typical')}
        </Flex>
        <Flex align="center" gap="6px">
          <Box w="12px" h="5px" borderRadius="2px" bg={COLORS.coral} />
          {t('inflation-expensive')}
        </Flex>
      </Flex>
      <Flex direction="column" gap="14px" position="relative">
        <Box
          position="absolute"
          top="-4px"
          bottom="-4px"
          left={`${ZERO_AT}%`}
          w="1px"
          bg={theme.track}
        />
        {data.inflation.map((row) => (
          <Flex key={row.category} direction="column" gap="4px">
            <Flex justify="space-between" fontSize="13px">
              <Text fontWeight={500}>{t(`category-${row.category}`)}</Text>
              <Text>
                <Text as="span" fontWeight={700}>
                  {f.signedPercent(row.typical)}
                </Text>
                <Text as="span" color={COLORS.coral} ml="8px">
                  {f.signedPercent(row.expensive)}
                </Text>
              </Text>
            </Flex>
            <InflationBar value={row.typical} color={theme.accent} height="8px" />
            <InflationBar value={row.expensive} color={COLORS.coral} height="5px" />
          </Flex>
        ))}
      </Flex>
      <Text fontSize="12px" color={theme.muted} lineHeight="1.4">
        {t('inflation-note')}
      </Text>
    </>
  );
};

export const GeneralStampAlbumSlide = ({ data, theme }: GeneralSlideProps) => {
  const t = useTranslations('ReviewGeneral');
  const f = useGeneralFormat();
  const album = data.stampAlbum;
  const pct = f.percent(Math.round((1 - album.end / album.start) * 100));

  return (
    <>
      <Eyebrow color={theme.accent}>{t('album-eyebrow')}</Eyebrow>
      <Box whiteSpace="nowrap">
        <Display size="110px" lineHeight="0.85">
          −{pct}
        </Display>
      </Box>
      <Display size="28px">{t('album-title', { pct, count: f.number(album.items) })}</Display>
      <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="8px">
        {[
          { label: t('album-from'), value: album.start },
          { label: t('album-to'), value: album.end },
        ].map((stat) => (
          <Flex
            key={stat.label}
            direction="column"
            gap="4px"
            p="12px"
            borderRadius="12px"
            bg={COLORS.ink}
            color={COLORS.cream}
          >
            <Text fontSize="12px" color={COLORS.muted}>
              {stat.label}
            </Text>
            <Display size="24px">{f.compact(stat.value)} NP</Display>
          </Flex>
        ))}
      </Grid>
      <Flex align="center" gap="10px" p="10px 12px" borderRadius="12px" bg="rgba(15, 31, 24, 0.1)">
        <ItemThumb src={album.unpricedExample.image} alt={album.unpricedExample.name} size={44} />
        <Text fontSize="13px" lineHeight="1.4">
          {t.rich('album-unpriced', {
            count: album.unpriced,
            item: album.unpricedExample.name,
            value: f.compact(album.unpricedExampleAuction),
            b: (chunk) => <strong>{chunk}</strong>,
          })}
        </Text>
      </Flex>
      <Text fontSize="11px" color={theme.muted} lineHeight="1.4">
        {t('album-note', { count: f.number(album.priced) })}
      </Text>
    </>
  );
};

export const GeneralQuestLogSlide = ({ data, theme }: GeneralSlideProps) => {
  const t = useTranslations('ReviewGeneral');
  const f = useGeneralFormat();
  const { questLog } = data;

  return (
    <>
      <Eyebrow color={theme.accent}>{t('questlog-eyebrow')}</Eyebrow>
      <Box whiteSpace="nowrap">
        <Display size="110px" lineHeight="0.85" color={theme.accent}>
          {f.signedPercent(questLog.medianChange)}
        </Display>
      </Box>
      <Text fontSize="16px" lineHeight="1.45">
        {t.rich('questlog-text', {
          b: (chunk) => <Bold color={theme.accent}>{chunk}</Bold>,
        })}
      </Text>
      <Flex direction="column" gap="8px">
        {questLog.examples.map(({ item, start, end }) => (
          <Flex
            key={item.name}
            align="center"
            gap="10px"
            p="8px 12px 8px 8px"
            borderRadius="12px"
            bg="rgba(243, 240, 230, 0.08)"
          >
            <ItemThumb src={item.image} alt={item.name} size={40} />
            <Flex direction="column" flex="1" gap="2px">
              <Text fontSize="13px" fontWeight={700} lineHeight="1.2">
                {item.name}
              </Text>
              <Text fontSize="12px" color={theme.muted}>
                {t('questlog-before-after', { start: f.compact(start), end: f.compact(end) })}
              </Text>
            </Flex>
          </Flex>
        ))}
      </Flex>
      <Text fontSize="12px" color={theme.muted} lineHeight="1.4">
        {t('questlog-note', {
          entries: f.number(questLog.entries),
          pools: questLog.pools,
          year: data.year,
          count: questLog.notDropped,
        })}
      </Text>
    </>
  );
};

export const GeneralBookRushSlide = ({ data, theme }: GeneralSlideProps) => {
  const t = useTranslations('ReviewGeneral');
  const f = useGeneralFormat();
  const { bookRush } = data;

  return (
    <>
      <Eyebrow color={theme.accent}>{t('books-eyebrow')}</Eyebrow>
      <Display size="64px" lineHeight="0.92">
        {f.day(bookRush.updateDate)}
      </Display>
      <Text fontSize="16px" lineHeight="1.45">
        {t.rich('books-text', {
          date: f.longDay(bookRush.updateDate),
          count: f.number(bookRush.books),
          b: (chunk) => <Bold color={theme.accent}>{chunk}</Bold>,
        })}
      </Text>
      <Flex direction="column" gap="8px">
        {bookRush.examples.map(({ item, start, end }) => (
          <Flex
            key={item.name}
            align="center"
            gap="10px"
            p="8px 12px 8px 8px"
            borderRadius="12px"
            bg={lightRow}
          >
            <ItemThumb src={item.image} alt={item.name} size={44} />
            <Flex direction="column" flex="1" gap="2px">
              <Text fontSize="14px" fontWeight={700} lineHeight="1.2">
                {item.name}
              </Text>
              <Text fontSize="12px" color={theme.muted}>
                {f.compact(start)} → {f.compact(end)} NP
              </Text>
            </Flex>
            <Text
              className={displayFont.className}
              fontWeight={800}
              fontSize="20px"
              color={theme.accent}
            >
              ×{f.number(Math.round(end / start))}
            </Text>
          </Flex>
        ))}
      </Flex>
      <Text fontSize="12px" color={theme.muted}>
        {t('books-note', { date: f.longDay(data.finalCutoff) })}
      </Text>
    </>
  );
};

type QuizSlideProps = GeneralSlideProps & {
  id: QuizId;
  picked?: number;
  onPick: (index: number) => void;
};

export const QuizSlide = ({ data, theme, id, picked, onPick }: QuizSlideProps) => {
  const t = useTranslations('ReviewGeneral');
  const f = useGeneralFormat();
  const quiz = data.quizzes[id];
  const answer = quiz.options[0];
  const revealed = picked !== undefined;
  const current = QUIZ_ORDER.indexOf(id) + 1;

  const optionLabel = (option: QuizOption) =>
    option.item ? option.item.name : `${f.compact(option.value ?? 0)} NP`;

  const optionDetail = (option: QuizOption) => {
    if (id === 'rise' || id === 'drop') {
      const start = option.start ?? 0;
      const end = option.end ?? 0;
      return `${f.compact(start)} → ${f.compact(end)} NP (${f.signedPercent(((end - start) / start) * 100)})`;
    }
    if (id === 'viewed') return t('viewed-value', { count: f.number(option.value ?? 0) });
    if (id === 'opened') return t('openables-value', { count: f.number(option.value ?? 0) });
    if (id === 'auction') return `${f.compact(option.value ?? 0)} NP`;
    return null;
  };

  const rich = {
    item: answer.item?.name ?? '',
    value: f.number(answer.value ?? 0),
    compact: f.compact(answer.value ?? 0),
    count: f.number(answer.count ?? 0),
    start: f.compact(answer.start ?? BOOK_QUIZ_START),
    end: f.compact(answer.end ?? answer.value ?? 0),
    pct: f.signedPercent((((answer.end ?? 0) - (answer.start ?? 0)) / (answer.start || 1)) * 100),
    b: (chunk: ReactNode) => <strong>{chunk}</strong>,
  };

  return (
    <>
      <Eyebrow color={theme.accent}>
        {t('quiz-eyebrow', { current, total: QUIZ_ORDER.length })}
      </Eyebrow>
      <Display size="28px" lineHeight="1.1">
        {t(`quiz-${id}-title`, {
          year: data.year,
          start: f.compact(BOOK_QUIZ_START),
        })}
      </Display>
      {id === 'books' && (
        <Flex align="center" gap="10px">
          <ItemThumb src={data.bookRush.examples[0].item.image} alt="" size={48} />
          <Text fontSize="14px" fontWeight={700}>
            {data.bookRush.examples[0].item.name}
          </Text>
        </Flex>
      )}
      <Flex direction="column" gap="8px">
        {quiz.order.map((i) => {
          const option = quiz.options[i];
          const isAnswer = i === 0;
          const isPicked = picked === i;
          const highlight = revealed && isAnswer;
          const detail = revealed ? optionDetail(option) : null;

          return (
            <Button
              key={i}
              h="auto"
              minH="52px"
              p={option.item ? '6px 12px 6px 6px' : '6px 14px'}
              borderRadius="12px"
              justifyContent="flex-start"
              gap="10px"
              whiteSpace="normal"
              textAlign="left"
              bg={highlight ? theme.accent : theme.track}
              color={highlight ? theme.bg : theme.fg}
              opacity={revealed && !isAnswer && !isPicked ? 0.6 : 1}
              border="2px solid"
              borderColor={revealed && isPicked && !isAnswer ? theme.fg : 'transparent'}
              disabled={revealed}
              _disabled={{ cursor: 'default' }}
              onClick={() => onPick(i)}
            >
              {option.item && <ItemThumb src={option.item.image} alt="" />}
              <Flex direction="column" flex="1" gap="2px">
                <Text fontSize="14px" fontWeight={700} lineHeight="1.2">
                  {optionLabel(option)}
                </Text>
                {detail && (
                  <Text fontSize="12px" fontWeight={500}>
                    {detail}
                  </Text>
                )}
              </Flex>
              {revealed && (isAnswer || isPicked) && (
                <Text fontSize="18px" fontWeight={700}>
                  {isAnswer ? '✓' : '✗'}
                </Text>
              )}
            </Button>
          );
        })}
      </Flex>
      {revealed ? (
        <Text fontSize="14px" lineHeight="1.45">
          <Text as="span" fontWeight={700}>
            {picked === 0 ? t('quiz-right') : t('quiz-wrong')}
          </Text>{' '}
          {t.rich(`quiz-${id}-answer`, rich)}
        </Text>
      ) : (
        <Text fontSize="13px" color={theme.muted}>
          {t('quiz-hint')}
        </Text>
      )}
    </>
  );
};

const useScore = (answers: Answers) => {
  const score = QUIZ_ORDER.filter((id) => answers[id] === 0).length;
  const answered = QUIZ_ORDER.filter((id) => answers[id] !== undefined).length;
  const tier = getResultTier(score, QUIZ_ORDER.length);
  return { score, answered, total: QUIZ_ORDER.length, tier };
};

export const GeneralResultSlide = ({
  data,
  theme,
  answers,
}: GeneralSlideProps & { answers: Answers }) => {
  const t = useTranslations('ReviewGeneral');
  const { score, answered, total, tier } = useScore(answers);

  return (
    <>
      <Eyebrow color={theme.accent}>{t('result-eyebrow')}</Eyebrow>
      <Flex align="baseline" gap="8px">
        <Text
          className={displayFont.className}
          fontWeight={800}
          fontSize="150px"
          lineHeight="0.85"
          letterSpacing="-0.05em"
        >
          {score}
        </Text>
        <Display size="48px">/{total}</Display>
      </Flex>
      <Text fontSize="16px">{t('result-score', { score, total })}</Text>
      <Text
        className={pixelFont.className}
        fontSize="13px"
        letterSpacing="0.06em"
        color={theme.muted}
        mt="12px"
      >
        {t('result-you-are')}
      </Text>
      <Display size="52px" lineHeight="0.95">
        {t(`tier-${tier}`)}
      </Display>
      <Text fontSize="16px" lineHeight="1.45">
        {t(`tier-${tier}-text`, { year: data.year })}
      </Text>
      {answered < total && (
        <Text fontSize="13px" color={theme.muted}>
          {t('result-skipped', { count: total - answered })}
        </Text>
      )}
    </>
  );
};

/** The 1080x1920 story image of the General chapter, drawn at 405x720. */
export const GeneralShareCard = ({
  data,
  answers,
  innerRef,
}: {
  data: GeneralReviewData;
  answers: Answers;
  innerRef?: Ref<HTMLDivElement>;
}) => {
  const t = useTranslations('ReviewGeneral');
  const f = useGeneralFormat();
  const { score, total, tier } = useScore(answers);
  const album = Math.round((1 - data.stampAlbum.end / data.stampAlbum.start) * 100);

  const facts = [
    { label: t('story-auctions'), value: `${f.compact(data.auctions.np)} NP` },
    { label: t('story-album'), value: `−${f.percent(album)}` },
    { label: t('story-questlog'), value: f.signedPercent(data.questLog.medianChange) },
  ];

  return (
    <Flex
      ref={innerRef}
      className={bodyFont.className}
      w="405px"
      h="720px"
      p="28px 26px"
      direction="column"
      gap="16px"
      bg={COLORS.lime}
      color={COLORS.ink}
      overflow="hidden"
    >
      <Flex align="center" gap="8px">
        <Image src={LOGO} alt="" w="26px" h="26px" />
        <Text className={pixelFont.className} fontSize="12px" letterSpacing="0.06em">
          {t('brand', { year: data.year })}
        </Text>
      </Flex>
      <Text className={pixelFont.className} fontSize="12px" letterSpacing="0.06em" mt="16px">
        {t('story-quiz', { year: data.year })}
      </Text>
      <Flex align="baseline" gap="6px">
        <Text
          className={displayFont.className}
          fontWeight={800}
          fontSize="170px"
          lineHeight="0.8"
          letterSpacing="-0.05em"
        >
          {score}
        </Text>
        <Text className={displayFont.className} fontWeight={800} fontSize="56px">
          /{total}
        </Text>
      </Flex>
      <Text
        className={displayFont.className}
        fontWeight={800}
        fontSize="46px"
        lineHeight="0.95"
        letterSpacing="-0.02em"
      >
        {t(`tier-${tier}`)}
      </Text>
      <Text fontSize="15px" lineHeight="1.4" color="#2E3F36">
        {t('story-challenge')}
      </Text>
      <Box flex="1" />
      <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap="8px">
        {facts.map((fact) => (
          <Flex
            key={fact.label}
            direction="column"
            gap="4px"
            p="10px"
            borderRadius="12px"
            bg={COLORS.ink}
            color={COLORS.cream}
          >
            <Text fontSize="10px" color={COLORS.muted} lineHeight="1.2">
              {fact.label}
            </Text>
            <Text className={displayFont.className} fontWeight={800} fontSize="20px" lineHeight="1">
              {fact.value}
            </Text>
          </Flex>
        ))}
      </Grid>
      <Flex
        align="center"
        justify="space-between"
        pt="12px"
        borderTop="1px solid rgba(15, 31, 24, 0.2)"
      >
        <Text fontSize="14px" fontWeight={700}>
          itemdb.com.br
        </Text>
        <Text fontSize="12px" color="#2E3F36">
          {t('story-until', { date: f.day(data.dataUntil) })}
        </Text>
      </Flex>
    </Flex>
  );
};

export const GeneralShareSlide = ({
  data,
  theme,
  answers,
  onNextChapter,
}: GeneralSlideProps & { answers: Answers; onNextChapter?: () => void }) => {
  const t = useTranslations('ReviewGeneral');
  const share = useShareImage({
    fileName: `itemdb-review-${data.year}.png`,
    title: t('seo-title', { year: data.year }),
    text: t('share-text', { year: data.year }),
  });

  return (
    <>
      <Text
        className={displayFont.className}
        fontWeight={800}
        fontSize="28px"
        lineHeight="1.05"
        mt="4px"
      >
        {t('share-title')}
      </Text>
      <SharePreview share={share}>
        <GeneralShareCard data={data} answers={answers} innerRef={share.cardRef} />
      </SharePreview>
      {onNextChapter && (
        <Button
          minH="48px"
          borderRadius="12px"
          bg={COLORS.panel}
          color={COLORS.cream}
          justifyContent="space-between"
          fontWeight={400}
          onClick={onNextChapter}
        >
          <Text as="span">
            {t.rich('next-chapter', { b: (chunk) => <strong>{chunk}</strong> })}
          </Text>
          <Text as="span" color={theme.accent}>
            →
          </Text>
        </Button>
      )}
    </>
  );
};

type Step =
  | { kind: 'slide'; theme: SlideTheme; Slide: ComponentType<GeneralSlideProps> }
  | { kind: 'quiz'; theme: SlideTheme; id: QuizId }
  | { kind: 'result'; theme: SlideTheme }
  | { kind: 'share'; theme: SlideTheme };

// each quiz comes right before the slide that answers it
const STEPS: Step[] = [
  { kind: 'slide', theme: 'lime', Slide: GeneralIntroSlide },
  { kind: 'slide', theme: 'dark', Slide: GeneralNumbersSlide },
  { kind: 'quiz', theme: 'cream', id: 'viewed' },
  { kind: 'slide', theme: 'dark', Slide: GeneralViewedSlide },
  { kind: 'quiz', theme: 'lime', id: 'opened' },
  { kind: 'slide', theme: 'cream', Slide: GeneralOpenablesSlide },
  { kind: 'slide', theme: 'dark', Slide: GeneralNcSlide },
  { kind: 'slide', theme: 'dark', Slide: GeneralWantedSlide },
  { kind: 'quiz', theme: 'cream', id: 'auction' },
  { kind: 'slide', theme: 'dark', Slide: GeneralAuctionsSlide },
  { kind: 'slide', theme: 'dark', Slide: GeneralInflationSlide },
  { kind: 'slide', theme: 'lime', Slide: GeneralStampAlbumSlide },
  { kind: 'slide', theme: 'loss', Slide: GeneralQuestLogSlide },
  { kind: 'quiz', theme: 'lime', id: 'books' },
  { kind: 'slide', theme: 'cream', Slide: GeneralBookRushSlide },
  { kind: 'quiz', theme: 'lime', id: 'rise' },
  { kind: 'quiz', theme: 'loss', id: 'drop' },
  { kind: 'result', theme: 'lime' },
  { kind: 'share', theme: 'dark' },
];

export const GENERAL_SLIDE_COUNT = STEPS.length;

type GeneralStoriesProps = {
  data?: GeneralReviewData;
  onExit?: () => void;
  onNextChapter?: () => void;
};

export const GeneralStories = ({
  data = GENERAL_REVIEW,
  onExit,
  onNextChapter,
}: GeneralStoriesProps) => {
  const t = useTranslations('ReviewGeneral');
  const f = useReviewFormat();
  // lives here so answers survive going back and forth between slides
  const [answers, setAnswers] = useState<Answers>({});

  const stories: Story[] = STEPS.map((step) => ({
    theme: step.theme,
    render: (colors: SlideThemeColors) => {
      if (step.kind === 'quiz')
        return (
          <QuizSlide
            data={data}
            theme={colors}
            id={step.id}
            picked={answers[step.id]}
            onPick={(index) => setAnswers((prev) => ({ ...prev, [step.id]: index }))}
          />
        );
      if (step.kind === 'result')
        return <GeneralResultSlide data={data} theme={colors} answers={answers} />;
      if (step.kind === 'share')
        return (
          <GeneralShareSlide
            data={data}
            theme={colors}
            answers={answers}
            onNextChapter={onNextChapter}
          />
        );
      const { Slide } = step;
      return <Slide data={data} theme={colors} />;
    },
  }));

  return (
    <StoriesPlayer
      brand={t('brand', { year: data.year })}
      notice={t('demo-notice', { date: f.day(data.dataUntil) })}
      onExit={onExit}
      stories={stories}
    />
  );
};
