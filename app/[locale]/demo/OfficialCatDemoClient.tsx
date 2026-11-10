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
  Switch,
  Text,
  VStack,
} from '@chakra-ui/react';
import Color from 'color';
import { useFormatter } from 'next-intl';
import { createContext, useContext, useState } from 'react';
import type { UserList, WP_Article } from '@types';
import MainLink from '@components/Utils/MainLink';
import Image from '@components/Utils/Image';
import { BreadcrumbsView } from '@components/Breadcrumbs/BreadcrumbsView';
import { getListLink } from '@utils/list/listLink';
import icon from '@assets/logo_icon.svg';
import type { OfficialCategoryConfig } from './_categories/types';
import type { EditionGroup, ResolvedCategory } from './_categories/resolve';

type Props = {
  locale: string;
  config: OfficialCategoryConfig;
  lists: UserList[];
  resolved: ResolvedCategory;
  related: WP_Article[];
  categories: { slug: string; name: string; color: string; configured: boolean }[];
};

const CFG_COLOR = '#b794f4';

// ---------- helpers ----------

const HighlightCtx = createContext(false);

const rgba = (hex: string, a: number) => {
  const [r, g, b] = Color(hex).rgb().round().array();
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

const listColor = (list: UserList, fallback: string) => list.colorHex || fallback;

/** Outlines blocks that come from the category config when the toggle is on. */
const Cfg = ({ field, children, ...rest }: { field: string; children: React.ReactNode } & any) => {
  const on = useContext(HighlightCtx);
  return (
    <Box
      position="relative"
      outline={on ? `2px dashed ${CFG_COLOR}` : undefined}
      outlineOffset="4px"
      borderRadius="md"
      {...rest}
    >
      {on && (
        <Badge
          position="absolute"
          top="-14px"
          right="0"
          zIndex={2}
          bg={CFG_COLOR}
          color="gray.900"
          fontSize="2xs"
          textTransform="none"
        >
          config · {field}
        </Badge>
      )}
      {children}
    </Box>
  );
};

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
  return (list: UserList) => {
    const s = list.seriesStart ? new Date(list.seriesStart) : null;
    const e = list.seriesEnd ? new Date(list.seriesEnd) : null;
    const md = { month: 'short', day: 'numeric', timeZone: 'UTC' } as const;
    const mdy = { ...md, year: 'numeric' } as const;
    if (s && e) {
      const sameYear = s.getUTCFullYear() === e.getUTCFullYear();
      return `${format.dateTime(s, sameYear ? md : mdy)} – ${format.dateTime(e, mdy)}`;
    }
    if (s) return `Since ${format.dateTime(s, mdy)}`;
    return null;
  };
};

const getStats = (lists: UserList[]) => ({
  lists: lists.length,
  items: lists.reduce((acc, l) => acc + (l.itemCount ?? 0), 0),
});

// ---------- page ----------

export function OfficialCatDemoClient(props: Props) {
  const [highlight, setHighlight] = useState(false);
  const { config, resolved } = props;
  const accent = config.color;

  return (
    <HighlightCtx.Provider value={highlight}>
      <DemoToolbar {...props} highlight={highlight} setHighlight={setHighlight} />
      <Box key={config.slug}>
        <Hero {...props} />

        {(resolved.type === 'tracks' || (resolved.type === 'editions' && resolved.latest)) && (
          <Box mt={{ base: -16, md: -20 }} position="relative" zIndex={1}>
            {resolved.type === 'tracks' && <NowTracks resolved={resolved} accent={accent} />}
            {resolved.type === 'editions' && resolved.latest && (
              <LatestEdition edition={resolved.latest} accent={accent} />
            )}
          </Box>
        )}

        {config.intro && <GuideBubble config={config} />}

        {resolved.type === 'tracks' && <TrackHistories resolved={resolved} accent={accent} />}
        {resolved.type === 'editions' && <Editions resolved={resolved} accent={accent} />}
        {resolved.type === 'groups' &&
          resolved.groups.map((g) => (
            <Section key={g.id} title={g.title} count={g.lists.length} cfg="groups[]">
              <ListGrid lists={g.lists} accent={accent} />
            </Section>
          ))}

        {resolved.other.length > 0 && (
          <Section
            title={
              resolved.type === 'groups' && !resolved.groups.length ? 'All lists' : 'Other lists'
            }
            count={resolved.other.length}
            hint={
              resolved.type === 'groups' && !resolved.groups.length
                ? 'This category has no config yet'
                : 'Not matched by any rule in the config'
            }
          >
            <ListGrid lists={resolved.other} accent={accent} />
          </Section>
        )}

        {resolved.archive.length > 0 && <Archive lists={resolved.archive} accent={accent} />}

        <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={8} mt={14}>
          {config.faq && config.faq.length > 0 && (
            <Box>
              <SectionTitle title="FAQ" accent={accent} />
              <Cfg field="faq">
                <Faq faq={config.faq} />
              </Cfg>
            </Box>
          )}
          {props.related.length > 0 && (
            <Box>
              <SectionTitle title="From our articles" accent={accent} />
              <Cfg field="relatedArticles">
                <Related posts={props.related} />
              </Cfg>
            </Box>
          )}
        </Grid>

        <ConfigPanel config={config} />
      </Box>
    </HighlightCtx.Provider>
  );
}

