'use client';

import {
  Accordion,
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Image as ChakraImg,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import Color from 'color';
import { useFormatter, useTranslations } from 'next-intl';
import { createContext, Fragment, useContext, useState } from 'react';
import type { UserList, WP_Article } from '@types';
import MainLink from '@components/Utils/MainLink';
import Image from '@components/Utils/Image';
import { BreadcrumbsView } from '@components/Breadcrumbs/BreadcrumbsView';
import { getListLink } from '@utils/list/listLink';
import icon from '@assets/logo_icon.svg';
import type {
  ListLabel,
  OfficialCategoryConfig,
  SectionId,
} from '@app/[locale]/lists/official/_categories/types';
import {
  matches,
  resolveSections,
  type EditionGroup,
  type ResolvedCategory,
} from '@app/[locale]/lists/official/_categories/resolve';

type Props = {
  locale: string;
  config: OfficialCategoryConfig;
  lists: UserList[];
  resolved: ResolvedCategory;
  related: WP_Article[];
};

// ---------- helpers ----------

const LabelsCtx = createContext<ListLabel[]>([]);

const useListLabels = (list: UserList) =>
  useContext(LabelsCtx).filter((l) => matches(list, l.match));

const rgba = (hex: string, a: number) => {
  const [r, g, b] = Color(hex).rgb().round().array();
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

const listColor = (list: UserList, fallback: string) => list.colorHex || fallback;

const ListLink = ({
  list,
  children,
  ...rest
}: { list: UserList; children: React.ReactNode } & any) => (
  <Link asChild _hover={{ textDecoration: 'none' }} display="block" {...rest}>
    <MainLink href={getListLink(list)} prefetch={false}>
      {children}
    </MainLink>
  </Link>
);

const Cover = ({
  list,
  size,
  radius = 'lg',
}: {
  list: UserList;
  size: string;
  radius?: string;
}) => (
  <Flex
    w={size}
    h={size}
    flex="0 0 auto"
    borderRadius={radius}
    overflow="hidden"
    bg={rgba(list.colorHex || '#4A5568', 0.6)}
    alignItems="center"
    justifyContent="center"
  >
    {list.coverURL ? (
      <ChakraImg src={list.coverURL} alt="" w="100%" h="100%" objectFit="cover" />
    ) : (
      <Image src={icon} width={32} style={{ opacity: 0.8 }} alt="" />
    )}
  </Flex>
);

const usePeriod = () => {
  const format = useFormatter();
  const t = useTranslations('OfficialCategory');
  return (start?: string | null, end?: string | null) => {
    const s = start ? new Date(start) : null;
    const e = end ? new Date(end) : null;
    const md = { month: 'short', day: 'numeric', timeZone: 'UTC' } as const;
    const mdy = { ...md, year: 'numeric' } as const;
    if (s && e) {
      const sameYear = s.getUTCFullYear() === e.getUTCFullYear();
      return `${format.dateTime(s, sameYear ? md : mdy)} – ${format.dateTime(e, mdy)}`;
    }
    if (s) return t('since', { date: format.dateTime(s, mdy) });
    return null;
  };
};

const getStats = (lists: UserList[]) => ({
  lists: lists.length,
  items: lists.reduce((acc, l) => acc + (l.itemCount ?? 0), 0),
});

// ---------- page ----------

export function OfficialCategoryClient(props: Props) {
  const { config, resolved } = props;
  const t = useTranslations('OfficialCategory');
  const accent = config.color;
  const sections = resolveSections(config);
  const hasFeatured =
    resolved.type === 'tracks' ||
    (resolved.type === 'editions' && !!resolved.latest) ||
    (resolved.type === 'groups' &&
      resolved.featured.lists.length + resolved.featured.popular.length > 0);
  // Featured cards only overlap the hero when they come right after it.
  const overlap = hasFeatured && sections[0] === 'featured';

  const render = (id: SectionId, index: number): React.ReactNode => {
    switch (id) {
      case 'featured':
        if (!hasFeatured) return null;
        return (
          <Box
            mt={overlap && index === 0 ? { base: -16, md: -20 } : 12}
            position="relative"
            zIndex={1}
          >
            {resolved.type === 'tracks' && <NowTracks resolved={resolved} accent={accent} />}
            {resolved.type === 'editions' && resolved.latest && (
              <LatestEdition edition={resolved.latest} accent={accent} />
            )}
            {resolved.type === 'groups' && (
              <NowGrid
                cards={[
                  ...resolved.featured.lists.map((list) => ({
                    list,
                    label: resolved.featured.label,
                  })),
                  ...resolved.featured.popular.map((list) => ({ list, label: t('popular') })),
                ]}
                accent={accent}
              />
            )}
          </Box>
        );

      case 'intro':
        return config.intro ? <GuideBubble config={config} /> : null;

      case 'main':
        if (resolved.type === 'tracks')
          return <TrackHistories resolved={resolved} accent={accent} />;
        if (resolved.type === 'editions') return <Editions resolved={resolved} accent={accent} />;
        return resolved.groups.map((g) => (
          <Section key={g.id} title={g.title} hint={g.description} count={g.lists.length}>
            <ListGrid lists={g.lists} accent={accent} />
          </Section>
        ));

      case 'other': {
        if (!resolved.other.length) return null;
        const onlyBucket = resolved.type === 'groups' && !resolved.groups.length;
        return (
          <Section
            title={onlyBucket ? t('all-lists') : t('other-lists')}
            count={resolved.other.length}
          >
            <ListGrid lists={resolved.other} accent={accent} />
          </Section>
        );
      }

      case 'archive':
        return resolved.archive.length ? (
          <Archive lists={resolved.archive} accent={accent} />
        ) : null;

      case 'faq':
        return config.faq?.length ? (
          <Box mt={12}>
            <SectionTitle title={t('faq')} accent={accent} />
            <Faq faq={config.faq} />
          </Box>
        ) : null;

      case 'related':
        return props.related.length ? (
          <Box mt={12}>
            <SectionTitle title={t('related-articles')} accent={accent} />
            <Related posts={props.related} />
          </Box>
        ) : null;
    }
  };

  return (
    <LabelsCtx.Provider value={config.labels ?? []}>
      <Hero {...props} overlap={overlap} />

      {sections.map((slot, i) => {
        if (!Array.isArray(slot)) return <Fragment key={slot}>{render(slot, i)}</Fragment>;

        const cols = slot.map((id) => ({ id, node: render(id, i) })).filter((c) => c.node !== null);
        if (!cols.length) return null;
        // Side-by-side blocks drop their own top margin; the row carries it.
        return (
          <Grid
            key={slot.join('+')}
            templateColumns={{ base: '1fr', lg: `repeat(${cols.length}, 1fr)` }}
            gap={8}
            mt={12}
          >
            {cols.map((c) => (
              <Box key={c.id} minW={0} css={{ '& > *': { marginTop: '0 !important' } }}>
                {c.node}
              </Box>
            ))}
          </Grid>
        );
      })}
    </LabelsCtx.Provider>
  );
}

// ---------- hero ----------

const Hero = (props: Props & { overlap: boolean }) => {
  const { config, lists, locale, overlap } = props;
  const t = useTranslations();
  const accent = config.color;
  const dark = Color(accent).darken(0.75).hex();
  const stats = getStats(lists);
  const backdrop = Array.from(new Set(lists.map((l) => l.coverURL).filter(Boolean))).slice(0, 12);

  return (
    <Box
      w="100vw"
      ml="calc(50% - 50vw)"
      position="relative"
      overflow="hidden"
      pt={{ base: 6, md: 10 }}
      pb={overlap ? { base: 24, md: 28 } : { base: 10, md: 12 }}
      bg={dark}
    >
      {backdrop.length > 0 && (
        <Grid
          position="absolute"
          inset="-40px"
          templateColumns="repeat(auto-fill, minmax(110px, 1fr))"
          gap={3}
          opacity={0.16}
          transform="rotate(-6deg)"
          aria-hidden
        >
          {Array.from({ length: 60 }, (_, i) => backdrop[i % backdrop.length]).map((src, i) => (
            <ChakraImg
              key={i}
              src={src!}
              alt=""
              aspectRatio={1}
              objectFit="cover"
              borderRadius="lg"
            />
          ))}
        </Grid>
      )}
      <Box
        position="absolute"
        inset={0}
        bgGradient={`radial-gradient(ellipse at 30% 40%, ${rgba(accent, 0.55)} 0%, ${rgba(dark, 0.92)} 70%)`}
      />

      <Box position="relative" maxW="1200px" mx="auto" px={{ base: 4, md: 8 }}>
        <BreadcrumbsView
          locale={locale}
          useAppDir
          breadcrumbList={[
            { position: 1, name: t('Layout.home'), item: '/' },
            { position: 2, name: t('General.official-lists'), item: '/lists/official' },
            { position: 3, name: config.name, item: `/lists/official/${config.slug}` },
          ]}
        />
        <Flex
          mt={{ base: 6, md: 10 }}
          gap={{ base: 6, md: 12 }}
          alignItems="center"
          flexFlow={{ base: 'column', md: 'row' }}
          textAlign={{ base: 'center', md: 'left' }}
        >
          <Box
            flex="0 0 auto"
            p={2}
            bg={accent}
            borderRadius="2xl"
            transform="rotate(-4deg)"
            boxShadow={`0 20px 60px ${rgba(accent, 0.45)}`}
          >
            <ChakraImg
              src={config.image}
              alt={config.name}
              w={{ base: '150px', md: '210px' }}
              h={{ base: '150px', md: '210px' }}
              borderRadius="xl"
              objectFit="cover"
            />
          </Box>
          <Box>
            {config.kicker && (
              <Badge bg={accent} color="blackAlpha.900" px={3} py={1} borderRadius="full">
                {config.kicker}
              </Badge>
            )}
            <Heading
              as="h1"
              mt={3}
              fontSize={{ base: '4xl', md: '6xl' }}
              fontWeight="black"
              lineHeight="1"
              letterSpacing="-0.02em"
              textShadow={`0 4px 0 ${rgba(dark, 0.8)}`}
            >
              {config.name}
            </Heading>
            {config.tagline && (
              <Text mt={4} fontSize={{ base: 'lg', md: '2xl' }} color="whiteAlpha.900" maxW="560px">
                {config.tagline}
              </Text>
            )}
            <HStack mt={5} gap={6} justifyContent={{ base: 'center', md: 'flex-start' }}>
              <BigStat value={stats.lists} label={t('General.lists')} accent={accent} />
              <BigStat
                value={stats.items}
                label={t('OfficialCategory.items-tracked')}
                accent={accent}
              />
            </HStack>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

const BigStat = ({ value, label, accent }: { value: number; label: string; accent: string }) => {
  const formatter = useFormatter();
  return (
    <Box>
      <Text
        fontSize="3xl"
        fontWeight="black"
        lineHeight="1"
        color={Color(accent).lighten(0.25).hex()}
      >
        {formatter.number(value)}
      </Text>
      <Text fontSize="xs" color="whiteAlpha.700" textTransform="uppercase" letterSpacing="0.1em">
        {label}
      </Text>
    </Box>
  );
};

const GuideBubble = ({ config }: { config: OfficialCategoryConfig }) => (
  <Flex mt={10} gap={4} alignItems="flex-start" position="relative" zIndex={1}>
    <ChakraImg
      src={config.image}
      alt=""
      w="56px"
      h="56px"
      borderRadius="lg"
      objectFit="contain"
      bg={rgba(config.color, 0.25)}
      border="3px solid"
      borderColor={config.color}
      flex="0 0 auto"
    />
    <VStack
      flex="1"
      alignItems="stretch"
      gap={2}
      bg={rgba(config.color, 0.1)}
      border="1px solid"
      borderColor={rgba(config.color, 0.3)}
      borderRadius="xl"
      p={4}
      fontSize="sm"
      color="whiteAlpha.900"
    >
      {config.intro!.map((p, i) => (
        <Text key={i}>{p}</Text>
      ))}
    </VStack>
  </Flex>
);

// ---------- cards ----------

/** Text palettes that follow ListCard: dark ink on light list colors. */
const inkFor = (hex: string) => {
  const light = Color(hex).isLight();
  return {
    light,
    text: light ? 'blackAlpha.800' : undefined,
    muted: light ? 'blackAlpha.700' : 'whiteAlpha.800',
  };
};

/** First line of a markdown description, as plain text. */
const plain = (md?: string | null) =>
  (md ?? '')
    .split(/[\r\n]+/)[0]
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .trim();

/**
 * ListCard, "featured" flavour: same colored body and overlapping cover, with the track label
 * as the first badge instead of the official badge.
 */
const NowCard = ({
  list,
  label,
  accent,
}: {
  list: UserList;
  label?: string | null;
  accent: string;
}) => {
  const t = useTranslations('OfficialCategory');
  const labels = useListLabels(list);
  const hex = listColor(list, accent);
  const ink = inkFor(hex);
  return (
    <ListLink list={list} h="100%">
      <Flex
        h="100%"
        minH="120px"
        ml="36px"
        p={3}
        gap={3}
        bg="gray.700"
        borderRadius="md"
        bgGradient={`linear-gradient(to top, rgba(0,0,0,0) 0, ${rgba(hex, 0.6)} 0%)`}
        transition="transform .15s"
        _hover={{ transform: 'translateY(-2px)' }}
      >
        <Flex
          w="100px"
          h="100px"
          ml="-48px"
          flex="0 0 auto"
          borderRadius="md"
          bg="gray.700"
          bgGradient={`linear-gradient(to top, rgba(0,0,0,0) 0, ${rgba(hex, 0.75)} 0%)`}
          alignItems="center"
          justifyContent="center"
          boxShadow="md"
        >
          <Cover list={list} size="92px" radius="md" />
        </Flex>
        <Flex flexFlow="column" gap={1.5} minW={0} flex="1">
          <Text fontWeight="bold" color={ink.text} lineClamp={2} lineHeight="1.25">
            {list.name.trim()}
          </Text>
          <Text fontSize="xs" color={ink.muted} lineClamp={2} flex="1">
            {plain(list.description)}
          </Text>
          <Flex gap={1} flexWrap="wrap">
            {label && (
              <Badge colorPalette="blue" variant="solid">
                {label}
              </Badge>
            )}
            {labels.map((l) => (
              <LabelBadge key={l.label} label={l} accent={accent} />
            ))}
            <Badge colorPalette={ink.light ? 'blackAlpha' : 'gray'} variant="solid">
              {t('items-count', { count: list.itemCount ?? 0 })}
            </Badge>
          </Flex>
        </Flex>
      </Flex>
    </ListLink>
  );
};

/** Config label (`labels[]`) as a solid badge in its own color. */
const LabelBadge = ({
  label,
  accent,
  size,
}: {
  label: ListLabel;
  accent: string;
  size?: 'xs' | 'sm';
}) => {
  const bg = label.color ?? accent;
  return (
    <Badge
      size={size}
      variant="solid"
      bg={bg}
      color={Color(bg).isLight() ? 'blackAlpha.900' : 'white'}
    >
      {label.label}
    </Badge>
  );
};

/**
 * History entry: a small ListCard. Exact period, year + duration and item count are always
 * visible; config labels (e.g. "Special week") add a colored edge and a badge so pools of
 * different kinds in the same track can be told apart. The list name lives in the tooltip.
 */
const PoolTile = ({
  list,
  accent,
  isLatest,
}: {
  list: UserList;
  accent: string;
  isLatest?: boolean;
}) => {
  const t = useTranslations('OfficialCategory');
  const formatter = useFormatter();
  const labels = useListLabels(list);
  const hex = listColor(list, accent);
  const ink = inkFor(hex);
  const edge = labels.find((l) => l.color)?.color;

  const s = list.seriesStart ? new Date(list.seriesStart) : null;
  const e = list.seriesEnd ? new Date(list.seriesEnd) : null;
  const day = (d: Date) =>
    formatter.dateTime(d, { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const sy = (s ?? e)?.getUTCFullYear();
  const ey = e?.getUTCFullYear();
  const year = sy && ey && ey !== sy ? `${sy}–${String(ey).slice(2)}` : sy;
  const days = s && e ? Math.round((e.getTime() - s.getTime()) / 86_400_000) : null;
  const duration =
    days === null
      ? null
      : days < 7
        ? t('days', { count: days })
        : t('weeks', { count: Math.round(days / 7) });
  const title =
    s && e ? `${day(s)} – ${day(e)}` : s ? t('since', { date: day(s) }) : list.name.trim();
  const meta = [year, duration].filter(Boolean).join(' · ');
  const text = isLatest ? ink.text : undefined;
  const muted = isLatest ? ink.muted : 'whiteAlpha.700';

  return (
    <ListLink list={list} title={list.name.trim()} h="100%">
      <Flex
        h="100%"
        alignItems="center"
        gap={2.5}
        p={2}
        pr={3}
        borderRadius="md"
        bg="gray.700"
        bgGradient={`linear-gradient(to top, rgba(0,0,0,0) 0, ${rgba(hex, isLatest ? 0.6 : 0.3)} 0%)`}
        borderLeft={edge ? `4px solid ${edge}` : undefined}
        outline={isLatest ? `2px solid ${rgba(hex, 0.9)}` : undefined}
        transition="transform .15s"
        _hover={{ transform: 'translateY(-1px)' }}
      >
        <Cover list={list} size="40px" radius="sm" />
        <Box flex="1" minW={0} lineHeight="1.2">
          <Text fontSize="sm" fontWeight="bold" color={text} lineClamp={1}>
            {title}
          </Text>
          {meta && (
            <Text fontSize="xs" color={muted}>
              {meta}
            </Text>
          )}
          {(isLatest || labels.length > 0) && (
            <Flex gap={1} mt={1} flexWrap="wrap">
              {isLatest && (
                <Badge size="xs" colorPalette="blue" variant="solid">
                  {t('most-recent')}
                </Badge>
              )}
              {labels.map((l) => (
                <LabelBadge key={l.label} label={l} accent={accent} size="xs" />
              ))}
            </Flex>
          )}
        </Box>
        <Box flex="0 0 auto" textAlign="right" lineHeight="1.1">
          <Text fontSize="lg" fontWeight="black" color={text}>
            {formatter.number(list.itemCount ?? 0)}
          </Text>
          <Text fontSize="2xs" color={muted} textTransform="uppercase">
            {t('items')}
          </Text>
        </Box>
      </Flex>
    </ListLink>
  );
};

/** Compact card with cover, for mixed lists (other, groups, archive, past editions). */
const ListChip = ({ list, accent }: { list: UserList; accent: string }) => {
  const t = useTranslations('OfficialCategory');
  const color = listColor(list, accent);
  const labels = useListLabels(list);
  return (
    <ListLink list={list} h="100%">
      <Flex
        gap={3}
        p={2}
        pr={3}
        h="100%"
        alignItems="center"
        borderRadius="lg"
        bg="whiteAlpha.50"
        transition="background .15s"
        _hover={{ bg: 'whiteAlpha.150' }}
      >
        <Box borderRadius="md" boxShadow={`0 0 0 2px ${rgba(color, 0.5)}`} flex="0 0 auto">
          <Cover list={list} size="40px" radius="md" />
        </Box>
        <Box minW={0} flex="1">
          <Text fontWeight="semibold" fontSize="sm" lineClamp={1}>
            {list.name.trim()}
          </Text>
          <Flex gap={1.5} alignItems="center" flexWrap="wrap">
            <Text fontSize="xs" color="whiteAlpha.600">
              {t('items-count', { count: list.itemCount ?? 0 })}
            </Text>
            {labels.map((l) => (
              <LabelBadge key={l.label} label={l} accent={accent} size="xs" />
            ))}
          </Flex>
        </Box>
      </Flex>
    </ListLink>
  );
};

const ListGrid = ({ lists, accent }: { lists: UserList[]; accent: string }) => (
  <Grid templateColumns="repeat(auto-fill, minmax(240px, 1fr))" gap={2}>
    {lists.map((l) => (
      <ListChip key={l.internal_id} list={l} accent={accent} />
    ))}
  </Grid>
);

// ---------- layouts ----------

type Tracks = Extract<ResolvedCategory, { type: 'tracks' }>;
type Editions = Extract<ResolvedCategory, { type: 'editions' }>;

const NowTracks = ({ resolved, accent }: { resolved: Tracks; accent: string }) => {
  const cards = resolved.tracks.flatMap((t) => t.current.map((list) => ({ list, label: t.label })));
  return (
    <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }} gap={3}>
      {cards.map(({ list, label }) => (
        <NowCard key={list.internal_id} list={list} label={label} accent={accent} />
      ))}
    </Grid>
  );
};

const TrackHistories = ({ resolved, accent }: { resolved: Tracks; accent: string }) => (
  <>
    {resolved.tracks
      .filter((t) => t.history.length > 0)
      .map((t) => (
        <Section
          key={t.id}
          title={t.historyTitle}
          hint={t.historyDescription}
          count={t.history.length}
        >
          <Collapsible items={t.history} initial={8}>
            {(shown) => (
              <Grid templateColumns="repeat(auto-fill, minmax(270px, 1fr))" gap={2}>
                {shown.map((l, i) => (
                  <PoolTile key={l.internal_id} list={l} accent={accent} isLatest={i === 0} />
                ))}
              </Grid>
            )}
          </Collapsible>
        </Section>
      ))}
  </>
);

const LatestEdition = ({ edition, accent }: { edition: EditionGroup; accent: string }) => {
  const t = useTranslations('OfficialCategory');
  const period = usePeriod();
  const dates = period(edition.start, edition.end);
  return (
    <>
      <HStack mb={3} gap={3} alignItems="center">
        <Badge bg={accent} color="blackAlpha.900" px={3} borderRadius="full">
          {t('latest-edition', { year: edition.year })}
        </Badge>
        {dates && (
          <Text fontSize="xs" color="whiteAlpha.800">
            {dates}
          </Text>
        )}
      </HStack>
      <NowGrid cards={edition.lists.map((list) => ({ list }))} accent={accent} />
    </>
  );
};

/** Featured cards: one card stays narrow, more cards fill a grid. */
const NowGrid = ({
  cards,
  accent,
}: {
  cards: { list: UserList; label?: string }[];
  accent: string;
}) => (
  <Grid
    templateColumns={
      cards.length === 1 ? '1fr' : { base: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }
    }
    maxW={cards.length === 1 ? '520px' : undefined}
    gap={3}
  >
    {cards.map(({ list, label }) => (
      <NowCard key={list.internal_id} list={list} label={label} accent={accent} />
    ))}
  </Grid>
);

const Editions = ({ resolved, accent }: { resolved: Editions; accent: string }) => {
  const t = useTranslations('OfficialCategory');
  return (
    <>
      {resolved.evergreen && (
        <Section title={resolved.evergreen.title}>
          <ListGrid lists={resolved.evergreen.lists} accent={accent} />
        </Section>
      )}
      {resolved.past.length > 0 && (
        <Section title={t('past-editions')} count={resolved.past.length}>
          <Collapsible items={resolved.past} initial={5}>
            {(shown) => (
              <VStack alignItems="stretch" gap={0}>
                {shown.map((ed) => (
                  <Flex
                    key={ed.year}
                    gap={{ base: 2, md: 6 }}
                    py={3}
                    borderTop="1px solid"
                    borderColor="whiteAlpha.100"
                    flexFlow={{ base: 'column', md: 'row' }}
                  >
                    <Text
                      w={{ md: '96px' }}
                      flex="0 0 auto"
                      fontSize="2xl"
                      fontWeight="black"
                      color={Color(accent).lighten(0.2).hex()}
                      lineHeight="1.2"
                    >
                      {ed.year}
                    </Text>
                    <Box flex="1" minW={0}>
                      <ListGrid lists={ed.lists} accent={accent} />
                    </Box>
                  </Flex>
                ))}
              </VStack>
            )}
          </Collapsible>
        </Section>
      )}
    </>
  );
};

const Archive = ({ lists, accent }: { lists: UserList[]; accent: string }) => {
  const t = useTranslations('OfficialCategory');
  const [open, setOpen] = useState(false);
  return (
    <Box mt={12} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100" p={4}>
      <Flex alignItems="center" gap={3}>
        <Box flex="1">
          <Heading as="h2" size="sm">
            {t('archive', { count: lists.length })}
          </Heading>
          <Text fontSize="xs" color="whiteAlpha.600">
            {t('archive-hint')}
          </Text>
        </Box>
        <Button size="xs" variant="outline" onClick={() => setOpen(!open)}>
          {open ? t('hide') : t('show')}
        </Button>
      </Flex>
      {open && (
        <Box mt={4}>
          <ListGrid lists={lists} accent={accent} />
        </Box>
      )}
    </Box>
  );
};

// ---------- building blocks ----------

const SectionTitle = ({ title, accent }: { title: string; accent: string }) => (
  <HStack mb={4} gap={3}>
    <Box w="6px" h="22px" bg={accent} borderRadius="full" />
    <Heading as="h2" size="lg">
      {title}
    </Heading>
  </HStack>
);

const Section = ({
  title,
  count,
  hint,
  children,
}: {
  title: string;
  count?: number;
  hint?: string;
  children: React.ReactNode;
}) => (
  <Box mt={12}>
    <Heading as="h2" size="xl" fontWeight="black">
      {title}{' '}
      {count !== undefined && (
        <Text as="span" color="whiteAlpha.500" fontWeight="normal">
          {count}
        </Text>
      )}
    </Heading>
    {hint && (
      <Text fontSize="xs" color="whiteAlpha.500">
        {hint}
      </Text>
    )}
    <Box mt={4}>{children}</Box>
  </Box>
);

function Collapsible<T>({
  items,
  initial,
  children,
}: {
  items: T[];
  initial: number;
  children: (shown: T[]) => React.ReactNode;
}) {
  const t = useTranslations('OfficialCategory');
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, initial);
  return (
    <>
      {children(shown)}
      {items.length > initial && (
        <Button size="xs" variant="ghost" mt={2} onClick={() => setAll(!all)}>
          {all ? t('show-less') : t('show-all', { count: items.length })}
        </Button>
      )}
    </>
  );
}

const Faq = ({ faq }: { faq: NonNullable<OfficialCategoryConfig['faq']> }) => (
  <Accordion.Root collapsible bg="whiteAlpha.50" borderRadius="lg">
    {faq.map((f, i) => (
      <Accordion.Item key={i} value={String(i)} borderColor="whiteAlpha.100">
        <Accordion.ItemTrigger px={4} py={3}>
          <Text as="h3" flex="1" fontWeight="semibold" fontSize="sm">
            {f.q}
          </Text>
          <Accordion.ItemIndicator />
        </Accordion.ItemTrigger>
        <Accordion.ItemContent>
          <Accordion.ItemBody px={4} pb={3} fontSize="sm" color="whiteAlpha.800">
            {f.a}
          </Accordion.ItemBody>
        </Accordion.ItemContent>
      </Accordion.Item>
    ))}
  </Accordion.Root>
);

const Related = ({ posts }: { posts: WP_Article[] }) => (
  <VStack alignItems="stretch" gap={2}>
    {posts.map((post) => (
      <Link key={post.id} asChild _hover={{ textDecoration: 'none' }}>
        <MainLink href={`/articles/${post.slug}`} prefetch={false}>
          <Flex
            gap={3}
            p={3}
            bg="whiteAlpha.50"
            borderRadius="lg"
            _hover={{ bg: 'whiteAlpha.150' }}
          >
            {post.thumbnail && (
              <ChakraImg
                src={post.thumbnail}
                alt=""
                w="64px"
                h="64px"
                borderRadius="md"
                objectFit="cover"
                flex="0 0 auto"
              />
            )}
            <Box minW={0}>
              <Text fontWeight="bold" fontSize="sm" lineClamp={2}>
                {post.title}
              </Text>
              <Text fontSize="xs" color="whiteAlpha.600" lineClamp={2}>
                {post.excerpt}
              </Text>
            </Box>
          </Flex>
        </MainLink>
      </Link>
    ))}
  </VStack>
);
