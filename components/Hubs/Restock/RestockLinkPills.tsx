import { Badge, Box, Flex, Image, Link, Text } from '@chakra-ui/react';
import MainLink from '@components/Utils/MainLink';

export const RESTOCK_PILL_ICONS = {
  shop: 'https://images.neopets.com/themes/h5/basic/images/v3/shop-icon.svg',
  itemdb: '/logo_icon.svg',
} as const;

export type RestockLinkPill = {
  /** Also sent as the Umami event label */
  id: string;
  href: string;
  /** Icon shown in a small box before the label; omit for a text-only pill */
  image?: string;
  label: string;
  /** Optional highlight shown before the label, e.g. "new" */
  badge?: string;
};

type RestockLinkPillsProps = {
  pills: RestockLinkPill[];
  /** Umami event fired on click, with the pill id as its label */
  trackEvent: string;
  /** `sm` reduces paddings and icon size, for tighter spots like cards */
  size?: 'sm' | 'md';
};

/** Row of link "pills" used in the restock pages to point to related pages. */
export function RestockLinkPills({ pills, trackEvent, size = 'md' }: RestockLinkPillsProps) {
  const isSmall = size === 'sm';

  return (
    <Flex gap={2} flexWrap="wrap" justify="center" maxW="3xl">
      {pills.map((pill) => (
        <Link key={pill.id} asChild>
          <MainLink
            href={pill.href}
            prefetch={false}
            trackEvent={trackEvent}
            trackEventLabel={pill.id}
          >
            <Flex
              align="center"
              gap={isSmall ? 1.5 : 2}
              px={isSmall ? 1.5 : 2.5}
              py={isSmall ? 1 : 1.5}
              borderRadius="md"
              bg="blackAlpha.400"
              _hover={{ bg: 'blackAlpha.600' }}
              transition="background 0.15s"
            >
              {pill.image && (
                <Flex
                  align="center"
                  justify="center"
                  bg="blackAlpha.300"
                  borderRadius="sm"
                  flex={isSmall ? '0 0 20px' : '0 0 26px'}
                  h={isSmall ? '20px' : '26px'}
                >
                  <Image
                    src={pill.image}
                    alt=""
                    h={isSmall ? '14px' : '18px'}
                    w={isSmall ? '14px' : '18px'}
                    objectFit="contain"
                  />
                </Flex>
              )}
              {pill.badge && (
                <Badge as="span" colorPalette="orange" size="sm" flexShrink={0}>
                  {pill.badge}
                </Badge>
              )}
              <Text fontSize="xs" fontWeight="semibold" lineHeight="short" color="white">
                {pill.label}
              </Text>
              <Box aria-hidden color="gray.400" flexShrink={0} fontSize="lg" lineHeight="1">
                ›
              </Box>
            </Flex>
          </MainLink>
        </Link>
      ))}
    </Flex>
  );
}
