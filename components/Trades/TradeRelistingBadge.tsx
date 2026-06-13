'use client';

import { Badge, Icon, Text, Tooltip, useMediaQuery } from '@chakra-ui/react';
import { useState } from 'react';
import { MdHelpOutline } from 'react-icons/md';

type TradeRelistingBadgeProps = {
  disclaimer: string;
  label: string;
};

export const TradeRelistingBadge = ({ disclaimer, label }: TradeRelistingBadgeProps) => {
  const [isTouchDevice] = useMediaQuery(['(hover: none), (pointer: coarse)'], {
    fallback: [false],
  });
  const [open, setOpen] = useState(false);

  return (
    <Tooltip.Root
      closeOnClick={!isTouchDevice}
      lazyMount
      open={isTouchDevice ? open : undefined}
      openDelay={isTouchDevice ? 0 : 200}
      positioning={{ placement: 'top' }}
      unmountOnExit
    >
      <Tooltip.Trigger asChild>
        <Badge
          mt={1}
          p={1}
          colorPalette="gray"
          size="xs"
          textTransform="none"
          whiteSpace="normal"
          cursor="help"
          display="inline-flex"
          alignItems="center"
          gap={1}
          onClick={isTouchDevice ? () => setOpen((current) => !current) : undefined}
        >
          <Text as="span">{label}</Text>
          <Icon as={MdHelpOutline} boxSize="0.8rem" flexShrink={0} />
        </Badge>
      </Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content maxW="min(280px, calc(100vw - 24px))">
          {disclaimer}
          <Tooltip.Arrow>
            <Tooltip.ArrowTip />
          </Tooltip.Arrow>
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
};
