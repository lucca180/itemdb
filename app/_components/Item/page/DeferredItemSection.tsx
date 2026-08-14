import { Box } from '@chakra-ui/react';
import type { ReactNode } from 'react';

export function DeferredItemSection({
  children,
  intrinsicSize = '300px',
}: {
  children: ReactNode;
  intrinsicSize?: string;
}) {
  return (
    <Box
      css={{
        contentVisibility: 'auto',
        containIntrinsicSize: `auto ${intrinsicSize}`,
      }}
    >
      {children}
    </Box>
  );
}
