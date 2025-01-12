import React, { useCallback, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EditableItemCard, EditableItemCardProps } from '../UserLists/EditableItemCard';

function SortableItem(props: EditableItemCardProps) {
  const ref = useRef<Element | null | undefined>(undefined);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: props.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'manipulation',
    // height: '100%',
  };

  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      ref.current = node;
      setNodeRef(node);
    },
    [setNodeRef]
  );

  return (
    <EditableItemCard
      {...props}
      innerRef={setRefs}
      style={style}
      attributes={attributes}
      listeners={listeners}
    />
  );
}

export default SortableItem;
