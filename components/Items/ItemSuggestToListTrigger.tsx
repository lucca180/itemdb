'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { chakra, useDisclosure } from '@chakra-ui/react';
import type { SuggestItemToListModalProps } from '@components/Modal/SuggestItemToListModal';
import type { ItemData } from '@types';

const SuggestItemToListModal = dynamic<SuggestItemToListModalProps>(
  () => import('@components/Modal/SuggestItemToListModal')
);

type Props = {
  item: ItemData;
  /** Official lists that already hold the item (left out of the picker). */
  excludeListIds: number[];
  /** Umami `label` of the click (`item-empty`, `item-footer`...). */
  trackLabel: string;
  /** Styling is up to the caller (tile or inline link), this only adds the button + modal. */
  children: ReactNode;
  color?: string;
};

/**
 * "Suggest this item to an official list" trigger for the item page official lists card.
 * Client-side wrapper so the (server) card can open the suggestion modal.
 */
export default function ItemSuggestToListTrigger(props: Props) {
  const { item, excludeListIds, trackLabel, children, color } = props;
  const { open, onOpen, onClose } = useDisclosure();

  return (
    <>
      <chakra.button
        type="button"
        cursor="pointer"
        color={color}
        textAlign="inherit"
        font="inherit"
        onClick={onOpen}
        data-umami-event="item-suggest-to-list"
        data-umami-event-label={trackLabel}
      >
        {children}
      </chakra.button>
      {open && (
        <SuggestItemToListModal
          isOpen={open}
          onClose={onClose}
          item={item}
          excludeListIds={excludeListIds}
          source="item-page-card"
        />
      )}
    </>
  );
}