const DemoToolbar = (props: Props & { highlight: boolean; setHighlight: (v: boolean) => void }) => {
  const { highlight, setHighlight, categories, config } = props;
  return (
    <Box
      position={{ base: 'relative', md: 'sticky' }}
      top="8px"
      zIndex={20}
      mt={3}
      mb={4}
      p={3}
      bg="blackAlpha.800"
      backdropFilter="blur(8px)"
      borderRadius="lg"
      border="1px solid"
      borderColor="whiteAlpha.200"
    >
      <Flex gap={1.5} flexWrap="wrap" alignItems="center">
        <Text fontSize="xs" color="gray.400" fontWeight="bold" textTransform="uppercase" mr={1}>
          Demo
        </Text>
        {categories.map((c) => (
          <Link key={c.slug} asChild _hover={{ textDecoration: 'none' }}>
            <MainLink href={`/demo?cat=${c.slug}`} prefetch={false}>
              <Badge
                variant={c.slug === config.slug ? 'solid' : 'subtle'}
                bg={c.slug === config.slug ? rgba(c.color, 0.9) : undefined}
                color={c.slug === config.slug ? 'blackAlpha.900' : undefined}
                textTransform="none"
                opacity={c.configured || c.slug === config.slug ? 1 : 0.6}
              >
                {c.name}
                {c.configured ? ' ✦' : ''}
              </Badge>
            </MainLink>
          </Link>
        ))}
        <Box flex="1" />
        <Switch.Root
          size="sm"
          checked={highlight}
          onCheckedChange={(e) => setHighlight(e.checked)}
          colorPalette="purple"
        >
          <Switch.HiddenInput />
          <Switch.Control />
          <Switch.Label fontSize="xs">Destacar o que vem do config</Switch.Label>
        </Switch.Root>
      </Flex>
      <Text fontSize="xs" color="gray.300" mt={2}>
        ✦ = tem config. Layout: <b>{config.layout.type}</b> · URL proposta:{' '}
        <Text as="span" fontFamily="mono" color="green.300">
          /lists/official/{config.slug}
        </Text>
      </Text>
    </Box>
  );
};

// ---------- hero ----------

const Hero = (props: Props) => {
  const { config, lists, locale } = props;
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
      mt={-4}
      pt={{ base: 6, md: 10 }}
      pb={{ base: 24, md: 28 }}
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
            { position: 1, name: 'Home', item: '/' },
            { position: 2, name: 'Official Lists', item: '/lists/official' },
            { position: 3, name: config.name, item: `/lists/official/cat/${config.slug}` },
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
              alt=""
              w={{ base: '150px', md: '210px' }}
              h={{ base: '150px', md: '210px' }}
              borderRadius="xl"
              objectFit="cover"
            />
          </Box>
          <Box>
            {config.kicker && (
              <Cfg field="kicker" display="inline-block">
                <Badge bg={accent} color="blackAlpha.900" px={3} py={1} borderRadius="full">
                  {config.kicker}
                </Badge>
              </Cfg>
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
              <Cfg field="tagline" mt={4}>
                <Text fontSize={{ base: 'lg', md: '2xl' }} color="whiteAlpha.900" maxW="560px">
                  {config.tagline}
                </Text>
              </Cfg>
            )}
            <HStack mt={5} gap={6} justifyContent={{ base: 'center', md: 'flex-start' }}>
              <BigStat value={stats.lists} label="lists" accent={accent} />
              <BigStat value={stats.items} label="items tracked" accent={accent} />
            </HStack>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

const BigStat = ({ value, label, accent }: { value: number; label: string; accent: string }) => (
  <Box>
    <Text
      fontSize="3xl"
      fontWeight="black"
      lineHeight="1"
      color={Color(accent).lighten(0.25).hex()}
    >
      {value.toLocaleString()}
    </Text>
    <Text fontSize="xs" color="whiteAlpha.700" textTransform="uppercase" letterSpacing="0.1em">
      {label}
    </Text>
  </Box>
);

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
    <Cfg field="intro" flex="1">
      <VStack
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
    </Cfg>
  </Flex>
);

