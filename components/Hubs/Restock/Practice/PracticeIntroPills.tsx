import { Box, Flex, Image, Link, Text } from '@chakra-ui/react';
import MainLink from '@components/Utils/MainLink';

const GUIDE_IMAGE = 'https://images.neopets.com/themes/h5/basic/images/v3/shop-icon.svg';
const DASHBOARD_IMAGE = '/logo_icon.svg';

type PracticeIntroPillsProps = {
  guideLabel: string;
  dashboardLabel: string;
};

export function PracticeIntroPills({ guideLabel, dashboardLabel }: PracticeIntroPillsProps) {
  const pills = [
    { id: 'guide', href: '/restock', image: GUIDE_IMAGE, label: guideLabel },
    { id: 'dashboard', href: '/restock/dashboard', image: DASHBOARD_IMAGE, label: dashboardLabel },
  ];

  return (
    <Flex gap={2} flexWrap="wrap" justify="center" maxW="3xl">
      {pills.map((pill) => (
        <Link key={pill.id} asChild>
          <MainLink href={pill.href} prefetch={false}>
            <Flex
              align="center"
              gap={2}
              px={2.5}
              py={1.5}
              borderRadius="md"
              bg="blackAlpha.400"
              _hover={{ bg: 'blackAlpha.600' }}
              transition="background 0.15s"
            >
              <Flex
                align="center"
                justify="center"
                bg="blackAlpha.300"
                borderRadius="sm"
                flex="0 0 26px"
                h="26px"
              >
                <Image src={pill.image} alt="" h="18px" w="18px" objectFit="contain" />
              </Flex>
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
