import { Accordion, Box, Center, Flex, Link, Text } from '@chakra-ui/react';
import { Fragment, Suspense } from 'react';
import Color from 'color';
import CardBase from '@components/Card/CardBase';
import ItemCard from '@components/Items/ItemCard';
import { IconLink } from '@components/Utils/IconLink';
import { Link as I18nLink } from '@i18n/navigation';
import { loadPetpetData } from '@app/utils/loadUtils';
import { getTranslations } from 'next-intl/server';
import type { ItemData } from '@types';
import type { ReactNode } from 'react';

type Props = {
  item: ItemData;
};

function richSearchLink(href: string, linkColor: string) {
  const RichLink = (children: ReactNode) => (
    <Link asChild color={linkColor}>
      <I18nLink href={href}>{children}</I18nLink>
    </Link>
  );
  RichLink.displayName = 'RichSearchLink';
  return RichLink;
}

function richIconLink(href: string, linkColor: string) {
  const RichLink = (children: ReactNode) => (
    <IconLink href={href} isExternal color={linkColor}>
      {children}
    </IconLink>
  );
  RichLink.displayName = 'RichIconLink';
  return RichLink;
}

export async function PetpetCard({ item }: Props) {
  if (item.isNC || item.isWearable || item.isBD || item.isNeohome) return null;

  return (
    <Suspense fallback={null}>
      <PetpetCardContent item={item} />
    </Suspense>
  );
}

async function PetpetCardContent({ item }: Props) {
  const [petpetData, t] = await Promise.all([loadPetpetData(item.internal_id), getTranslations()]);

  if (!petpetData) return null;

  const linkColor = Color(item.color.hex).lightness(70).hex();

  return (
    <CardBase title={t('ItemPage.petpet-puddle')} color={item.color.hex}>
      <Flex gap={3} wrap="wrap" alignItems="center" flexFlow="column">
        {petpetData.isUnpaintable && (
          <Text fontSize="sm" textAlign="center">
            {t('ItemPage.unpaintable-p2')}
          </Text>
        )}
        {petpetData.isCanonical && (
          <Text fontSize="sm" textAlign="center">
            {t.rich('ItemPage.color-is-base-color', {
              b: (chunk) => <b>{chunk}</b>,
              ColorLink: richSearchLink(
                `/search?s=&petpetColor[]=${petpetData.color.id}`,
                linkColor
              ),
              SpeciesLink: richSearchLink(
                `/search?s=&petpetSpecies[]=${petpetData.species.id}`,
                linkColor
              ),
              color: petpetData.color.name,
              species: petpetData.species.name,
            })}
            <br />
            {!petpetData.isUnpaintable &&
              t.rich('ItemPage.p2-p2-at-puddle', {
                b: (chunk) => <b>{chunk}</b>,
                Link: richSearchLink(
                  `/search?s=&petpetSpecies[]=${petpetData.species.id}`,
                  linkColor
                ),
              })}
          </Text>
        )}
        {petpetData.cheapest && (
          <>
            <Text fontSize="sm" textAlign="center">
              {t('ItemPage.cheapest-way-to-get-this-petpet')}
            </Text>
            <Flex
              minW="50%"
              wrap="wrap"
              gap={2}
              justifyContent="center"
              bg="blackAlpha.600"
              p={3}
              borderRadius="md"
            >
              {petpetData.cheapest.items.map((cheapestItem, index) => (
                <Fragment key={cheapestItem.internal_id}>
                  <ItemCard uniqueID="cheapest" item={cheapestItem} small />
                  {index + 1 < petpetData.cheapest!.items.length && <Center>+</Center>}
                </Fragment>
              ))}
            </Flex>
          </>
        )}
        {petpetData.toCanonical && (
          <>
            <Text fontSize="sm" textAlign="center">
              {t.rich('ItemPage.p2-paint-base-color', {
                name: petpetData.toCanonical.pb.name,
                b: (chunk) => <b>{chunk}</b>,
                species: petpetData.species.name,
                SpeciesLink: richSearchLink(
                  `/search?s=&petpetSpecies[]=${petpetData.species.id}`,
                  linkColor
                ),
                Link: richIconLink('https://www.neopets.com/pool/puddle.phtml', linkColor),
              })}
            </Text>
            <Flex
              minW="50%"
              wrap="wrap"
              gap={2}
              alignItems="stretch"
              justifyContent="center"
              bg="blackAlpha.600"
              p={3}
              borderRadius="md"
            >
              <ItemCard uniqueID="toCanonical" item={petpetData.petpet} small />
              <Center>+</Center>
              <ItemCard uniqueID="toCanonical" item={petpetData.toCanonical.pb} small />
              <Center>=</Center>
              <ItemCard uniqueID="toCanonical" item={petpetData.toCanonical.p2} small />
            </Flex>
          </>
        )}
        {petpetData.alternativeWays && petpetData.alternativeWays.length > 0 && (
          <Accordion.Root collapsible minW="70%" variant="enclosed">
            <Accordion.Item value="alternatives" bg="blackAlpha.300">
              <Accordion.ItemTrigger>
                <Box as="span" flex="1" fontSize="sm" textAlign="left">
                  {t('ItemPage.other-ways-of-getting-this-petpet')}
                </Box>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody pb={4}>
                  <Flex flexFlow="column" gap={5}>
                    {petpetData.alternativeWays.map((way, wayIndex) => (
                      <Flex
                        key={wayIndex}
                        minW="50%"
                        wrap="wrap"
                        gap={2}
                        justifyContent="center"
                        bg="blackAlpha.600"
                        p={3}
                        borderRadius="md"
                      >
                        {way.map((wayItem, index) => (
                          <Fragment key={wayItem.internal_id}>
                            <ItemCard
                              uniqueID={`alternatives_${wayItem.internal_id}`}
                              item={wayItem}
                              small
                            />
                            {index + 1 < way.length && <Center>+</Center>}
                          </Fragment>
                        ))}
                      </Flex>
                    ))}
                  </Flex>
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>
          </Accordion.Root>
        )}
      </Flex>
    </CardBase>
  );
}

export default PetpetCard;
