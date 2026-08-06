'use client';

import type { ReactNode } from 'react';
import { Box, Center, Spinner } from '@chakra-ui/react';

export type AppServerLayoutSkeletonProps = {
  children?: ReactNode;
  /** @deprecated Chrome color is owned by the route layout; ignored. */
  mainColor?: string;
  /** @deprecated Chrome width is owned by the route layout; ignored. */
  fullWidth?: boolean;
};

/** Content-only Suspense fallback — chrome lives in the locale layout. */
export default function AppServerLayoutSkeleton({ children }: AppServerLayoutSkeletonProps) {
  if (children) {
    return <>{children}</>;
  }

  return (
    <Box aria-hidden="true" py={6}>
      <Center>
        <Spinner size="lg" />
      </Center>
    </Box>
  );
}
