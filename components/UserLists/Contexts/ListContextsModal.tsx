'use client';

import { Box, CloseButton, Dialog, Flex, Image, Portal, Stack } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { ItemV2For, ListContext } from '@types';
import { ListContextPanel } from '@components/UserLists/Contexts/ListContextPopover';

export type ListContextsModalProps = {
  open: boolean;
  /** Context to scroll to when opening */
  focusId?: number | null;
  onClose: () => void;
  contexts: ListContext[];
  items: Record<string, ItemV2For<'card'>>;
};

export function ListContextItemThumbs({
  iids,
  items,
}: {
  iids: number[];
  items: Record<string, ItemV2For<'card'>>;
}) {
  return (
    <Flex gap={1} flexWrap="wrap">
      {iids.map((iid) => {
        const item = items[iid];
        if (!item) return null;
        return (
          <Image
            key={iid}
            src={item.image.url}
            alt={item.name}
            title={item.name}
            w="36px"
            h="36px"
            borderRadius="sm"
          />
        );
      })}
    </Flex>
  );
}

/** Every context of a list, read-only. */
export default function ListContextsModal({
  open,
  focusId,
  onClose,
  contexts,
  items,
}: ListContextsModalProps) {
  const t = useTranslations();

  // jump to the context the popover came from
  useEffect(() => {
    if (!open || !focusId) return;
    const timer = setTimeout(
      () => document.getElementById(`list-context-${focusId}`)?.scrollIntoView({ block: 'start' }),
      150
    );
    return () => clearTimeout(timer);
  }, [open, focusId]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => !e.open && onClose()}
      size={{ base: 'full', md: 'lg' }}
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          {/* `full` on mobile sets minH 100dvh and square corners; md+ sizes don't undo them */}
          <Dialog.Content bg="gray.800" minH={{ md: 'auto' }} borderRadius={{ md: 'l3' }}>
            <Dialog.Header>
              <Dialog.Title>{t('Lists.contexts-modal-title')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={3}>
                {contexts.map((context) => (
                  <Box
                    key={context.internal_id}
                    id={`list-context-${context.internal_id}`}
                    p={3}
                    borderRadius="md"
                    bg="blackAlpha.400"
                    outline={context.internal_id === focusId ? '1px solid' : undefined}
                    outlineColor="whiteAlpha.500"
                    style={{ borderLeft: `4px solid ${context.color}` }}
                  >
                    <Stack gap={2}>
                      <ListContextPanel context={context} />
                      <ListContextItemThumbs iids={context.itemIids} items={items} />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
