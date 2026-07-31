import { Badge, Box, Flex, Heading, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import Image from '@components/Utils/Image';
import { IconLink } from '@components/Utils/IconLink';

export type OtherWaysAvailability = {
  fountainAvailable: boolean;
  labAvailable: boolean;
};

type OtherWaysProps = {
  availability: OtherWaysAvailability;
  colorName: string;
  /** Single-column stack for the pet preview sidebar */
  compact?: boolean;
};

const LINKS = {
  fountain: 'https://www.neopets.com/faerieland/rainbowfountain.phtml',
  lab: 'https://www.neopets.com/lab.phtml',
  premium: 'https://www.neopets.com/premium/',
} as const;

function richLink(href: string) {
  const RichLink = (chunks: ReactNode) => (
    <IconLink href={href} isExternal color="teal.200" fontWeight="semibold">
      {chunks}
    </IconLink>
  );
  RichLink.displayName = 'OtherWayRichLink';
  return RichLink;
}

type OtherWay = {
  id: string;
  title: string;
  description: ReactNode;
  image: string;
  imageBg: string;
  available: boolean;
};

export async function OtherWays({ availability, colorName, compact = false }: OtherWaysProps) {
  const t = await getTranslations();

  const ways: OtherWay[] = [
    {
      id: 'fountain',
      title: t('PetColors.other-ways-fountain-title'),
      description: availability.fountainAvailable
        ? t.rich('PetColors.other-ways-fountain-desc', { Link: richLink(LINKS.fountain) })
        : t('PetColors.other-ways-fountain-unavailable', { 0: colorName }),
      image: 'https://images.neopets.com/faerieland/rainbowfountain2_old.gif',
      imageBg: 'linear-gradient(145deg, #1a5f7a 0%, #57c5b6 100%)',
      available: availability.fountainAvailable,
    },
    {
      id: 'lab',
      title: t('PetColors.other-ways-lab-title'),
      description: availability.labAvailable
        ? t.rich('PetColors.other-ways-lab-desc', { Link: richLink(LINKS.lab) })
        : t('PetColors.other-ways-lab-unavailable', { 0: colorName }),
      image: 'https://images.neopets.com/nt/ntimages/149_lab_ray.gif',
      imageBg: 'linear-gradient(145deg, #3b1d6e 0%, #9b5de5 100%)',
      available: availability.labAvailable,
    },
    {
      id: 'premium',
      title: t('PetColors.other-ways-premium-title'),
      description: t.rich('PetColors.other-ways-premium-desc', { Link: richLink(LINKS.premium) }),
      image: 'https://images.neopets.com/premium/2023/icon-changepet.png',
      imageBg: 'linear-gradient(145deg, #5c1a3a 0%, #f72585 100%)',
      available: true,
    },
  ];

  return (
    <Box p={compact ? 2.5 : { base: 3, md: 4 }} bg="blackAlpha.400" borderRadius="xl" w="100%">
      <Flex
        justify={compact ? 'flex-start' : 'space-between'}
        align="baseline"
        gap={compact ? 0.5 : 2}
        mb={compact ? 2 : 3}
        flexWrap="wrap"
        flexDir={compact ? 'column' : 'row'}
      >
        <Heading as="h2" size="sm">
          {t('PetColors.other-ways')}
        </Heading>
        <Text fontSize="xs" color="whiteAlpha.600">
          {t('PetColors.other-ways-subtitle')}
        </Text>
      </Flex>

      <SimpleGrid columns={compact ? 1 : { base: 1, sm: 2 }} gap={compact ? 2 : 3}>
        {ways.map((way) => (
          <OtherWayCard key={way.id} way={way} compact={compact} naLabel={t('PetColors.na')} />
        ))}
      </SimpleGrid>
    </Box>
  );
}

function OtherWayCard({
  way,
  compact,
  naLabel,
}: {
  way: OtherWay;
  compact?: boolean;
  naLabel: string;
}) {
  return (
    <Flex
      gap={compact ? 2 : 3}
      p={compact ? 2 : 3}
      borderRadius="lg"
      bg="blackAlpha.500"
      borderWidth="1px"
      borderColor={way.available ? 'whiteAlpha.200' : 'whiteAlpha.100'}
      opacity={way.available ? 1 : 0.55}
      align="flex-start"
      h="100%"
    >
      <Box
        flexShrink={0}
        w={compact ? '44px' : '56px'}
        h={compact ? '44px' : '56px'}
        borderRadius="md"
        overflow="hidden"
        bgImage={way.imageBg}
        bgSize="cover"
      >
        <Image
          src={way.image}
          alt=""
          width={compact ? 44 : 56}
          height={compact ? 44 : 56}
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        />
      </Box>

      <VStack align="flex-start" gap={1} flex={1} minW={0}>
        <Flex gap={1.5} align="center" flexWrap="wrap">
          <Text fontWeight="semibold" fontSize={compact ? 'xs' : 'sm'}>
            {way.title}
          </Text>
          {!way.available && (
            <Badge size="sm" colorPalette="red" variant="outline">
              {naLabel}
            </Badge>
          )}
        </Flex>
        <Text fontSize="xs" color="whiteAlpha.700" css={{ textWrap: 'pretty' }} lineHeight="short">
          {way.description}
        </Text>
      </VStack>
    </Flex>
  );
}
