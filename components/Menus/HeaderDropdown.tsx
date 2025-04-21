import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Button,
  Flex,
  useBoolean,
  Badge,
  useMediaQuery,
} from '@chakra-ui/react';
import React from 'react';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
type Props = {
  // onSubmit: (e: any, search: string, params: string) => void;
  label: string;
  href: string;
  bg?: string;
  children?: React.ReactNode;
  newUntil?: number;
};

export const DropdownButton = (props: Props) => {
  const { label, href, children, bg } = props;
  const [isOpen, setIsOpen] = useBoolean();
  const [isMobile] = useMediaQuery('(hover: none)', { fallback: false });

  const shouldBeLink = !children || !isMobile;

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
          as={shouldBeLink ? NextLink : undefined}
          prefetch={shouldBeLink ? false : undefined}
          href={shouldBeLink ? href : undefined}
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
  const t = useTranslations();
  const { label, href, newUntil } = props;

  const isNew = newUntil && newUntil > Date.now();

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
      data-umami-event="dropdown-link"
      data-umami-event-label={label}
    >
      {label}
      {isNew && (
        <Badge as="span" colorScheme="orange" ml={1}>
          {t('Layout.new')}
        </Badge>
      )}
    </Button>
  );
};
