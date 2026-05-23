import { Popover, Button, Flex, Badge, useMediaQuery, Portal } from '@chakra-ui/react';
import React, { useState } from 'react';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';

type Props = {
  label: string;
  href: string;
  bg?: string;
  children?: React.ReactNode;
  newUntil?: number;
};

export const DropdownButton = (props: Props) => {
  const { label, href, children, bg } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile] = useMediaQuery(['(hover: none)'], { fallback: [false] });

  const shouldBeLink = !children || isMobile;

  if (shouldBeLink) {
    return (
      <Button asChild size={{ base: 'xs', sm: 'sm' }} variant="ghost">
        <NextLink href={href} prefetch={false}>
          {label}
        </NextLink>
      </Button>
    );
  }

  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={(e) => setIsOpen(e.open)}
      positioning={{ placement: 'bottom' }}
    >
      <Popover.Trigger asChild>
        <Button
          size={{ base: 'xs', sm: 'sm' }}
          variant={isOpen ? undefined : 'ghost'}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {label}
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content
            w="100%"
            bg="gray.600"
            mt={'-5px'}
            border="0"
            overflow={'hidden'}
            borderRadius={'sm'}
            boxShadow={'base'}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <Popover.Body p={0} bg={bg}>
              <Flex flexFlow={'column'}>{children}</Flex>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
};

export const DropdownOption = (props: Props) => {
  const t = useTranslations();
  const { label, href, newUntil } = props;

  // eslint-disable-next-line react-hooks/purity
  const isNew = newUntil && newUntil > Date.now();

  return (
    <Button
      asChild
      size="sm"
      variant="ghost"
      fontWeight={'normal'}
      justifyContent={'flex-start'}
      py={4}
      px={3}
      borderRadius={0}
      data-umami-event="dropdown-link"
      data-umami-event-label={label}
    >
      <NextLink href={href} prefetch={false}>
        {label}
        {isNew && (
          <Badge as="span" colorPalette="orange" ml={1}>
            {t('Layout.new')}
          </Badge>
        )}
      </NextLink>
    </Button>
  );
};
