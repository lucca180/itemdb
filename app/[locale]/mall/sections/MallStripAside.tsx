import { Flex, Link, Text } from '@chakra-ui/react';
import MainLink from '@components/Utils/MainLink';

type MallStripAsideProps = {
  kicker: string;
  kickerColor?: string;
  title: string;
  href?: string;
  detail: string;
};

export function MallStripAside({
  kicker,
  kickerColor = 'orange.200',
  title,
  href,
  detail,
}: MallStripAsideProps) {
  return (
    <Flex
      direction="column"
      gap={2}
      flexShrink={0}
      minW={0}
      w={{ base: '100%', lg: '240px' }}
      pt={{ base: 4, lg: 0 }}
      ps={{ lg: 6 }}
      borderTopWidth={{ base: '1px', lg: 0 }}
      borderStartWidth={{ lg: '1px' }}
      borderColor="whiteAlpha.200"
    >
      <Text
        fontSize="xs"
        fontWeight="bold"
        letterSpacing="0.16em"
        textTransform="uppercase"
        color={kickerColor}
      >
        {kicker}
      </Text>
      {href ? (
        <Link asChild fontWeight="bold" fontSize="md" w="fit-content" css={{ textWrap: 'balance' }}>
          <MainLink href={href}>{title}</MainLink>
        </Link>
      ) : (
        <Text fontSize="md" fontWeight="bold" css={{ textWrap: 'balance' }}>
          {title}
        </Text>
      )}
      <Text fontSize="xs" color="whiteAlpha.700" css={{ textWrap: 'pretty' }}>
        {detail}
      </Text>
    </Flex>
  );
}
