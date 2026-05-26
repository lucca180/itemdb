import { Tooltip as ChakraTooltip } from '@chakra-ui/react';

type TooltipProps = {
  children: React.ReactNode;
  label?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
};

const Tooltip = (props: TooltipProps) => {
  const { children, label, position = 'top' } = props;
  return (
    <ChakraTooltip.Root positioning={{ placement: position }} openDelay={200}>
      <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>
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
    </ChakraTooltip.Root>
  );
};

export default Tooltip;
