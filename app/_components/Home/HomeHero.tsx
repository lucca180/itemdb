import { Box, Heading, Highlight, Link } from '@chakra-ui/react';
import Color from 'color';
import NextImage from 'next/image';
import logo from '@assets/logo_white_compressed.webp';

type HomeHeroProps = {
  title: string;
  highlightQuery: string;
  safetyLinkLabel: string;
};

const color = Color('#4A5568');
const rgb = color.rgb().round().array();

export function HomeHero({ title, highlightQuery, safetyLinkLabel }: HomeHeroProps) {
  return (
    <Box textAlign="center" display="flex" flexFlow="column" alignItems="center" mt="50px">
      <Box
        position="absolute"
        h="40vh"
        left="0"
        width="100%"
        mt="-50px"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.6) 80%)`}
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
      <Heading size="sm" as="h1" mt={4} lineHeight={1.5}>
        <Highlight
          query={highlightQuery}
          styles={{
            px: '2',
            py: '1',
            rounded: 'full',
            bg: 'gray.100',
          }}
        >
          {title}
        </Highlight>{' '}
        <Link color={color.lightness(70).hex()} href="/faq">
          {safetyLinkLabel}
        </Link>
      </Heading>
    </Box>
  );
}
