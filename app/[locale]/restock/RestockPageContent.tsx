import { Box, Center, Flex, Heading, Separator, Text } from '@chakra-ui/react';
import { BreadcrumbsView } from '@components/Breadcrumbs/BreadcrumbsView';
import Image from '@components/Utils/Image';
import Color from 'color';
import type { ShopInfo } from '@types';
import type { RestockFaqItem, RestockPageLabels } from './buildRestockPageProps';
import { RestockPageClient } from './RestockPageClient';
import { RestockSpecialDayTag } from './RestockSpecialDayTag';

const rgb = Color('#A5DAE9').rgb().array();

function formatFaqPageJsonLd(items: RestockFaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.questionName,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.acceptedAnswerText,
      },
    })),
  };
}

type RestockPageContentProps = {
  locale: string;
  labels: RestockPageLabels;
  trendingShops: ShopInfo[];
};

export function RestockPageContent({ locale, labels, trendingShops }: RestockPageContentProps) {
  const faqJsonLd = formatFaqPageJsonLd(labels.faqItems);

  return (
    <>
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]},${rgb[1]},${rgb[2]},.7) 70%)`}
        zIndex={-1}
      />
      <Box mt={2}>
        <BreadcrumbsView breadcrumbList={labels.breadcrumbList} locale={locale} useAppDir />
      </Box>
      <Center my={4} flexFlow="column" gap={2} textAlign="center">
        <Image
          priority
          fetchPriority="high"
          quality={100}
          width={600}
          height={200}
          w="100%"
          maxW="600px"
          h="auto"
          src="https://images.neopets.com/ncmall/shopkeepers/cashshop_limited.png"
          alt="Restock Hub thumbnail"
          borderRadius="md"
          boxShadow="sm"
        />
        <Heading as="h1">{labels.title}</Heading>
        <Text>{labels.callToAction}</Text>
        <Text fontSize="sm">{labels.dashboardCta}</Text>
        <RestockSpecialDayTag labels={labels.specialDayLabels} />
      </Center>
      <Separator />
      <RestockPageClient
        labels={{
          categoriesLabel: labels.categoriesLabel,
          difficultyLabel: labels.difficultyLabel,
          trendingShopsLabel: labels.trendingShopsLabel,
        }}
        trendingShops={trendingShops}
      />
      <Separator mt={5} />
      <Flex flexFlow="column" gap={3} justifyContent="center">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        {labels.faqSections.map((section) => (
          <Flex key={section.heading} flexFlow="column" gap={3}>
            <Heading size="md" as="h3" mt={5}>
              {section.heading}
            </Heading>
            <Text color="whiteAlpha.700">{section.body}</Text>
          </Flex>
        ))}
      </Flex>
    </>
  );
}