// ---------- cards ----------

/** Text/badge palettes that follow ListCard: dark ink on light list colors. */
const inkFor = (hex: string) => {
  const light = Color(hex).isLight();
  return {
    light,
    text: light ? 'blackAlpha.800' : undefined,
    muted: light ? 'blackAlpha.700' : 'whiteAlpha.800',
    badge: light ? 'blackAlpha' : 'whiteAlpha',
  };
};

const plain = (md?: string | null) =>
  (md ?? '')
    .split(/[\r\n]+/)[0]
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .trim();

/**
 * ListCard, "featured" flavour: same colored body and overlapping cover, with the track /
 * edition label as the first badge instead of the official badge.
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
  const formatter = useFormatter();
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
            {list.highlight && (
              <Badge colorPalette={ink.badge} variant="solid">
                {list.highlight}
              </Badge>
            )}
            <Badge colorPalette={ink.light ? 'blackAlpha' : 'gray'} variant="solid">
              {formatter.number(list.itemCount ?? 0)} items
            </Badge>
          </Flex>
        </Flex>
      </Flex>
    </ListLink>
  );
};

/**
 * History entry: a ListCard shrunk to one line. Pools of a track look alike, so only the
 * months are shown; exact dates and the list name live in the tooltip.
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
  const formatter = useFormatter();
  const hex = listColor(list, accent);
  const ink = inkFor(hex);
  const s = list.seriesStart ? new Date(list.seriesStart) : null;
  const e = list.seriesEnd ? new Date(list.seriesEnd) : null;
  const month = (d: Date) => formatter.dateTime(d, { month: 'short', timeZone: 'UTC' });
  const sy = (s ?? e)?.getUTCFullYear();
  const ey = e?.getUTCFullYear();
  const year = sy && ey && ey !== sy ? `${sy}–${String(ey).slice(2)}` : sy;
  const title = s && e ? `${month(s)} – ${month(e)}` : s ? `${month(s)} →` : list.name.trim();

  return (
    <ListLink list={list} title={list.name.trim()}>
      <Flex
        alignItems="center"
        gap={2}
        p={1.5}
        pr={2.5}
        borderRadius="md"
        bg="gray.700"
        bgGradient={`linear-gradient(to top, rgba(0,0,0,0) 0, ${rgba(hex, isLatest ? 0.6 : 0.3)} 0%)`}
        outline={isLatest ? `2px solid ${rgba(hex, 0.9)}` : undefined}
        transition="background .15s, transform .15s"
        _hover={{ transform: 'translateY(-1px)' }}
      >
        <Cover list={list} size="32px" radius="sm" />
        <Box flex="1" minW={0} lineHeight="1.1">
          <Text
            fontSize="sm"
            fontWeight="bold"
            color={isLatest ? ink.text : undefined}
            lineClamp={1}
          >
            {title}
          </Text>
          {year && (
            <Text fontSize="2xs" color={isLatest ? ink.muted : 'whiteAlpha.600'}>
              {year}
            </Text>
          )}
        </Box>
        <Badge
          size="xs"
          colorPalette={isLatest && ink.light ? 'blackAlpha' : 'gray'}
          variant="solid"
          flex="0 0 auto"
        >
          {formatter.number(list.itemCount ?? 0)}
        </Badge>
      </Flex>
    </ListLink>
  );
};

/** Compact card with cover, for mixed lists (other, groups, archive, past editions). */
const ListChip = ({ list, accent }: { list: UserList; accent: string }) => {
  const color = listColor(list, accent);
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
          <Text fontSize="xs" color="whiteAlpha.600">
            {list.itemCount} items
            {list.highlight ? ` · ${list.highlight}` : ''}
          </Text>
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
  const cards = resolved.tracks.flatMap((t) => t.current.map((list) => ({ list, label: t.title })));
  return (
    <Cfg field="tracks[].current">
      <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }} gap={3}>
        {cards.map(({ list, label }) => (
          <NowCard key={list.internal_id} list={list} label={label} accent={accent} />
        ))}
      </Grid>
    </Cfg>
  );
};

