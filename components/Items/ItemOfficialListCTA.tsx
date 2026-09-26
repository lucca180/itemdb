import { Flex, Link, Text } from '@chakra-ui/react';
import { getTranslations } from 'next-intl/server';
import { LuPlus } from 'react-icons/lu';
import { Link as I18nLink } from '@i18n/navigation';
import { OFFICIAL_CRITERIA_URL } from '@utils/list/officialListLinks';

type Props = {
  /** Link color derived from the item color (same as the list links in the card). */
  linkColor: string;
  /** `empty`: the item has no official list; `grid`: last tile after the item's official lists. */
  placement: 'empty' | 'grid';
};

/**
 * "Make your list official" CTA on the item page official lists card: a dashed "empty slot"
 * shaped like the official list tiles. Links to the criteria (not straight to the apply modal),
 * since only lists that are truly useful to the community qualify.
 */
export default async function ItemOfficialListCTA({ linkColor, placement }: Props) {
  const t = await getTranslations();

  return (
    <Link asChild _hover={{ textDecoration: 'none' }}>
      <I18nLink
        href={OFFICIAL_CRITERIA_URL}
        data-umami-event="official-criteria-cta"
        data-umami-event-label={`item-${placement}`}
      >
        <Flex
          py={2}
          px={3}
          mt="13px"
          w="200px"
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
          <Text fontSize="sm" fontWeight="bold" color="white">
            {t('ItemPage.official-cta-tile-title')}
          </Text>
          <Text
            fontSize="xs"
            textAlign="center"
            color="whiteAlpha.700"
            css={{ textWrap: 'pretty' }}
          >
            {t('ItemPage.official-cta-tile-text')}
          </Text>
          <Text fontSize="xs" fontWeight="bold" color={linkColor}>
            {t('ItemPage.official-cta-tile-link')}
          </Text>
        </Flex>
      </I18nLink>
    </Link>
  );
}
