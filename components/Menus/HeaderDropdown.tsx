import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Button,
  Flex,
  useBoolean,
} from '@chakra-ui/react';
import React from 'react';
import NextLink from 'next/link';
type Props = {
  // onSubmit: (e: any, search: string, params: string) => void;
  label: string;
  href: string;
  bg?: string;
  children?: React.ReactNode;
};

export const DropdownButton = (props: Props) => {
  const { label, href, children, bg } = props;
  const [isOpen, setIsOpen] = useBoolean();

  return (
    <Popover
      isOpen={!children ? false : undefined}
      placement="bottom"
      trigger="hover"
      onOpen={setIsOpen.on}
      onClose={setIsOpen.off}
    >
      <PopoverTrigger>
        <Button
          size={{ base: 'xs', sm: 'sm' }}
          variant={isOpen ? undefined : 'ghost'}
          as={NextLink}
          prefetch={false}
          href={href}
        >
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        w="100%"
        bg="gray.600"
        mt={'-5px'}
        border="0"
        overflow={'hidden'}
        borderRadius={'sm'}
        boxShadow={'base'}
      >
        <PopoverBody p={0} bg={bg}>
          <Flex flexFlow={'column'}>{children}</Flex>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export const DropdownOption = (props: Props) => {
  const { label, href } = props;

  return (
    <Button
      size="sm"
      variant="ghost"
      fontWeight={'normal'}
      justifyContent={'flex-start'}
      as={NextLink}
      prefetch={false}
      href={href}
      py={4}
      px={3}
      borderRadius={0}
    >
      {label}
    </Button>
  );
};
