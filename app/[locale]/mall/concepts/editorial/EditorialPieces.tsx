import type { ReactNode } from 'react';
import { Box, Flex, Heading, Link, Text } from '@chakra-ui/react';
import ItemCardV2 from '@components/Items/v2/ItemCardV2';
import MainLink from '@components/Utils/MainLink';
import type { ItemV2For } from '@types';

const UNIQUE_ID = 'mall-hub-editorial';

type KickerProps = {
  children: ReactNode;
  color?: string;
};

export function Kicker({ children, color = 'purple.200' }: KickerProps) {
  return (
    <Text
      fontSize="xs"
      fontWeight="bold"
      letterSpacing="0.16em"
      textTransform="uppercase"
      color={color}
    >
      {children}
    </Text>
  );
}

type SectionHeaderProps = {
  kicker: string;
  kickerColor?: string;
  title: string;
  lede?: string;
  link?: { href: string; label: string };
};

export function SectionHeader({ kicker, kickerColor, title, lede, link }: SectionHeaderProps) {
  return (
    <Flex
      direction={{ base: 'column', md: 'row' }}
      justify="space-between"
      align={{ base: 'flex-start', md: 'flex-end' }}
      gap={{ base: 2, md: 6 }}
    >
      <Flex direction="column" gap={2} minW={0}>
        <Kicker color={kickerColor}>{kicker}</Kicker>
        <Heading as="h2" size={{ base: 'xl', md: '2xl' }} css={{ textWrap: 'balance' }}>
          {title}
        </Heading>
        {lede && (
          <Text color="whiteAlpha.700" fontSize="sm" maxW="60ch" css={{ textWrap: 'pretty' }}>
            {lede}
          </Text>
        )}
      </Flex>
      {link && (
        <Link asChild fontSize="sm" color="purple.200" flexShrink={0} fontWeight="semibold">
          <MainLink href={link.href}>{link.label} →</MainLink>
        </Link>
      )}
    </Flex>
  );
}

export type StripCell = {
  item: ItemV2For<'card'>;
  caption: string;
};

type ItemStripProps = {
  cells: StripCell[];
  /** Small cards keep long rails readable on desktop. */
  small?: boolean;
};

/** Horizontal, snap-scrolling rail of item cards with an editorial caption underneath. */
export function ItemStrip({ cells, small }: ItemStripProps) {
  return (
    <Flex
      gap={{ base: 3, md: 4 }}
      overflowX="auto"
      pb={2}
      align="stretch"
      css={{
        scrollSnapType: 'x proximity',
        scrollbarWidth: 'thin',
        '& > *': { scrollSnapAlign: 'start', flexShrink: 0 },
        '&::-webkit-scrollbar': { height: '6px' },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255,255,255,0.18)',
          borderRadius: '999px',
        },
      }}
    >
      {cells.map(({ item, caption }) => (
        <Flex
          key={item.internal_id}
          direction="column"
          gap={2}
          w={{ base: '100px', md: small ? '100px' : '150px' }}
        >
          <Flex flex={1} align="stretch">
            <ItemCardV2 item={item} uniqueID={UNIQUE_ID} small={small} />
          </Flex>
          <Text fontSize="2xs" color="whiteAlpha.600" lineHeight="1.4">
            {caption}
          </Text>
        </Flex>
      ))}
    </Flex>
  );
}

type StripAsideProps = {
  kicker: string;
  kickerColor?: string;
  title: string;
  detail: string;
};

/** Pull-quote style note that sits beside a strip and keeps the row from running empty. */
export function StripAside({ kicker, kickerColor, title, detail }: StripAsideProps) {
  return (
    <Flex
      direction="column"
      gap={2}
      flexShrink={0}
      w={{ base: '100%', lg: '240px' }}
      pt={{ base: 4, lg: 0 }}
      ps={{ lg: 6 }}
      borderTopWidth={{ base: '1px', lg: 0 }}
      borderStartWidth={{ lg: '1px' }}
      borderColor="whiteAlpha.200"
    >
      <Kicker color={kickerColor}>{kicker}</Kicker>
      <Text fontSize="md" fontWeight="bold" css={{ textWrap: 'balance' }}>
        {title}
      </Text>
      <Text fontSize="xs" color="whiteAlpha.700" css={{ textWrap: 'pretty' }}>
        {detail}
      </Text>
    </Flex>
  );
}

type EditorialPanelProps = {
  children: ReactNode;
  wash?: string;
};

/** Standard dark panel used for every editorial module. */
export function EditorialPanel({ children, wash }: EditorialPanelProps) {
  return (
    <Box
      bg="gray.700"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      p={{ base: 4, md: 6 }}
      h="100%"
      bgGradient={wash ? `linear-gradient(to bottom, ${wash}, transparent 55%)` : undefined}
    >
      {children}
    </Box>
  );
}

export { UNIQUE_ID as EDITORIAL_UNIQUE_ID };
