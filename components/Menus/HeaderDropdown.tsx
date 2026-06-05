import { Popover, Button, Flex, Badge, useMediaQuery, Portal } from '@chakra-ui/react';
import React, { useState } from 'react';
import { Link } from '@i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { localizeInternalHref, type AppLocale } from '@utils/locales';

type Props = {
  label: string;
  href: string;
  bg?: string;
  children?: React.ReactNode;
  newUntil?: number;
  hardNavigation?: boolean;
};

export const DropdownButton = (props: Props) => {
  const { label, href, children, bg } = props;
  const locale = useLocale() as AppLocale;
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile] = useMediaQuery(['(hover: none)'], { fallback: [false] });
  const shouldBeLink = !children || !isMobile;
  const hardHref = localizeInternalHref(href, locale);

  return (
    <Popover.Root
      open={!children ? false : isOpen}
      onOpenChange={(e) => setIsOpen(e.open)}
      positioning={{ placement: 'bottom' }}
    >
      <Popover.Trigger asChild>
        {shouldBeLink ? (
          <Button
            asChild
            colorPalette="whiteAlpha"
            size={{ base: 'xs', sm: 'sm' }}
            variant={'ghost'}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            px={3}
            h={8}
            outline={'none'}
            _focus={{ outline: 'none' }}
          >
            {props.hardNavigation ? (
              <a href={hardHref}>{label}</a>
            ) : (
              <Link href={href}>{label}</Link>
            )}
          </Button>
        ) : (
          <Button
            colorPalette="whiteAlpha"
            size={{ base: 'xs', sm: 'sm' }}
            variant={'ghost'}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            px={3}
            h={8}
            outline={'none'}
            _focus={{ outline: 'none' }}
          >
            {label}
          </Button>
        )}
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
            boxShadow={'sm'}
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
  const locale = useLocale() as AppLocale;
  const { label, href, newUntil } = props;
  const hardHref = localizeInternalHref(href, locale);

  // eslint-disable-next-line react-hooks/purity
  const isNew = newUntil && newUntil > Date.now();

  return (
    <Button
      asChild
      colorPalette="whiteAlpha"
      size="sm"
      variant="ghost"
      fontWeight={'normal'}
      justifyContent={'flex-start'}
      py={4}
      px={3}
      borderRadius={0}
      data-umami-event="dropdown-link"
      data-umami-event-label={label}
      outline={'none'}
      _focus={{ outline: 'none', bg: 'whiteAlpha.200' }}
    >
      {props.hardNavigation ? (
        <a href={hardHref}>
          {label}
          {isNew && (
            <Badge as="span" colorPalette="orange" ml={1}>
              {t('Layout.new')}
            </Badge>
          )}
        </a>
      ) : (
        <Link href={href}>
          {label}
          {isNew && (
            <Badge as="span" colorPalette="orange" ml={1}>
              {t('Layout.new')}
            </Badge>
          )}
        </Link>
      )}
    </Button>
  );
};
