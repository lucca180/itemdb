import { Box, Flex, Grid, Skeleton } from '@chakra-ui/react';

/** Content-area shell for `/item/[slug]` soft/hard nav — matches ItemPage layout. */
export function ItemPageSkeleton() {
  return (
    <Box data-testid="item-page-shell" aria-busy="true" aria-label="Loading item">
      <Box
        position="absolute"
        h="45vh"
        left="0"
        width="100%"
        bgGradient="linear-gradient(to top, rgba(0,0,0,0) 0, rgba(74, 85, 104, 0.35) 80%)"
        zIndex={-1}
      />
      <Box pt={2}>
        <Skeleton h="20px" w={{ base: '60%', md: '280px' }} />
      </Box>
      <Flex gap={{ base: 4, md: 8 }} pt={4} alignItems="center">
        <Skeleton borderRadius="md" flex="0 0 auto" minW="100px" minH="100px" w="100px" h="100px" />
        <Box flex="1" minW={0}>
          <Flex gap={1} mb={2} wrap="wrap">
            <Skeleton h="22px" w="72px" borderRadius="md" />
            <Skeleton h="22px" w="40px" borderRadius="md" />
          </Flex>
          <Skeleton h={{ base: '28px', md: '36px' }} w={{ base: '80%', md: '320px' }} mb={2} />
          <Skeleton h="16px" w="100%" maxW="480px" mb={1} />
          <Skeleton h="16px" w="70%" maxW="360px" />
        </Box>
      </Flex>
      <Grid
        minH="500px"
        gap={6}
        mt={5}
        w="100%"
        justifyItems={{ base: 'center', lg: 'stretch' }}
        alignItems={{ base: 'center', lg: 'start' }}
        templateColumns={{ base: '1fr', lg: 'minmax(0, 275px) minmax(0, 1fr)' }}
        templateRows={{ lg: 'auto 1fr' }}
        templateAreas={{
          base: `"addtolist" "main" "side"`,
          lg: `"addtolist main" "side main"`,
        }}
      >
        <Skeleton
          gridArea="addtolist"
          h="40px"
          w="100%"
          maxW={{ base: '800px', lg: 'none' }}
          borderRadius="md"
        />
        <Flex
          gridArea="side"
          maxW={{ base: '800px', lg: 'none' }}
          w="100%"
          minW={0}
          flexFlow="column"
          alignItems={{ base: 'center', lg: 'stretch' }}
          gap={5}
        >
          <Skeleton h="180px" w="100%" borderRadius="md" />
          <Skeleton h="220px" w="100%" borderRadius="md" />
        </Flex>
        <Flex
          gridArea="main"
          gap={{ base: 4, md: 6 }}
          flexFlow={{ base: 'column', xl: 'row' }}
          maxW={{ base: '800px', lg: 'none' }}
          w="100%"
          minW={0}
          alignItems={{ base: 'center', lg: 'stretch' }}
        >
          <Flex flex="2" flexFlow="column" gap={{ base: 4, md: 6 }} maxW="800px" w="100%">
            <Skeleton h="280px" w="100%" borderRadius="md" />
            <Skeleton h="160px" w="100%" borderRadius="md" />
          </Flex>
          <Flex w={{ base: '100%', md: '300px' }} flexFlow="column" gap={6}>
            <Skeleton h="140px" w="100%" borderRadius="md" />
            <Skeleton h="140px" w="100%" borderRadius="md" />
          </Flex>
        </Flex>
      </Grid>
    </Box>
  );
}
