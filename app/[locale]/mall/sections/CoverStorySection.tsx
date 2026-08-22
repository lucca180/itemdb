import { Suspense } from 'react';
import { Badge, Flex, Heading, Link, Separator, Skeleton, Text } from '@chakra-ui/react';
import Color from 'color';
import { getFormatter, getTranslations } from 'next-intl/server';
import MainLink from '@components/Utils/MainLink';
import { getMallCoverStory } from '@app/server/ncMallHub';
import type { ItemV2For } from '@types';
import { CoverPreview } from './CoverPreview';
import { CoverFoundInCard } from './CoverFoundInCard';
import { MallItemStrip } from './MallItemStrip';

function CoverStorySkeleton() {
  return (
    <Skeleton
      w="100%"
      minW={0}
      h={{ base: '420px', md: '480px' }}
      borderRadius="xl"
      bg="gray.700"
    />
  );
}

export function CoverStorySection() {
  return (
    <Suspense fallback={<CoverStorySkeleton />}>
      <CoverStoryContent />
    </Suspense>
  );
}

function mallPrice(item: ItemV2For<'card'>) {
  if (item.price?.type !== 'ncMall') return null;
  return item.price;
}

async function CoverStoryContent() {
  const [story, t, format] = await Promise.all([
    getMallCoverStory(),
    getTranslations(),
    getFormatter(),
  ]);

  if (!story) return null;

  const { cover, alsoNew, foundIn, isLE, wearableZones } = story;
  const pricing = mallPrice(cover);
  const accent = Color(cover.colorHex ?? '#CDC1FF');
  const wash = accent.alpha(0.4).hexa();
  const saleBegin = pricing?.saleBegin ? new Date(pricing.saleBegin) : null;
  const addedLabel = saleBegin
    ? format.dateTime(saleBegin, { day: 'numeric', month: 'short' })
    : null;
  const priceLabel = pricing && pricing.price > 0 ? `${format.number(pricing.price)} NC` : null;

  const captionFor = (item: ItemV2For<'card'>) => {
    const mall = mallPrice(item);
    if (!mall?.saleBegin) return t('NcMall.cover-also-new');
    return format.dateTime(new Date(mall.saleBegin), { day: 'numeric', month: 'short' });
  };

  return (
    <Flex
      as="section"
      direction="column"
      gap={{ base: 5, md: 6 }}
      w="100%"
      minW={0}
      overflow="hidden"
      bg="gray.700"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      p={{ base: 4, md: 6 }}
      bgGradient={`linear-gradient(to bottom, ${wash}, transparent 60%)`}
    >
      <Text
        fontSize="xs"
        fontWeight="bold"
        letterSpacing="0.16em"
        textTransform="uppercase"
        color="purple.200"
      >
        {t('NcMall.cover-kicker-mall')}
        {addedLabel ? ` · ${addedLabel}` : ''}
      </Text>

      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap={{ base: 4, md: 6 }}
        align={{ base: 'stretch', md: 'center' }}
        minW={0}
      >
        <Flex
          direction="column"
          gap={2}
          flexShrink={0}
          w={{ base: '160px', md: '200px' }}
          alignSelf={{ base: 'center', md: 'flex-start' }}
        >
          <CoverPreview
            imageId={cover.image.id}
            imageHash={cover.image.hash}
            name={cover.name}
            description={cover.description}
          />
          {foundIn && <CoverFoundInCard foundIn={foundIn} label={t('NcMall.cover-found-in')} />}
        </Flex>

        <Flex direction="column" gap={3} minW={0} flex={1}>
          <Heading
            as="h2"
            size={{ base: 'xl', md: '2xl' }}
            lineHeight="1.15"
            lineClamp={{ base: 3, md: 2 }}
            title={cover.name}
            minW={0}
            css={{ textWrap: 'balance', overflowWrap: 'anywhere' }}
          >
            {cover.name}
          </Heading>
          {cover.description && (
            <Text
              color="whiteAlpha.800"
              fontSize={{ base: 'sm', md: 'md' }}
              maxW="52ch"
              lineClamp={4}
              css={{ textWrap: 'pretty' }}
            >
              {cover.description}
            </Text>
          )}
          <Flex gap={2} flexWrap="wrap">
            {priceLabel && (
              <Badge colorPalette="purple" variant="solid">
                {priceLabel}
              </Badge>
            )}
            {isLE && (
              <Badge colorPalette="green" variant="subtle">
                LE
              </Badge>
            )}
            {wearableZones.map((zone) => (
              <Badge key={zone} colorPalette="gray">
                {zone}
              </Badge>
            ))}
            {cover.ncValue && <Badge colorPalette="yellow">{cover.ncValue.range} caps</Badge>}
          </Flex>
          <Link asChild color="purple.200" fontWeight="semibold" w="fit-content">
            <MainLink
              href={`/item/${cover.slug ?? cover.internal_id}`}
              aria-label={`${t('NcMall.cover-open')}: ${cover.name}`}
            >
              {t('NcMall.cover-open')} →
            </MainLink>
          </Link>
        </Flex>
      </Flex>

      {alsoNew.length > 0 && (
        <>
          <Separator borderColor="whiteAlpha.200" />
          <Flex direction="column" gap={3} minW={0} w="100%" overflow="hidden">
            <Text
              fontSize="xs"
              fontWeight="bold"
              letterSpacing="0.16em"
              textTransform="uppercase"
              color="purple.200"
            >
              {t('NcMall.cover-also-new')}
            </Text>
            <MallItemStrip items={alsoNew} captionFor={captionFor} />
          </Flex>
        </>
      )}
    </Flex>
  );
}
