import { Popover, Button, Flex, Badge, useMediaQuery, Portal } from '@chakra-ui/react';
import React, { useState, useSyncExternalStore } from 'react';
import { Link } from '@i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { localizeInternalHref, type AppLocale } from '@utils/locales';
import { LAYOUT_INK_CSS_VAR, LAYOUT_INK_HOVER_CSS_VAR } from '@components/Layout/LayoutFrame';

/** Nav text follows the tint (dark on light tints); see SetMainColor. */
const INK = `var(${LAYOUT_INK_CSS_VAR})`;
const INK_HOVER = { bg: `var(${LAYOUT_INK_HOVER_CSS_VAR})` };

type DropdownButtonProps = {
  label: string;
  href: string;
  bg?: string;
  children?: React.ReactNode;
  hardNavigation?: boolean;
};

type DropdownOptionProps = {
  label: string;
  href: string;
  trackEventLabel: string;
  newUntil?: number;
  hardNavigation?: boolean;
};

const noopSubscribe = () => () => {};

function useIsMenuItemNew(newUntil?: number) {
  return useSyncExternalStore(
    noopSubscribe,
    () => Boolean(newUntil && newUntil > Date.now()),
    () => false
  );
}

export const DropdownButton = (props: DropdownButtonProps) => {
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
            color={INK}
            _hover={INK_HOVER}
            _expanded={INK_HOVER}
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
            color={INK}
            _hover={INK_HOVER}
            _expanded={INK_HOVER}
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

export const DropdownOption = (props: DropdownOptionProps) => {
  const t = useTranslations();
  const locale = useLocale() as AppLocale;
  const { label, href, newUntil, trackEventLabel } = props;
  const hardHref = localizeInternalHref(href, locale);
  const isNew = useIsMenuItemNew(newUntil);

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
      color={INK}
      _hover={INK_HOVER}
      data-umami-event="dropdown-link"
      data-umami-event-label={trackEventLabel}
      outline={'none'}
      _focus={{ outline: 'none', ...INK_HOVER }}
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
