'use client';

import { Tooltip } from '@chakra-ui/react';
import type { ReactElement, ReactNode } from 'react';

type Props = {
  content: ReactNode;
  children: ReactElement;
};

/** Isolated so Next can code-split Chakra Tooltip out of the badge hot path. */
export default function ItemCardBadgeTooltip({ content, children }: Props) {
  return (
    <Tooltip.Root positioning={{ placement: 'top' }}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content>{content}</Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
}
