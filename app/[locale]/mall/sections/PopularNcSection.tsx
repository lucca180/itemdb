import { Suspense } from 'react';
import { Flex, Skeleton, Text } from '@chakra-ui/react';
import { getTranslations } from 'next-intl/server';
import { HomeCard } from '@components/Card/HomeCard';
import { getMallPopularNc } from '@app/server/ncMallHub';

const POPULAR_COLOR = '#B794F4';
const NC_ICON = '/icons/nc.png';

function PopularNcSkeleton() {
  return (
    <Skeleton
      w="100%"
      minW={0}
      h={{ base: '280px', md: '320px' }}
      borderRadius="md"
      bg="gray.700"
    />
  );
}

export function PopularNcSection() {
  return (
    <Suspense fallback={<PopularNcSkeleton />}>
      <PopularNcContent />
    </Suspense>
  );
}

async function PopularNcContent() {
  const [items, t] = await Promise.all([getMallPopularNc(), getTranslations()]);

  if (!items) return null;

  return (
    <Flex as="section" id="popular" direction="column" gap={4} w="100%" minW={0} h="100%">
      <Text
        fontSize="xs"
        fontWeight="bold"
        letterSpacing="0.16em"
        textTransform="uppercase"
        color="purple.200"
      >
        {t('NcMall.popular-kicker')}
      </Text>
      <HomeCard
        title={t('NcMall.popular-title')}
        image={NC_ICON}
        color={POPULAR_COLOR}
        items={items}
        href="/search?type=nc"
        linkText={t('NcMall.popular-link')}
        utm_content="mall-hub-popular"
        perPage={6}
      />
    </Flex>
  );
}
