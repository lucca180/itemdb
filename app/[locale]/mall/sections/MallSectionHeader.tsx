import type { ReactNode } from 'react';
import { Flex, Heading, Link, Text } from '@chakra-ui/react';
import MainLink from '@components/Utils/MainLink';

type MallSectionHeaderProps = {
  kicker: string;
  kickerColor?: string;
  title?: string;
  lede?: ReactNode;
  link?: { href: string; label: string };
  linkColor?: string;
};

export function MallSectionHeader({
  kicker,
  kickerColor = 'purple.200',
  title,
  lede,
  link,
  linkColor = 'purple.200',
}: MallSectionHeaderProps) {
  return (
    <Flex
      direction={{ base: 'column', md: 'row' }}
      justify="space-between"
      align={{ base: 'flex-start', md: 'flex-end' }}
      gap={{ base: 2, md: 6 }}
      minW={0}
      w="100%"
    >
      <Flex direction="column" gap={2} minW={0}>
        <Text
          as={title ? 'p' : 'h2'}
          fontSize="xs"
          fontWeight="bold"
          letterSpacing="0.16em"
          textTransform="uppercase"
          color={kickerColor}
        >
          {kicker}
        </Text>
        {title && (
          <Heading as="h2" size={{ base: 'xl', md: '2xl' }} css={{ textWrap: 'balance' }}>
            {title}
          </Heading>
        )}
        {lede && (
          <Text
            color="whiteAlpha.700"
            fontSize={{ base: 'sm', md: 'sm' }}
            maxW="60ch"
            css={{ textWrap: 'pretty' }}
          >
            {lede}
          </Text>
        )}
      </Flex>
      {link && (
        <Link asChild fontSize="sm" color={linkColor} flexShrink={0} fontWeight="semibold">
          <MainLink href={link.href}>{link.label} →</MainLink>
        </Link>
      )}
    </Flex>
  );
}