const TrackHistories = ({ resolved, accent }: { resolved: Tracks; accent: string }) => (
  <>
    {resolved.tracks
      .filter((t) => t.history.length > 0)
      .map((t) => (
        <Section
          key={t.id}
          title={`${t.title} · past pools`}
          count={t.history.length}
          cfg="tracks[].history"
        >
          <Collapsible items={t.history} initial={10}>
            {(shown) => (
              <Grid templateColumns="repeat(auto-fill, minmax(170px, 1fr))" gap={2}>
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
  const period = usePeriod();
  const main = edition.lists.find((l) => l.seriesStart && l.seriesEnd) ?? edition.lists[0];
  return (
    <Cfg field="layout: editions">
      <HStack mb={3} gap={3} alignItems="center">
        <Badge bg={accent} color="blackAlpha.900" px={3} borderRadius="full">
          Latest edition · {edition.year}
        </Badge>
        <Text fontSize="xs" color="whiteAlpha.800">
          {period(main)}
        </Text>
      </HStack>
      <Grid
        templateColumns={
          edition.lists.length === 1 ? '1fr' : { base: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }
        }
        maxW={edition.lists.length === 1 ? '520px' : undefined}
        gap={3}
      >
        {edition.lists.map((list) => (
          <NowCard key={list.internal_id} list={list} accent={accent} />
        ))}
      </Grid>
    </Cfg>
  );
};

const Editions = ({ resolved, accent }: { resolved: Editions; accent: string }) => (
  <>
    {resolved.evergreen && (
      <Section title={resolved.evergreen.title} cfg="evergreen">
        <ListGrid lists={resolved.evergreen.lists} accent={accent} />
      </Section>
    )}
    {resolved.past.length > 0 && (
      <Section title="Past editions" count={resolved.past.length}>
        <Collapsible items={resolved.past} initial={5} label="editions">
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

const Archive = ({ lists, accent }: { lists: UserList[]; accent: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <Cfg field="archive" mt={12}>
      <Box borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100" p={4}>
        <Flex alignItems="center" gap={3}>
          <Box flex="1">
            <Text fontWeight="bold">Archive · {lists.length}</Text>
            <Text fontSize="xs" color="whiteAlpha.600">
              Retired lists, kept for reference.
            </Text>
          </Box>
          <Button size="xs" variant="outline" onClick={() => setOpen(!open)}>
            {open ? 'Hide' : 'Show'}
          </Button>
        </Flex>
        {open && (
          <Box mt={4}>
            <ListGrid lists={lists} accent={accent} />
          </Box>
        )}
      </Box>
    </Cfg>
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
  cfg,
  children,
}: {
  title: string;
  count?: number;
  hint?: string;
  cfg?: string;
  children: React.ReactNode;
}) => {
  const body = (
    <>
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
    </>
  );
  return <Box mt={12}>{cfg ? <Cfg field={cfg}>{body}</Cfg> : body}</Box>;
};

function Collapsible<T>({
  items,
  initial,
  label = 'pools',
  children,
}: {
  items: T[];
  initial: number;
  label?: string;
  children: (shown: T[]) => React.ReactNode;
}) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, initial);
  return (
    <>
      {children(shown)}
      {items.length > initial && (
        <Button size="xs" variant="ghost" mt={2} onClick={() => setAll(!all)}>
          {all ? 'Show less' : `Show all ${items.length} ${label}`}
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
          <Text flex="1" fontWeight="semibold" fontSize="sm">
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

const ConfigPanel = ({ config }: { config: OfficialCategoryConfig }) => {
  const [open, setOpen] = useState(false);
  return (
    <Box
      mt={16}
      p={5}
      borderRadius="xl"
      border="1px dashed"
      borderColor={CFG_COLOR}
      bg="blackAlpha.400"
    >
      <Flex alignItems="center" gap={3}>
        <Box flex="1">
          <Heading as="h2" size="md" color={CFG_COLOR}>
            Config desta categoria
          </Heading>
          <Text fontSize="sm" color="whiteAlpha.700">
            Na implementação: <code>app/[locale]/lists/official/_categories/{config.slug}.ts</code>
          </Text>
        </Box>
        <Button size="xs" variant="outline" onClick={() => setOpen(!open)}>
          {open ? 'Esconder' : 'Ver config'}
        </Button>
      </Flex>
      {open && (
        <Box
          as="pre"
          mt={4}
          p={3}
          bg="blackAlpha.600"
          borderRadius="md"
          fontSize="xs"
          overflowX="auto"
          whiteSpace="pre"
        >
          {JSON.stringify(config, null, 2)}
        </Box>
      )}
    </Box>
  );
};
