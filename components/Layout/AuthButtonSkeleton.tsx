'use client';

import { Box, Skeleton } from '@chakra-ui/react';

export function AuthButtonSkeleton() {
  return (
    <Box
      display="flex"
      gap={{ base: 1, md: 3 }}
      alignItems="center"
      justifyContent="flex-end"
      maxW="30%"
      minW="15%"
    >
      <Skeleton h="32px" w={{ base: '32px', md: '88px' }} borderRadius="md" />
    </Box>
  );
}
