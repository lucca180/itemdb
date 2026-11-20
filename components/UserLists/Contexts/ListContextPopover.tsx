'use client';

import { Box, Button, Popover, Portal, Stack, Text } from '@chakra-ui/react';
import {
  cloneElement,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
} from 'react';
import dynamic from 'next/dynamic';
import Color from 'color';
import { useTranslations } from 'next-intl';
import type { ListContext } from '@types';

const Markdown = dynamic(() => import('@components/Utils/Markdown'), { ssr: false });

/** Readable text color on top of a context color. */
export const contextTextColor = (hex: string) => {
  try {
    return Color(hex).isLight() ? 'gray.900' : 'white';
  } catch {
    return 'white';
  }
};

export function ListContextPanel({ context }: { context: ListContext }) {
  const t = useTranslations();

  return (
    <Stack gap={2} fontSize="sm">
      <Text fontWeight="bold" as="div">
        <Markdown>{context.title || context.badgeText}</Markdown>
      </Text>
      {context.description && (
        <Text
          as="div"
          color="whiteAlpha.800"
          css={{ '& ul': { pl: 4, listStyle: 'disc' }, '& ol': { pl: 4, listStyle: 'decimal' } }}
        >
          <Markdown allowedElements={['ul', 'ol', 'li']}>{context.description}</Markdown>
        </Text>
      )}
      <Text fontSize="xs" color="gray.400">
        {t('Lists.contexts-shared', { count: context.itemIids.length })}
      </Text>
    </Stack>
  );
}

type ListContextPopoverProps = {
  contexts: ListContext[];
  /** Shows a "see all contexts" button that calls this with the first context id */
  onSeeAll?: (contextId: number) => void;
  /** The trigger. It must forward props and ref to a DOM element. */
  children: ReactElement;
};

/** Context details: opens on mouse hover, a click or tap pins it open. */
export function ListContextPopover({ contexts, onSeeAll, children }: ListContextPopoverProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(e) => {
        setOpen(e.open);
        if (!e.open) setPinned(false);
      }}
      positioning={{ placement: 'bottom' }}
      lazyMount
      unmountOnExit
    >
      {/* handlers go on the child: on Popover.Trigger the built-in toggle runs after them
          and closes a popover that hover had just opened */}
      <Popover.Trigger asChild>
        {cloneElement(children, {
          onPointerEnter: (e: PointerEvent<HTMLElement>) => {
            if (e.pointerType === 'mouse') setOpen(true);
          },
          onPointerLeave: (e: PointerEvent<HTMLElement>) => {
            if (e.pointerType === 'mouse' && !pinned) setOpen(false);
          },
          onClick: (e: MouseEvent<HTMLElement>) => {
            // keeps item links from navigating and edit mode from selecting the item
            e.preventDefault();
            e.stopPropagation();
            setPinned(true);
            setOpen(true);
          },
        } as Record<string, unknown>)}
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content maxW="320px" bg="gray.800">
            <Popover.Arrow>
              <Popover.ArrowTip />
            </Popover.Arrow>
            <Popover.Body p={3} maxH="60vh" overflowY="auto">
              <Stack gap={3}>
                {contexts.map((context) => (
                  <Box
                    key={context.internal_id}
                    pl={2}
                    style={{ borderLeft: `3px solid ${context.color}` }}
                  >
                    <ListContextPanel context={context} />
                  </Box>
                ))}
              </Stack>
              {onSeeAll && (
                <Button
                  mt={2}
                  size="xs"
                  variant="ghost"
                  colorPalette="gray"
                  onClick={() => {
                    setOpen(false);
                    onSeeAll(contexts[0].internal_id);
                  }}
                >
                  {t('Lists.contexts-see-all')}
                </Button>
              )}
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
