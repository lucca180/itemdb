import {
  Box,
  Center,
  Flex,
  Heading,
  Link,
  Separator,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { getFormatter, getTranslations } from 'next-intl/server';
import { createPoolBreadcrumbList, PoolBreadcrumbs } from '@components/Breadcrumbs/PoolBreadcrumbs';
import MainLink from '@components/Utils/MainLink';
import { getCachedNow } from '@utils/getCachedNow';
import { petColorSlug } from '@utils/pet-utils';
import { POPULAR_COLOR_NAMES, type RainbowPoolComboTile } from '@utils/petColorTool';
import { buildRainbowPoolLabels } from '../buildRainbowPoolLabels';
import { ComboTile } from './ComboTile';
import { RainbowPoolPicker } from './RainbowPoolPicker';
import { BASE_PATH, RainbowPoolShell } from './RainbowPoolShell';

type HubContentProps = {
  locale: string;
  colors: string[];
  species: string[];
  recentlyReleased: RainbowPoolComboTile[];
};

export async function HubContent({ locale, colors, species, recentlyReleased }: HubContentProps) {
  const [t, labels, formatter, now] = await Promise.all([
    getTranslations(),
    buildRainbowPoolLabels(),
    getFormatter(),
    getCachedNow(),
  ]);

  const popularColors = POPULAR_COLOR_NAMES.map((name) => ({
    name,
    href: `${BASE_PATH}/${petColorSlug(name)}`,
  }));

  return (
    <RainbowPoolShell>
      <PoolBreadcrumbs breadcrumbList={createPoolBreadcrumbList(t)} locale={locale} />

      <Center flexFlow="column" gap={3} textAlign="center" mt={4} mb={8}>
        <Text fontSize="sm" color="whiteAlpha.700" letterSpacing="0.04em" textTransform="uppercase">
          {labels.eyebrowLabel}
        </Text>
        <Heading as="h1" size="2xl">
          {labels.toolTitle}
        </Heading>
        <Text maxW="640px" color="whiteAlpha.900" css={{ textWrap: 'pretty' }}>
          {labels.cta}
        </Text>
        <RainbowPoolPicker
          colors={colors}
          species={species}
          selectColorLabel={labels.selectColorLabel}
          selectSpeciesLabel={labels.selectSpeciesLabel}
          searchLabel={labels.searchLabel}
        />
      </Center>

      <VStack align="stretch" gap={8} maxW="1100px" mx="auto" px={2}>
        {recentlyReleased.length > 0 && (
          <Box>
            <Flex justify="space-between" align="baseline" mb={3} gap={2} flexWrap="wrap">
              <Heading as="h2" size="md">
                {labels.recentlyReleasedTitle}
              </Heading>
            </Flex>
            <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} gap={3}>
              {recentlyReleased.map((combo) => (
                <ComboTile
                  key={combo.href}
                  combo={combo}
                  releasedLabel={formatter.relativeTime(combo.addedAt, now)}
                />
              ))}
            </SimpleGrid>
          </Box>
        )}

        <Box>
          <Heading as="h2" size="md" mb={3}>
            {labels.popularColorsTitle}
          </Heading>
          <Flex flexWrap="wrap" gap={2}>
            {popularColors.map((color) => (
              <Link
                key={color.name}
                asChild
                px={3}
                py={1.5}
                borderRadius="full"
                bg="blackAlpha.500"
                fontSize="sm"
                _hover={{ bg: 'blackAlpha.700' }}
              >
                <MainLink href={color.href}>{color.name}</MainLink>
              </Link>
            ))}
          </Flex>
        </Box>

        <Box>
          <Heading as="h2" size="md" mb={3}>
            {labels.howItWorksTitle}
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
            {labels.howItWorksSteps.map((step, i) => (
              <Flex
                key={step}
                gap={3}
                p={3}
                bg="blackAlpha.400"
                borderRadius="lg"
                align="flex-start"
              >
                <Text fontWeight="bold" color="teal.200">
                  {i + 1}.
                </Text>
                <Text fontSize="sm">{step}</Text>
              </Flex>
            ))}
          </SimpleGrid>
        </Box>

        <Separator borderColor="whiteAlpha.200" />
      </VStack>
    </RainbowPoolShell>
  );
}
