'use client';

import { Portal, Tooltip as ChakraTooltip } from '@chakra-ui/react';
import { useId, useSyncExternalStore, type ReactNode } from 'react';

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

type TooltipProps = {
  children: ReactNode;
  label?: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
};

const Tooltip = (props: TooltipProps) => {
  const { children, label, position = 'top' } = props;
  const id = useId();
  const isClient = useIsClient();

  if (!isClient) {
    return children;
  }

  return (
    <ChakraTooltip.Root
      ids={{ trigger: id }}
      lazyMount
      unmountOnExit
      positioning={{ placement: position }}
      openDelay={200}
    >
      <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>
      <Portal>
        <ChakraTooltip.Positioner>
          <ChakraTooltip.Content
            border={0}
            boxShadow="md"
            bg="gray.700"
            color="white"
            p={1}
            w="max-content"
            fontSize={'xs'}
          >
            {label}
          </ChakraTooltip.Content>
        </ChakraTooltip.Positioner>
      </Portal>
    </ChakraTooltip.Root>
  );
};

export default Tooltip;
