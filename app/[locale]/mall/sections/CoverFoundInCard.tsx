import { Flex, Text } from '@chakra-ui/react';
import Image from '@components/Utils/Image';
import MainLink from '@components/Utils/MainLink';
import type { MallCoverFoundIn } from '@app/server/ncMallHub';

type CoverFoundInCardProps = {
  foundIn: MallCoverFoundIn;
  label: string;
};

export function CoverFoundInCard({ foundIn, label }: CoverFoundInCardProps) {
  return (
    <MainLink
      href={foundIn.href}
      trackEvent="mall-hub-cover"
      trackEventLabel={foundIn.kind === 'item' ? 'found-in-item' : 'found-in-list'}
      style={{ textDecoration: 'none', width: '100%' }}
    >
      <Flex
        gap={2}
        p={2}
        w="100%"
        minW={0}
        bg="blackAlpha.500"
        borderRadius="md"
        borderWidth="1px"
        borderColor="whiteAlpha.200"
        align="center"
        _hover={{ bg: 'blackAlpha.700' }}
      >
        <Image
          src={foundIn.imageSrc}
          alt=""
          width={36}
          height={36}
          unoptimized
          style={{ objectFit: 'contain', borderRadius: 6, flexShrink: 0 }}
        />
        <Flex direction="column" gap={0.5} minW={0} flex={1}>
          <Text
            fontSize="2xs"
            fontWeight="bold"
            letterSpacing="0.12em"
            textTransform="uppercase"
            color="whiteAlpha.600"
          >
            {label}
          </Text>
          <Text fontSize="xs" fontWeight="semibold" lineClamp={2} title={foundIn.name}>
            {foundIn.name}
          </Text>
        </Flex>
      </Flex>
    </MainLink>
  );
}
