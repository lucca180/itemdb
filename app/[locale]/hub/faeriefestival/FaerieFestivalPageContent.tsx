// TODO(pre-launch): items to validate before this counts as launch-ready —
// 1. "Price Checker" (utilityCards + hero CTA + FAQ) currently shows Neopets market price,
//    not Faerie Festival recycling points — either add that lookup to Price Checker, or
//    change this copy/CTA to point at the SDB Importer "sort by Recycling Points" flow
//    instead, which already does this today.
// 2. EVENT_YEAR in _data.ts — confirm official 2026 lists exist and are tagged correctly.
// See _event.ts for the OG image TODO.
import type { ReactNode } from 'react';
import { Badge, Box, Flex, Heading, Image, Link, Table, Text } from '@chakra-ui/react';
import NextImage from 'next/image';
import Color from 'color';
import Background from '@assets/hub/faeriefest2023.png';
import MainLink from '@components/Utils/MainLink';
import UserListCard from '@components/UserLists/ListCard';
import type { UserList } from '@types';
import { recyclingTiers, capsuleTiers, utilityCards } from './_content';
import { officialEventUrl, eventStartLabel, eventEndLabel } from './_event';

type Props = {
  lists: UserList[];
};

const PANEL_WASH = 'rgba(236, 72, 153, 0.12)';
const DESCRIPTION_COLOR = 'gray.300';
const LABEL_COLOR = 'gray.400';
const H1 = 'Faerie Festival 2026';

/** Contrasting text color for a chip whose background is an arbitrary brand hex. */
function chipTextColor(hex: string) {
  return Color(hex).isLight() ? 'blackAlpha.800' : 'white';
}

