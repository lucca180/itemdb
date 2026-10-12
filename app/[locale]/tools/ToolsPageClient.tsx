'use client';

import { Badge, Box, Flex, Heading, SimpleGrid, Text } from '@chakra-ui/react';
import Color from 'color';
import NextImage from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { BreadcrumbsView } from '@components/Breadcrumbs/BreadcrumbsView';
import { createToolsBreadcrumbList } from '@components/Breadcrumbs/ToolsBreadcrumbs';
import HeaderCard from '@components/Card/HeaderCard';
import MainLink from '@components/Utils/MainLink';
import {
  getToolsByCategory,
  toolCategories,
  TOOLS_ACCENT,
  type ToolInfo,
  type ToolTag,
} from './toolsData';

const tagPalette: Record<ToolTag, string> = {
  new: 'green',
};

export function ToolsPageClient() {
  const t = useTranslations('Tools');
  const tRoot = useTranslations();
  const locale = useLocale();
  const breadcrumbList = createToolsBreadcrumbList((key) => tRoot(key));

  return (
    <>
      <HeaderCard
        color={TOOLS_ACCENT}
        breadcrumb={<BreadcrumbsView breadcrumbList={breadcrumbList} locale={locale} useAppDir />}
        image={{
          src: 'https://images.neopets.com/caption/sm_caption_259.gif',
          alt: t('title'),
        }}
      >
        <Heading as="h1" size="lg">
          {t('h1')}
        </Heading>
        <Text fontSize={{ base: 'sm', md: undefined }}>{t('description')}</Text>
      </HeaderCard>

      <Flex direction="column" gap={{ base: 8, md: 10 }} w="full" maxW="1100px">
        {toolCategories.map((category) => (
          <Box as="section" key={category.id}>
            <Text
              color={Color(category.color).lighten(0.35).hex()}
              fontSize="xs"
              fontWeight="bold"
              letterSpacing="0.14em"
              textTransform="uppercase"
            >
              {t(`category-${category.id}-description`)}
            </Text>
            <Heading as="h2" size="lg" mt={1} mb={4}>
              {t(`category-${category.id}`)}
            </Heading>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={3}>
              {getToolsByCategory(category.id).map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </SimpleGrid>
          </Box>
        ))}
      </Flex>
    </>
  );
}

function ToolCard({ tool }: { tool: ToolInfo }) {
  const t = useTranslations('Tools');
  const rgb = Color(tool.color).rgb().array().join(', ');

  return (
    <MainLink
      href={tool.href}
      style={{ display: 'flex' }}
      trackEvent="tools-page"
      trackEventLabel={tool.id}
    >
      <Flex
        w="full"
        align="stretch"
        gap={3}
        p={3}
        borderWidth="1px"
        borderColor={`rgba(${rgb}, 0.3)`}
        borderRadius="lg"
        bg={`rgba(${rgb}, 0.06)`}
        transition="transform 160ms ease, border-color 160ms ease, background 160ms ease"
        _hover={{
          transform: 'translateY(-2px)',
          borderColor: `rgba(${rgb}, 0.7)`,
          bg: `rgba(${rgb}, 0.12)`,
        }}
      >
        <Box flexShrink={0} boxSize="72px" borderRadius="md" overflow="hidden" bg="blackAlpha.400">
          <NextImage
            src={tool.image}
            alt=""
            // Wide images need a wider request, or the cropped 72px height gets upscaled.
            width={Math.round(72 * (tool.imageRatio ?? 1))}
            height={72}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>
        <Flex direction="column" flex="1" minW={0} justify="center" gap={1}>
          <Heading as="h3" size="sm" lineHeight="1.25">
            {t(tool.id)}
          </Heading>
          <Text fontSize="xs" color="gray.400" lineHeight="1.45">
            {t(`${tool.id}-description`)}
          </Text>
          {!!tool.tags?.length && (
            <Flex gap={1} flexWrap="wrap">
              {tool.tags.map((tag) => (
                <Badge key={tag} size="xs" colorPalette={tagPalette[tag]} variant="subtle">
                  {t(`tag-${tag}`)}
                </Badge>
              ))}
            </Flex>
          )}
        </Flex>
      </Flex>
    </MainLink>
  );
}
