import { Box, Flex } from '@chakra-ui/react';
import NextImage from 'next/image';
import type { ReactNode } from 'react';
import logo from '@assets/logo_white_compressed.webp';

/** Sync home shell — logo paints immediately; titles stream as children. */
export function HomePageShell({ children }: { children?: ReactNode }) {
  return (
    <Flex
      data-testid="home-page-shell"
      textAlign="center"
      direction="column"
      alignItems="center"
      mt="50px"
    >
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
        quality={90}
        priority
        fetchPriority="high"
      />
      {children}
    </Flex>
  );
}
