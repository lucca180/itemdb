import { Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { getTranslations } from 'next-intl/server';
import MainLink from '@components/Utils/MainLink';
import { STYLES_BASE_PATH } from '@utils/petStyles/paths';
import { MallSectionHeader } from './MallSectionHeader';

const QUICK_LINKS = [
  { id: 'leaving', href: '/mall/leaving' },
  { id: 'report', href: '/mall/report' },
  { id: 'pet-styles', href: STYLES_BASE_PATH },
  { id: 'lebron', href: '/articles/lebron' },
  { id: 'search', href: '/search?type=nc' },
  { id: 'outfits', href: '/hub/outfits/acara' },
] as const;

export async function KeepReadingSection() {
  const t = await getTranslations();

  return (
    <Flex as="section" id="keep-reading" direction="column" gap={5} w="100%" minW={0}>
      <MallSectionHeader
        kicker={t('NcMall.keep-reading-kicker')}
        title={t('NcMall.keep-reading-title')}
        lede={t('NcMall.keep-reading-lede')}
      />
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={3} w="100%" minW={0}>
        {QUICK_LINKS.map((link) => (
          <MainLink
            key={link.id}
            href={link.href}
            trackEvent="mall-hub-keep-reading"
            trackEventLabel={link.id}
            style={{ textDecoration: 'none', height: '100%', display: 'block', color: 'inherit' }}
          >
            <Flex
              direction="column"
              gap={1}
              h="100%"
              p={4}
              bg="gray.700"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="whiteAlpha.300"
              transition="background 0.15s, transform 0.15s"
              _hover={{
                bg: 'gray.600',
                transform: 'translateY(-2px)',
                borderColor: 'whiteAlpha.400',
              }}
            >
              <Text fontWeight="bold" fontSize="sm" color="white">
                {t(`NcMall.keep-reading-${link.id}`)}
              </Text>
              <Text fontSize="xs" color="whiteAlpha.700" css={{ textWrap: 'pretty' }}>
                {t(`NcMall.keep-reading-${link.id}-desc`)}
              </Text>
            </Flex>
          </MainLink>
        ))}
      </SimpleGrid>
    </Flex>
  );
}
