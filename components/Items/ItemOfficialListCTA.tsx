import type { ReactNode } from 'react';
import { Flex, Link, Text } from '@chakra-ui/react';
import { getTranslations } from 'next-intl/server';
import { LuPlus } from 'react-icons/lu';
import { Link as I18nLink } from '@i18n/navigation';
import { OFFICIAL_CRITERIA_URL } from '@utils/list/officialListLinks';
import ItemSuggestToListTrigger from '@components/Items/ItemSuggestToListTrigger';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
  /** Official lists that already hold the item (left out of the "suggest to a list" picker). */
  excludeListIds: number[];
  /** Link color derived from the item color (same as the list links in the card). */
  linkColor: string;
  /**
   * `empty`: the item has no official list (dashed tiles);
   * `footer`: small centered line at the end of the card, after the item's official lists.
   */
  placement: 'empty' | 'footer';
};

/**
 * Official lists CTAs on the item page card, one per intent:
 * - suggest this item to an existing official list (opens the suggestion modal);
 * - make a new list official. Links to the criteria (not straight to the apply modal), since only
 *   lists that are truly useful to the community qualify.
 */
export default async function ItemOfficialListCTA(props: Props) {
  const { item, excludeListIds, linkColor, placement } = props;
  const t = await getTranslations();

  if (placement === 'footer') {
    return (
      <Text mt={3} textAlign="center" fontSize="xs" color="whiteAlpha.700">
        {t.rich('ItemPage.official-cta-footer', {
          Suggest: (chunk) => (
            <ItemSuggestToListTrigger
              item={item}
              excludeListIds={excludeListIds}
              trackLabel="item-footer"
              color={linkColor}
            >
              <Link asChild color={linkColor}>
                <span>{chunk}</span>
              </Link>
            </ItemSuggestToListTrigger>
          ),
          Link: (chunk) => (
            <Link asChild color={linkColor}>
              <I18nLink
                href={OFFICIAL_CRITERIA_URL}
                data-umami-event="official-criteria-cta"
                data-umami-event-label="item-footer"
              >
                {chunk}
              </I18nLink>
            </Link>
          ),
        })}
      </Text>
    );
  }

  // empty: dashed "empty slot" tiles shaped like the official list tiles
  return (
    <Flex gap={3} flexWrap="wrap" justifyContent="center">
      <ItemSuggestToListTrigger
        item={item}
        excludeListIds={excludeListIds}
        trackLabel={`item-${placement}`}
      >
        <CtaTile
          title={t('ItemPage.official-cta-suggest-title')}
          text={t('ItemPage.official-cta-suggest-text')}
          action={t('ItemPage.official-cta-suggest-link')}
          linkColor={linkColor}
        />
      </ItemSuggestToListTrigger>
      <Link asChild _hover={{ textDecoration: 'none' }}>
        <I18nLink
          href={OFFICIAL_CRITERIA_URL}
          data-umami-event="official-criteria-cta"
          data-umami-event-label={`item-${placement}`}
        >
          <CtaTile
            title={t('ItemPage.official-cta-tile-title')}
            text={t('ItemPage.official-cta-tile-text')}
            action={t('ItemPage.official-cta-tile-link')}
            linkColor={linkColor}
          />
        </I18nLink>
      </Link>
    </Flex>
  );
}

type CtaTileProps = {
  title: ReactNode;
  text: ReactNode;
  action: ReactNode;
  linkColor: string;
};

/** Dashed "empty slot" tile with a plus icon, shaped like the official list tiles. */
function CtaTile({ title, text, action, linkColor }: CtaTileProps) {
  return (
    <Flex
      py={2}
      px={3}
      mt="13px"
      w="200px"
      h="calc(100% - 13px)"
      flexFlow="column"
      alignItems="center"
      gap={1}
      borderRadius="md"
      border="1px dashed"
      borderColor="whiteAlpha.400"
      transition="all 0.15s"
      _hover={{ borderColor: 'whiteAlpha.700', bg: 'blackAlpha.300' }}
    >
      <Flex
        mt="-20px"
        w="40px"
        h="40px"
        flexShrink={0}
        borderRadius="md"
        bg="gray.700"
        border="1px dashed"
        borderColor="whiteAlpha.500"
        alignItems="center"
        justifyContent="center"
        color="whiteAlpha.800"
      >
        <LuPlus />
      </Flex>
      <Text fontSize="sm" fontWeight="bold" color="white" textAlign="center">
        {title}
      </Text>
      <Text fontSize="xs" textAlign="center" color="whiteAlpha.700" css={{ textWrap: 'pretty' }}>
        {text}
      </Text>
      <Text fontSize="xs" fontWeight="bold" color={linkColor} mt="auto">
        {action}
      </Text>
    </Flex>
  );
}
