import type { ReactNode } from 'react';
import { Box, Flex, Heading, Link, Separator, Text } from '@chakra-ui/react';
import { getTranslations } from 'next-intl/server';
import MainLink from '@components/Utils/MainLink';

const OFFICIAL_NC_MALL = 'https://ncmall.neopets.com/';
const FAQ_COUNT = 6;

function stripRichTags(value: string): string {
  return value.replace(/<\/?[A-Za-z][A-Za-z0-9]*>/g, '');
}

function richInternalLink(href: string) {
  function RichLink(chunks: ReactNode) {
    return (
      <Link asChild color="purple.200" fontWeight="semibold">
        <MainLink href={href}>{chunks}</MainLink>
      </Link>
    );
  }
  return RichLink;
}

function richExternalLink(href: string) {
  function RichLink(chunks: ReactNode) {
    return (
      <Link href={href} color="purple.200" fontWeight="semibold" target="_blank" rel="noreferrer">
        {chunks}
      </Link>
    );
  }
  return RichLink;
}

type FaqItem = {
  questionName: string;
  acceptedAnswerText: string;
  acceptedAnswer: ReactNode;
};

function formatFaqPageJsonLd(items: FaqItem[]) {
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

export async function FaqSection() {
  const t = await getTranslations();

  const richTags = {
    LeavingLink: richInternalLink('/mall/leaving'),
    LeavingAnchor: richInternalLink('#leaving'),
    ReportLink: richInternalLink('/mall/report'),
    CapsulesAnchor: richInternalLink('#capsules'),
    LebronLink: richInternalLink('/articles/lebron'),
    MallLink: richExternalLink(OFFICIAL_NC_MALL),
  };

  const faqItems: FaqItem[] = Array.from({ length: FAQ_COUNT }, (_, index) => {
    const i = index + 1;
    return {
      questionName: t(`NcMall.faq-${i}`),
      acceptedAnswerText: stripRichTags(t.raw(`NcMall.faq-${i}-text`)),
      acceptedAnswer: t.rich(`NcMall.faq-${i}-text`, richTags),
    };
  });

  const faqJsonLd = formatFaqPageJsonLd(faqItems);

  return (
    <Flex
      as="section"
      id="faq"
      direction="column"
      gap={5}
      w="100%"
      minW={0}
      pt={{ base: 2, md: 4 }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Separator borderColor="whiteAlpha.200" />
      <Heading as="h2" size={{ base: 'xl', md: '2xl' }} css={{ textWrap: 'balance' }}>
        {t('NcMall.faq-title')}
      </Heading>
      <Flex direction="column" gap={5}>
        {faqItems.map((item) => (
          <Box key={item.questionName}>
            <Heading as="h3" size="sm" mb={2}>
              {item.questionName}
            </Heading>
            <Text fontSize="sm" color="whiteAlpha.800" maxW="70ch" css={{ textWrap: 'pretty' }}>
              {item.acceptedAnswer}
            </Text>
          </Box>
        ))}
      </Flex>
    </Flex>
  );
}
