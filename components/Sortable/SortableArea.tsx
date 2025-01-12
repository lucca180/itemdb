import React, { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import SortableItem from './SortableItemCard';
import ListViewport, { ListViewportProps } from '../UserLists/ListViewport';

export default function SortableArea(props: ListViewportProps) {
  const { itemInfo, items, activateSort } = props;
  const [activeId, setActiveId] = useState<number | null>(null);
  const [ids, setIds] = useState(props.ids);

  useEffect(() => {
    setIds(props.ids);
  }, [props.ids]);

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <SortableContext items={ids} disabled={!activateSort} strategy={rectSortingStrategy}>
        <ListViewport {...props} ids={ids} />
      </SortableContext>
      <DragOverlay>
        {activeId ? <SortableItem id={activeId} item={items[itemInfo[activeId].item_iid]} /> : null}
      </DragOverlay>
    </DndContext>
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(Number(active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over?.id) {
      setIds((ids) => {
        const oldIndex = ids.indexOf(Number(active.id));
        const newIndex = ids.indexOf(Number(over.id));

        const newIds = arrayMove(ids, oldIndex, newIndex);
        props.onSort?.(newIds);

        return newIds;
      });
    }

    setActiveId(null);
  }
}
