'use client';

import { Box, Button, Popover, Portal, Stack, Text } from '@chakra-ui/react';
import {
  cloneElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
} from 'react';
import dynamic from 'next/dynamic';
import Color from 'color';
import { useTranslations } from 'next-intl';
import type { ListContext } from '@types';
import { useAuth } from '@utils/auth';

/** A hover only counts once the popover stayed open this long (skips cursors passing over cards). */
const HOVER_TRACK_DELAY_MS = 600;

export type ListContextTrackSurface = 'list-corner' | 'list-group' | 'item-footer';

/** Tracks list context usage in Umami. Admins curate contexts, so their events are left out. */
export function useTrackListContext() {
  const { user } = useAuth();
  const isAdmin = !!user?.isAdmin;

  return useCallback(
    (event: string, data: Record<string, string | number>) => {
      if (isAdmin) return;
      window.umami?.track(event, data);
    },
    [isAdmin]
  );
}

type PopoverOpenMethod = 'hover' | 'click';

/**
 * Reports each way a popover opened at most once per opening: a click, or a mouse hover that
 * stayed for `HOVER_TRACK_DELAY_MS`. A click before the delay only counts as a click.
 */
function usePopoverOpenTracking(open: boolean, onTrack: (method: PopoverOpenMethod) => void) {
  const onTrackRef = useRef(onTrack);
  const tracked = useRef({ hover: false, click: false });
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    onTrackRef.current = onTrack;
  });

  // closing also happens through setOpen (pointer leave, "see all"), which skips onOpenChange
  useEffect(() => {
    if (open) return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = undefined;
    tracked.current = { hover: false, click: false };
  }, [open]);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  return useMemo(() => {
    const report = (method: PopoverOpenMethod) => {
      if (tracked.current[method]) return;
      tracked.current[method] = true;
      onTrackRef.current(method);
    };
    const hoverEnd = () => {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = undefined;
    };

    return {
      hoverStart: () => {
        if (hoverTimer.current) return;
        hoverTimer.current = setTimeout(() => {
          hoverTimer.current = undefined;
          report('hover');
        }, HOVER_TRACK_DELAY_MS);
      },
      hoverEnd,
      click: () => {
        hoverEnd();
        report('click');
      },
    };
  }, []);
}

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
  /** Where the popover is, for the `list-context-popover` event. Not tracked when omitted. */
  trackAs?: ListContextTrackSurface;
  /** The trigger. It must forward props and ref to a DOM element. */
  children: ReactElement;
};

/** Context details: opens on mouse hover, a click or tap pins it open. */
export function ListContextPopover({
  contexts,
  onSeeAll,
  trackAs,
  children,
}: ListContextPopoverProps) {
  const t = useTranslations();
  const track = useTrackListContext();
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);

  const tracking = usePopoverOpenTracking(open, (method) => {
    if (!trackAs) return;
    track('list-context-popover', {
      label: trackAs,
      method,
      list: contexts[0].list_id,
      count: contexts.length,
    });
  });

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
            if (e.pointerType !== 'mouse') return;
            setOpen(true);
            if (!pinned) tracking.hoverStart();
          },
          onPointerLeave: (e: PointerEvent<HTMLElement>) => {
            if (e.pointerType !== 'mouse') return;
            tracking.hoverEnd();
            if (!pinned) setOpen(false);
          },
          onClick: (e: MouseEvent<HTMLElement>) => {
            // keeps item links from navigating and edit mode from selecting the item
            e.preventDefault();
            e.stopPropagation();
            tracking.click();
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
                    track('list-contexts-modal', {
                      label: 'see-all',
                      list: contexts[0].list_id,
                    });
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
