import { Popover, PopoverTrigger, PopoverContent, PopoverArrow } from '@chakra-ui/react';

type TooltipProps = {
  children: React.ReactNode;
  label?: React.ReactNode;
};

const Tooltip = (props: TooltipProps) => {
  const { children, label } = props;

  return (
    <Popover placement="top" isLazy>
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent
        border={0}
        boxShadow="md"
        bg="gray.700"
        color="white"
        p={1}
        w="max-content"
        fontSize={'xs'}
      >
        <PopoverArrow />
        {label}
      </PopoverContent>
    </Popover>
  );
};

export default Tooltip;
