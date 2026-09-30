import { Flex, Heading, Separator, Text } from '@chakra-ui/react';

type PracticeFaqProps = {
  title: string;
  items: { question: string; answer: string }[];
};

export function PracticeFaq({ title, items }: PracticeFaqProps) {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <>
      <Separator mt={8} />
      <Flex as="section" flexFlow="column" gap={3}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <Heading as="h2" size="lg" mt={5}>
          {title}
        </Heading>
        {items.map((item) => (
          <Flex key={item.question} flexFlow="column" gap={2}>
            <Heading as="h3" size="md" mt={3}>
              {item.question}
            </Heading>
            <Text color="whiteAlpha.700">{item.answer}</Text>
          </Flex>
        ))}
      </Flex>
    </>
  );
}
