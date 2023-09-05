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
import { UserList } from '../../types';
import { SortableListCard } from './ListCard';

export type SortableListsProps = {
  ids: number[];
  lists: { [id: number]: UserList };
  listSelect?: number[];
  activateSort?: boolean;
  editMode?: boolean;
  onClick?: (id: number) => void;
  onSort?: (ids: number[]) => void;
  onChange?: (id: number, value: number, field: 'amount' | 'capValue' | 'isHighlight') => void;
  cardProps?: {
    [key: string]: any;
  };
};

export default function SortableLists(props: SortableListsProps) {
  const { activateSort, editMode, lists, listSelect } = props;
  const [activeId, setActiveId] = useState<number | null>(null);
  const [ids, setIds] = useState(props.ids);

  useEffect(() => {
    setIds(props.ids);
  }, [props.ids]);

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
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
        {ids.map((id) =>
          lists[id] ? (
            <SortableListCard
              onClick={() => props.onClick?.(id)}
              editMode={editMode}
              selected={listSelect?.includes(id)}
              list={lists[id]}
              id={id}
              key={id}
              cardProps={props.cardProps}
            />
          ) : null
        )}
      </SortableContext>
      <DragOverlay>
        {activeId ? (
          <SortableListCard editMode={editMode} list={lists[activeId]} id={activeId} />
        ) : null}
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