/** A brand hex used as text color on a dark card needs a lightness floor to stay legible. */
function legibleAccent(hex: string) {
  const color = Color(hex);
  return color.lightness() < 58 ? color.lightness(58).hex() : hex;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function FaerieFestivalPageContent({ lists }: Props) {
  return (
    <>
      {/* Ambient glow behind the hero — a light pastel wash, not a flat dark tint */}
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient="linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(221,170,223,.35) 70%)"
        zIndex={-1}
      />

      <Flex flexFlow="column" gap={16} px={[3, 2]} pt={[6, 10]} pb={20} maxW="1320px" mx="auto">
        {/* Oversized editorial hero — artwork lives only here */}
        <Box
          position="relative"
          borderRadius="2xl"
          overflow="hidden"
          minH={['380px', '450px']}
          boxShadow="0 25px 60px -25px rgba(0,0,0,.6)"
        >
          <NextImage
            src={Background}
            alt="Faerie Festival 2026"
            fill
            priority
            quality={100}
            style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
          />
          <Box
            position="absolute"
            inset={0}
            bgGradient="linear-gradient(180deg, rgba(60,15,45,.05) 0%, rgba(40,10,35,.82) 88%)"
          />
          <Flex
            position="relative"
            flexFlow="column"
            gap={3}
            justify="flex-end"
            h="100%"
            p={[5, 8, 10]}
          >
            <Text fontSize="sm" letterSpacing="0.3em" color="pink.200" textTransform="uppercase">
              Event Hub
            </Text>
            <Heading
              as="h1"
              aria-label={H1}
              fontSize={['5xl', '7xl', '8xl']}
              lineHeight={0.95}
              fontWeight="black"
              letterSpacing="-0.02em"
              color="white"
              textShadow="0 8px 40px rgba(0,0,0,.7)"
            >
              Faerie Festival
              <Box as="span" display="block" fontSize={['3xl', '5xl', '6xl']}>
                2026
              </Box>
            </Heading>
            <Text fontSize={['md', 'xl']} color="whiteAlpha.900" maxW="620px" mt={2}>
              Check how many Faerie Festival Prize Shop points the items in your SDB and inventory
              are worth, the event prizes, and itemdb guides.
            </Text>
            <Flex gap={3} flexWrap="wrap" fontSize="sm" mt={1} align="center">
              <Link asChild color="pink.200">
                <MainLink
                  href="/tools/price-checker"
                  trackEvent="faeriefestival-hub-hero"
                  trackEventLabel="price-checker"
                >
                  Check points on items you own
                </MainLink>
              </Link>
              <Text color="whiteAlpha.500">·</Text>
              <Link asChild color="pink.200">
                <MainLink
                  href="#prizes"
                  trackEvent="faeriefestival-hub-hero"
                  trackEventLabel="prizes-anchor"
                >
                  Check event prizes
                </MainLink>
              </Link>
              <Text color="whiteAlpha.500">·</Text>
              <Link
                href={officialEventUrl}
                target="_blank"
                rel="noreferrer"
                color="pink.200"
                data-umami-event="faeriefestival-hub-hero"
                data-umami-event-label="official-event"
              >
                Official event page ↗
              </Link>
            </Flex>
          </Flex>
        </Box>

        {/* Recycling — giant stat numerals */}
        <GlassPanel
          eyebrow="01 — Recycling"
          title="How many points is it worth?"
          description="Every item you can recycle, and how many Prize Shop points it earns."
        >
          <CardRow>
            {recyclingTiers.map((tier) => (
              <Link
                key={tier.points}
                asChild
                flex="1"
                minW="150px"
                _hover={{ textDecoration: 'none' }}
              >
                <MainLink
                  href={tier.link}
                  prefetch={false}
                  trackEvent="faeriefestival-hub-recycling"
                  trackEventLabel={tier.rarityRange}
                >
                  <Flex
                    flexFlow="column"
                    gap={1}
                    w="100%"
                    h="100%"
                    p={4}
                    borderRadius="lg"
                    bg="whiteAlpha.100"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    borderTop="3px solid"
                    borderTopColor={tier.color}
                    _hover={{ bg: 'whiteAlpha.200' }}
                  >
                    <Text
                      fontSize="6xl"
                      fontWeight="black"
                      color={legibleAccent(tier.color)}
                      lineHeight={1}
                    >
                      {tier.points}
                    </Text>
                    <Text fontSize="xs" color={LABEL_COLOR} textTransform="uppercase">
                      points
                    </Text>
                    <Badge
                      mt={2}
                      alignSelf="flex-start"
                      bg={tier.color}
                      color={chipTextColor(tier.color)}
                    >
                      {tier.rarityRange}
                    </Badge>
                    <Text fontSize="xs" color={DESCRIPTION_COLOR} mt={1}>
                      {tier.description}
                    </Text>
                  </Flex>
                </MainLink>
              </Link>
            ))}
          </CardRow>
        </GlassPanel>

        {/* Capsule */}
        <GlassPanel
          eyebrow="02 — Faerie Donation Capsule"
          title="What might you get back?"
          description="Drop odds for what the capsule gifts you in return, by rarity tier."
        >
          <CardRow>
            {capsuleTiers.map((tier) => (
              <Link
                key={tier.rarityLabel}
                asChild
                flex="1"
                minW="200px"
                _hover={{ textDecoration: 'none' }}
              >
                <MainLink
                  href={tier.link}
                  prefetch={false}
                  trackEvent="faeriefestival-hub-capsule"
                  trackEventLabel={tier.rarityLabel}
                >
                  <Flex
                    flexFlow="column"
                    gap={2}
                    w="100%"
                    h="100%"
                    p={4}
                    borderRadius="lg"
                    bg="whiteAlpha.100"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    _hover={{ bg: 'whiteAlpha.200' }}
                  >
                    <Image src={tier.coverURL} alt="" w="48px" h="48px" objectFit="contain" />
                    <Text
                      fontSize="4xl"
                      fontWeight="black"
                      color={legibleAccent(tier.color)}
                      lineHeight={1}
                    >
                      {tier.chance}
                    </Text>
                    <Badge alignSelf="flex-start" bg={tier.color} color={chipTextColor(tier.color)}>
                      {tier.rarityLabel}
                    </Badge>
                    <Text fontSize="xs" color={DESCRIPTION_COLOR}>
                      {tier.description}
                    </Text>
                  </Flex>
                </MainLink>
              </Link>
            ))}
          </CardRow>
        </GlassPanel>

        {/* Lists */}
        <GlassPanel
          id="prizes"
          eyebrow="03 — Official Lists"
          title="This year's best prizes"
          description="itemdb's curated lists of the best Faerie Festival prizes — Prize Shop and other event rewards."
        >
          <Flex gap={3} flexWrap="wrap" justifyContent="center">
            {lists.map((list) => (
              <UserListCard
                isSmall
                key={list.internal_id}
                list={list}
                utm_content="faeriefestival-hub-lists"
              />
            ))}
          </Flex>
        </GlassPanel>

        {/* Utilities */}
        <GlassPanel
          eyebrow="04 — Utilities"
          title="Tools to make your life easier"
          description="itemdb tools and userscripts that help you recycle and collect faster."
        >
          <CardRow>
            {utilityCards.map((card) => (
              <Link
                key={card.title}
                asChild
                flex="1"
                minW="200px"
                _hover={{ textDecoration: 'none' }}
              >
                <MainLink
                  href={card.link}
                  prefetch={false}
                  trackEvent="faeriefestival-hub-utilities"
                  trackEventLabel={slugify(card.title)}
                >
                  <Flex
                    flexFlow="column"
                    gap={2}
                    w="100%"
                    h="100%"
                    p={4}
                    borderRadius="lg"
                    bg="whiteAlpha.100"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    _hover={{ bg: 'whiteAlpha.200' }}
                  >
                    <Image src={card.coverURL} alt="" w="40px" h="40px" objectFit="contain" />
                    <Text fontWeight="bold" color="white">
                      {card.title}
                    </Text>
                    <Text fontSize="xs" color={DESCRIPTION_COLOR}>
                      {card.description}
                    </Text>
                    <Text
                      fontSize="xs"
                      color="pink.200"
                      fontWeight="bold"
                      textTransform="uppercase"
                      mt="auto"
                    >
                      {card.footerText}
                    </Text>
                  </Flex>
                </MainLink>
              </Link>
            ))}
          </CardRow>
        </GlassPanel>

        <GlassPanel eyebrow="05 — FAQ" title="Frequently asked questions">
          <Flex direction="column" gap={5}>
            <Box>
              <Heading as="h3" fontSize="md" mb={2} color="white">
                How do I check how many Faerie Festival points my items are worth?
              </Heading>
              <Text
                fontSize="sm"
                color={DESCRIPTION_COLOR}
                maxW="70ch"
                css={{ textWrap: 'pretty' }}
              >
                Use the{' '}
                <Link asChild color="pink.200" fontWeight="semibold">
                  <MainLink
                    href="/tools/price-checker"
                    trackEvent="faeriefestival-hub-faq"
                    trackEventLabel="price-checker"
                  >
                    Price Checker
                  </MainLink>
                </Link>{' '}
                to see Faerie Festival points for items from your SDB, inventory, or shops. You can
                also{' '}
                <Link asChild color="pink.200" fontWeight="semibold">
                  <MainLink
                    href="/lists/import"
                    trackEvent="faeriefestival-hub-faq"
                    trackEventLabel="import-sdb"
                  >
                    import your Safety Deposit Box
                  </MainLink>
                </Link>{' '}
                and sort by recycling points.
              </Text>
            </Box>

            <Box>
              <Heading as="h3" fontSize="md" mb={2} color="white">
                When does the Faerie Festival run?
              </Heading>
              <Text
                fontSize="sm"
                color={DESCRIPTION_COLOR}
                maxW="70ch"
                css={{ textWrap: 'pretty' }}
              >
                Donations are accepted from {eventStartLabel} to {eventEndLabel}. Regular Faerie
                Quests resume as random events once the festival ends.
              </Text>
            </Box>

            <Box>
              <Heading as="h3" fontSize="md" mb={2} color="white">
                How many recycling points is each rarity worth?
              </Heading>
              <Text
                fontSize="sm"
                color={DESCRIPTION_COLOR}
                maxW="70ch"
                mb={4}
                css={{ textWrap: 'pretty' }}
              >
                Each rarity band links to every matching item on itemdb.
              </Text>
              <RecyclingPointsTable />
            </Box>

            <Box>
              <Heading as="h3" fontSize="md" mb={2} color="white">
                Is there a limit to how many points I can earn per day?
              </Heading>
              <Text
                fontSize="sm"
                color={DESCRIPTION_COLOR}
                maxW="70ch"
                css={{ textWrap: 'pretty' }}
              >
                Yes, there is a Daily Point Limit — any points from a single donation that go over
                it are lost, though you still keep the points up to the limit and that day&apos;s
                Donation Bonus Prize. Sort your{' '}
                <Link asChild color="pink.200" fontWeight="semibold">
                  <MainLink
                    href="/lists/import"
                    trackEvent="faeriefestival-hub-faq"
                    trackEventLabel="import-sdb-daily-limit"
                  >
                    imported SDB
                  </MainLink>
                </Link>{' '}
                by recycling points and donate in batches across multiple days instead of all at
                once, so high-value items aren&apos;t wasted over the limit.
              </Text>
            </Box>

            <Box>
              <Heading as="h3" fontSize="md" mb={2} color="white">
                Where do I see this year&apos;s Faerie Festival prizes?
              </Heading>
              <Text
                fontSize="sm"
                color={DESCRIPTION_COLOR}
                maxW="70ch"
                css={{ textWrap: 'pretty' }}
              >
                This hub collects itemdb&apos;s curated prize lists and search links for recycling
                tiers — prizes may come from the Prize Shop or other event rewards. Official prize
                details live on the{' '}
                <Link
                  href={officialEventUrl}
                  target="_blank"
                  rel="noreferrer"
                  color="pink.200"
                  fontWeight="semibold"
                  data-umami-event="faeriefestival-hub-faq"
                  data-umami-event-label="prizes-external"
                >
                  Neopets event page
                </Link>
                . Lists here update as prizes are catalogued.
              </Text>
            </Box>

            <Box>
              <Heading as="h3" fontSize="md" mb={2} color="white">
                What is the Faerie Donation Capsule?
              </Heading>
              <Text
                fontSize="sm"
                color={DESCRIPTION_COLOR}
                maxW="70ch"
                css={{ textWrap: 'pretty' }}
              >
                A bonus item you get for reaching the Daily Point Limit through donations. Opening
                it gives one item, with the rarity odds shown above.
              </Text>
            </Box>

            <Box>
              <Heading as="h3" fontSize="md" mb={2} color="white">
                What&apos;s the voting ballot I get for donating?
              </Heading>
              <Text
                fontSize="sm"
                color={DESCRIPTION_COLOR}
                maxW="70ch"
                css={{ textWrap: 'pretty' }}
              >
                Each donation also earns a ballot to vote for which Faerie(s) you&apos;d like to see
                join the Faerie Council. Voting doesn&apos;t affect your Prize Shop points — see the{' '}
                <Link
                  href={officialEventUrl}
                  target="_blank"
                  rel="noreferrer"
                  color="pink.200"
                  fontWeight="semibold"
                  data-umami-event="faeriefestival-hub-faq"
                  data-umami-event-label="voting-external"
                >
                  official event page
                </Link>{' '}
                for how voting works.
              </Text>
            </Box>
          </Flex>
        </GlassPanel>
      </Flex>
    </>
  );
}

function RecyclingPointsTable() {
  return (
    <Box
      maxW="520px"
      borderRadius="lg"
      bg="whiteAlpha.100"
      border="1px solid"
      borderColor="whiteAlpha.200"
      overflow="hidden"
    >
      <Box px={4} pt={3} pb={1}>
        <Text fontSize="xs" letterSpacing="0.16em" textTransform="uppercase" color="pink.200">
          Recycling chart
        </Text>
      </Box>
      <Table.Root
        size="sm"
        variant="line"
        css={{
          '& th, & td': { borderColor: 'whiteAlpha.200' },
          '& tbody tr:last-child td': { borderBottomWidth: 0 },
        }}
      >
        <Table.Caption
          captionSide="top"
          textAlign="start"
          px={4}
          pb={2}
          fontSize="xs"
          fontStyle="normal"
          color={LABEL_COLOR}
        >
          Official Faerie Festival 2026 point values
        </Table.Caption>
        <Table.Header>
          <Table.Row bg="whiteAlpha.50">
            <Table.ColumnHeader
              ps={4}
              py={2}
              color={LABEL_COLOR}
              fontSize="xs"
              letterSpacing="0.16em"
              textTransform="uppercase"
              fontWeight="semibold"
            >
              Rarity
            </Table.ColumnHeader>
            <Table.ColumnHeader
              pe={4}
              py={2}
              color={LABEL_COLOR}
              fontSize="xs"
              letterSpacing="0.16em"
              textTransform="uppercase"
              fontWeight="semibold"
              textAlign="end"
            >
              Points
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {recyclingTiers.map((tier) => (
            <Table.Row key={tier.rarityRange} bg="blackAlpha.400">
              <Table.Cell
                ps={4}
                py={3}
                verticalAlign="middle"
                boxShadow={`inset 3px 0 0 ${tier.color}`}
              >
                <Link asChild _hover={{ textDecoration: 'none' }}>
                  <MainLink
                    href={tier.link}
                    prefetch={false}
                    trackEvent="faeriefestival-hub-faq"
                    trackEventLabel={`recycling-table-${tier.rarityRange}`}
                  >
                    <Badge bg={tier.color} color={chipTextColor(tier.color)}>
                      {tier.rarityRange}
                    </Badge>
                  </MainLink>
                </Link>
              </Table.Cell>
              <Table.Cell pe={4} py={3} textAlign="end" verticalAlign="middle">
                <Link asChild _hover={{ textDecoration: 'none' }}>
                  <MainLink
                    href={tier.link}
                    prefetch={false}
                    trackEvent="faeriefestival-hub-faq"
                    trackEventLabel={`recycling-table-${tier.rarityRange}`}
                  >
                    <Text
                      as="span"
                      fontSize="2xl"
                      fontWeight="black"
                      color={legibleAccent(tier.color)}
                      lineHeight={1}
                    >
                      {tier.points}
                    </Text>
                  </MainLink>
                </Link>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

function GlassPanel({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Box
      id={id}
      borderRadius="2xl"
      p={[4, 3]}
      bg="gray.700"
      bgGradient={`linear-gradient(to top, transparent 0%, ${PANEL_WASH} 100%)`}
      border="1px solid"
      borderColor="whiteAlpha.200"
      boxShadow="0 20px 45px -28px rgba(0,0,0,.55)"
    >
      <Text fontSize="xs" letterSpacing="0.2em" color="pink.200" textTransform="uppercase" mb={1}>
        {eyebrow}
      </Text>
      <Heading as="h2" fontSize={['2xl', '3xl']} mb={description ? 2 : 5}>
        {title}
      </Heading>
      {description ? (
        <Text fontSize="sm" color={DESCRIPTION_COLOR} maxW="560px" mb={5}>
          {description}
        </Text>
      ) : null}
      {children}
    </Box>
  );
}

function CardRow({ children }: { children: ReactNode }) {
  return (
    <Flex gap={3} flexWrap="wrap" alignItems="stretch">
      {children}
    </Flex>
  );
}
