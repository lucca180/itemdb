import { Box, Center, Flex, Heading, Image, Text } from '@chakra-ui/react';
import { BreadcrumbsView } from '@components/Breadcrumbs/BreadcrumbsView';
import type { BreadcrumbItem } from '@components/Breadcrumbs/types';
import { getTranslations } from 'next-intl/server';
import { MALL_HUB_BANNER, MALL_HUB_PATH } from './mallHubTheme';

type MallHubShellProps = {
  locale: string;
};

export async function MallHubShell({ locale }: MallHubShellProps) {
  const t = await getTranslations();

  const breadcrumbList: BreadcrumbItem[] = [
    { position: 1, name: t('Layout.home'), item: '/' },
    { position: 2, name: t('NcMall.hub-h1'), item: MALL_HUB_PATH },
  ];

  return (
    <Flex direction="column" gap={{ base: 3, md: 4 }} minW={0} w="100%">
      <Box
        w="100%"
        px={{ base: 2, md: 4 }}
        pt={2}
        css={{
          '& ol': { flexWrap: 'wrap' },
        }}
      >
        <BreadcrumbsView breadcrumbList={breadcrumbList} locale={locale} useAppDir />
      </Box>

      <Center flexFlow="column" gap={{ base: 3, md: 4 }} textAlign="center" px={{ base: 2, md: 4 }}>
        <Box
          w="100%"
          maxW="760px"
          overflow="hidden"
          borderRadius="lg"
          boxShadow="md"
          css={{ aspectRatio: '994 / 228' }}
        >
          <Image
            src={MALL_HUB_BANNER}
            alt={t('NcMall.hub-h1')}
            w="100%"
            h="100%"
            objectFit="cover"
            objectPosition="center"
          />
        </Box>
        <Heading
          as="h1"
          size={{ base: '2xl', md: '4xl' }}
          css={{ textWrap: 'balance' }}
          lineHeight="1.15"
        >
          {t('NcMall.hub-h1')}
        </Heading>
        <Text
          maxW="60ch"
          color="whiteAlpha.800"
          fontSize={{ base: 'sm', md: 'md' }}
          css={{ textWrap: 'pretty' }}
        >
          {t('NcMall.hub-lede')}
        </Text>
      </Center>
    </Flex>
  );
}

export function MallHubShellSkeleton() {
  return (
    <Center flexFlow="column" gap={3} px={2} pt={4} aria-hidden="true">
      <Box
        w="100%"
        maxW="760px"
        bg="whiteAlpha.200"
        borderRadius="lg"
        css={{ aspectRatio: '994 / 228' }}
      />
      <Box
        w={{ base: '160px', md: '220px' }}
        h={{ base: '36px', md: '48px' }}
        bg="whiteAlpha.200"
        borderRadius="md"
      />
      <Box w="100%" maxW="480px" h="40px" bg="whiteAlpha.200" borderRadius="md" />
    </Center>
  );
}
