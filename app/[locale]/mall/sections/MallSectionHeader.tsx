import type { ReactNode } from 'react';
import { Flex, Heading, Text } from '@chakra-ui/react';

type MallSectionHeaderProps = {
  kicker: string;
  kickerColor?: string;
  title?: string;
  lede?: ReactNode;
};

export function MallSectionHeader({
  kicker,
  kickerColor = 'purple.200',
  title,
  lede,
}: MallSectionHeaderProps) {
  return (
    <Flex direction="column" gap={2} minW={0}>
      <Text
        as="h2"
        fontSize="xs"
        fontWeight="bold"
        letterSpacing="0.16em"
        textTransform="uppercase"
        color={kickerColor}
      >
        {kicker}
      </Text>
      {title && (
        <Heading
          as="h3"
          size={{ base: 'xl', md: '2xl' }}
          lineHeight="1.15"
          css={{ textWrap: 'balance' }}
        >
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
  );
}
