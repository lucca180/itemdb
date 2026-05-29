import { Box, Flex, Heading, Link as ChakraLink } from '@chakra-ui/react';
import Link from 'next/link';
import NextImage from 'next/image';
import type { ReactNode } from 'react';
import logo from '@assets/logo_white_compressed.webp';

type HomeHeroProps = {
  title: string;
  highlightQuery: string;
  safetyLinkLabel: string;
};

function renderHighlightedText(title: string, highlightQuery: string): ReactNode {
  if (!highlightQuery) return title;

  const parts = title.split(highlightQuery);

  if (parts.length === 1) return title;

  return parts.flatMap((part, index) => [
    part,
    index < parts.length - 1 ? (
      <Box
        as="span"
        key={`highlight-${index}`}
        px={2}
        py={1}
        borderRadius="full"
        bg="gray.100"
        color="gray.800"
      >
        {highlightQuery}
      </Box>
    ) : null,
  ]);
}

export function HomeHero({ title, highlightQuery, safetyLinkLabel }: HomeHeroProps) {
  return (
    <Flex textAlign="center" direction="column" alignItems="center" mt="50px">
      <Box
        position="absolute"
        h="40vh"
        left="0"
        width="100%"
        mt="-50px"
        bgGradient="linear-gradient(to top, rgba(0, 0, 0, 0) 0, rgba(74, 85, 104, 0.6) 80%)"
        zIndex={-1}
      />
      <NextImage
        src={logo}
        alt="itemdb logo"
        width={500}
        quality={100}
        priority
        fetchPriority="high"
      />
      <Heading as="h1" unstyled mt={4} fontSize="1rem" fontWeight="bold" lineHeight={1.5}>
        {renderHighlightedText(title, highlightQuery)}{' '}
        <ChakraLink asChild color="gray.400" _hover={{ textDecoration: 'underline' }}>
          <Link href="/faq" prefetch={false}>
            {safetyLinkLabel}
          </Link>
        </ChakraLink>
      </Heading>
    </Flex>
  );
}
