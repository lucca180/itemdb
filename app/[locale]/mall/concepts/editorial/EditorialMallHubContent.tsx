import {
  Badge,
  Box,
  Center,
  Flex,
  Grid,
  Heading,
  HStack,
  Image,
  Separator,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { HomeCard } from '@components/Card/HomeCard';
import { HorizontalHomeCard } from '@components/Card/HorizontalHomeCard';
import { FeaturedListsGrid } from '@components/Home/FeaturedListsGrid';
import ItemCardV2 from '@components/Items/v2/ItemCardV2';
import MainLink from '@components/Utils/MainLink';
import { ComboTile } from '@app/[locale]/rainbow-pool/components/ComboTile';
import { StyleTokenTile } from '@app/[locale]/rainbow-pool/pet-styles/components/StyleTokenTile';
import {
  activeNcEvents,
  leavingMallItems,
  lebronUpdates,
  mallCapsules,
  newMallItems,
  onSaleMallItems,
  popularNcItems,
  recentPetStyles,
  recentStyleCombos,
  studioAvailableNow,
  NC_MALL_HUB_QUICK_LINKS,
  NC_MALL_HUB_THEME,
} from '@app/[locale]/mall/_mock/ncMallHubFixtures';
import { EditorialFeatureStory } from './EditorialFeatureStory';
import { LebronDesk } from './LebronDesk';
import {
  EDITORIAL_UNIQUE_ID,
  EditorialPanel,
  ItemStrip,
  Kicker,
  SectionHeader,
  StripAside,
} from './EditorialPieces';
import {
  formatDayMonth,
  formatIssueDate,
  getDiscountPercent,
  getMallPricing,
  getSaleEndTime,
  leavingCaption,
  newArrivalCaption,
  saleCaption,
} from './editorialFormat';

const ISSUE_DATE = '2026-08-21T00:00:00.000Z';

const [coverStory, ...restOfDrop] = newMallItems;

const deepestCut = [...onSaleMallItems].sort(
  (a, b) => (getDiscountPercent(b) ?? 0) - (getDiscountPercent(a) ?? 0)
)[0];

const nextOut = [...leavingMallItems].sort((a, b) => getSaleEndTime(a) - getSaleEndTime(b))[0];
const nextOutEnd = getMallPricing(nextOut)?.saleEnd;

const CONTENTS = [
  `${newMallItems.length} new items`,
  `${onSaleMallItems.length} on sale`,
  `${leavingMallItems.length} leaving soon`,
  `${lebronUpdates.length} value updates`,
  `${activeNcEvents.length} attractions`,
];

export function EditorialMallHubContent() {
  return (
    <>
      <Box
        position="absolute"
        h="720px"
        left="0"
        width="100%"
        bgGradient="linear-gradient(to top,rgba(0,0,0,0) 0,rgba(205,193,255,.55) 70%)"
        zIndex={-1}
      />

      <Flex
        direction="column"
        gap={{ base: 12, md: 20 }}
        maxW="1240px"
        mx="auto"
        px={{ base: 2, md: 4 }}
        pb={{ base: 12, md: 20 }}
      >
        <Center flexFlow="column" gap={4} pt={{ base: 4, md: 6 }} textAlign="center">
          <Box
            w="100%"
            maxW="760px"
            h={{ base: '130px', md: '200px' }}
            overflow="hidden"
            borderRadius="lg"
            boxShadow="lg"
          >
            <Image
              src={NC_MALL_HUB_THEME.banner}
              alt="NC Mall shopkeeper"
              w="100%"
              h="100%"
              objectFit="cover"
              objectPosition="center"
            />
          </Box>
          <Badge colorPalette="purple" variant="solid">
            Design mock · Editorial
          </Badge>
          <Kicker color="whiteAlpha.700">NC Mall dispatch · {formatIssueDate(ISSUE_DATE)}</Kicker>
          <Heading as="h1" size={{ base: '3xl', md: '5xl' }} css={{ textWrap: 'balance' }}>
            The NC Mall, this week
          </Heading>
          <Text
            maxW="60ch"
            color="whiteAlpha.800"
            fontSize={{ base: 'sm', md: 'md' }}
            css={{ textWrap: 'pretty' }}
          >
            What just dropped, what is discounted, what is about to disappear, and how Lebron
            repriced the caps market — one read, then straight into itemdb.
          </Text>
          <HStack
            gap={3}
            flexWrap="wrap"
            justify="center"
            fontSize="2xs"
            letterSpacing="0.12em"
            textTransform="uppercase"
            color="whiteAlpha.600"
            mt={1}
          >
            {CONTENTS.map((entry, index) => (
              <HStack gap={3} key={entry}>
                {index > 0 && <Text aria-hidden>·</Text>}
                <Text>{entry}</Text>
              </HStack>
            ))}
          </HStack>
        </Center>

        <Grid
          templateColumns={{ base: '1fr', lg: 'minmax(0, 2.1fr) minmax(0, 1fr)' }}
          gap={{ base: 6, lg: 8 }}
          alignItems="start"
        >
          <EditorialFeatureStory item={coverStory} alsoNew={restOfDrop} />
          <LebronDesk updates={lebronUpdates} />
        </Grid>

        <Flex direction="column" gap={5}>
          <SectionHeader
            kicker="Price watch"
            kickerColor="orange.200"
            title="On sale right now"
            lede="Discounts that expire on their own schedule — the price shown is what the mall is charging today."
            link={{ href: '/search?type=nc', label: 'Browse NC items' }}
          />
          <HorizontalHomeCard
            color="#FB923C"
            image={NC_MALL_HUB_THEME.icon}
            title="Marked down"
            w={46}
            h={46}
            isSmall
            bgOpacity="0.14"
            viewAllLink="/search?type=nc"
            viewAllText="View all"
          >
            <Flex direction={{ base: 'column', lg: 'row' }} gap={{ base: 0, lg: 6 }}>
              <Box flex={1} minW={0}>
                <ItemStrip
                  cells={onSaleMallItems.map((item) => ({ item, caption: saleCaption(item) }))}
                />
              </Box>
              <StripAside
                kicker="Deepest cut"
                kickerColor="orange.200"
                title={deepestCut.name}
                detail={`${getDiscountPercent(deepestCut)}% off — the steepest markdown on the floor right now. ${saleCaption(deepestCut)}.`}
              />
            </Flex>
          </HorizontalHomeCard>
        </Flex>

        <Flex direction="column" gap={5}>
          <SectionHeader
            kicker="Last call"
            title="Leaving the mall soon"
            lede="Once these rotate out, the only way in is the NC trading market — usually at a cap premium."
            link={{ href: '/mall/leaving', label: 'Full leaving list' }}
          />
          <HorizontalHomeCard
            color="#8B5CF6"
            image={NC_MALL_HUB_THEME.icon}
            title="Final days"
            w={46}
            h={46}
            isSmall
            bgOpacity="0.2"
            viewAllLink="/mall/leaving"
            viewAllText="View all"
          >
            <Flex direction={{ base: 'column', lg: 'row' }} gap={{ base: 0, lg: 6 }}>
              <Box flex={1} minW={0}>
                <ItemStrip
                  cells={leavingMallItems.map((item) => ({ item, caption: leavingCaption(item) }))}
                />
              </Box>
              <StripAside
                kicker="Next out the door"
                title={nextOut.name}
                detail={
                  nextOutEnd
                    ? `Off the shelves on ${formatDayMonth(nextOutEnd)} — the first of this batch to go.`
                    : 'The first of this batch to go.'
                }
              />
            </Flex>
          </HorizontalHomeCard>
        </Flex>

        <Flex direction="column" gap={6}>
          <SectionHeader
            kicker="Happening now"
            title="Events & attractions"
            lede="Official lists covering the attractions, rotations, and plot prizes the mall is running this month."
            link={{ href: '/lists/official', label: 'All official lists' }}
          />
          <FeaturedListsGrid
            lists={activeNcEvents}
            utmContent="mall-hub-editorial-events"
            isSmall
          />
        </Flex>

        <EditorialPanel>
          <Flex direction="column" gap={6}>
            <SectionHeader
              kicker="Styling studio"
              title="Recent Pet Styles"
              lede={`Tokens released over the past two weeks — ${studioAvailableNow.length} of them are still stocked in the Styling Studio.`}
              link={{ href: '/rainbow-pool/pet-styles', label: 'Pet Styles hub' }}
            />
            <SimpleGrid columns={{ base: 2, sm: 3, lg: 6 }} gap={3}>
              {recentPetStyles.map((token) => (
                <StyleTokenTile key={token.id} token={token} linkTo="item" />
              ))}
            </SimpleGrid>
            <Separator borderColor="whiteAlpha.200" />
            <Flex direction="column" gap={3}>
              <Kicker color="whiteAlpha.700">Fresh combinations</Kicker>
              <SimpleGrid columns={{ base: 2, sm: 4 }} gap={3}>
                {recentStyleCombos.map((combo) => (
                  <ComboTile
                    key={combo.href}
                    combo={combo}
                    compact
                    releasedLabel={formatDayMonth(combo.addedAt.toISOString())}
                  />
                ))}
              </SimpleGrid>
            </Flex>
          </Flex>
        </EditorialPanel>

        <Grid
          templateColumns={{ base: '1fr', lg: 'minmax(0, 1.1fr) minmax(0, 1fr)' }}
          gap={{ base: 6, lg: 8 }}
          alignItems="stretch"
        >
          <Flex direction="column" gap={4}>
            <Kicker>Trading floor</Kicker>
            <HomeCard
              title="Popular NC items"
              image={NC_MALL_HUB_THEME.icon}
              color="#B794F4"
              items={popularNcItems}
              href="/search?type=nc"
              linkText="Search NC items"
              utm_content="mall-hub-editorial-popular"
              perPage={6}
            />
          </Flex>

          <Flex direction="column" gap={4}>
            <Kicker color="yellow.200">Capsule watch</Kicker>
            <EditorialPanel>
              <Flex direction="column" gap={5} h="100%">
                <Flex direction="column" gap={2}>
                  <Heading as="h2" size="lg">
                    Openable capsules
                  </Heading>
                  <Text fontSize="sm" color="whiteAlpha.700" css={{ textWrap: 'pretty' }}>
                    Capsules carry their own cap range because the contents trade separately from
                    the mall price.
                  </Text>
                </Flex>
                <Flex gap={4} flexWrap="wrap">
                  {mallCapsules.map((capsule) => (
                    <Flex key={capsule.internal_id} direction="column" gap={2} w="150px">
                      <ItemCardV2 item={capsule} uniqueID={EDITORIAL_UNIQUE_ID} />
                      <Text fontSize="2xs" color="whiteAlpha.600" lineHeight="1.4">
                        {newArrivalCaption(capsule)}
                        {capsule.ncValue && ` · ${capsule.ncValue.range} caps`}
                      </Text>
                    </Flex>
                  ))}
                </Flex>
              </Flex>
            </EditorialPanel>
          </Flex>
        </Grid>

        <Flex direction="column" gap={5}>
          <SectionHeader
            kicker="The mall desk"
            title="Keep reading"
            lede="Shortcuts into the tools behind every number on this page."
          />
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={3}>
            {NC_MALL_HUB_QUICK_LINKS.map((link) => (
              <MainLink key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                <Flex
                  direction="column"
                  gap={1}
                  h="100%"
                  p={4}
                  bg="gray.700"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="whiteAlpha.200"
                  transition="background 0.15s, transform 0.15s"
                  _hover={{ bg: 'gray.600', transform: 'translateY(-2px)' }}
                >
                  <Text fontWeight="bold" fontSize="sm">
                    {link.label}
                  </Text>
                  <Text fontSize="xs" color="whiteAlpha.700">
                    {link.description}
                  </Text>
                </Flex>
              </MainLink>
            ))}
          </SimpleGrid>
        </Flex>
      </Flex>
    </>
  );
}
