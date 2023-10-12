import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { ListItemInfo, ItemData, UserList } from '../../types';
import { SortableItem } from './ItemCard';
import debounce from 'lodash/debounce';
import { ViewportList } from 'react-viewport-list';
import { Flex } from '@chakra-ui/react';

export type SortableAreaProps = {
  ids: number[];
  list?: UserList;
  itemInfo: { [id: string]: ListItemInfo };
  items: { [id: string]: ItemData };
  sortType?: string;
  itemSelect?: number[];
  editMode?: boolean;
  activateSort?: boolean;
  onClick?: (id: number, force?: boolean) => void;
  onSort?: (ids: number[]) => void;
  onChange?: (
    id: number,
    value: number,
    field: 'amount' | 'capValue' | 'isHighlight' | 'isHidden'
  ) => void;
  onListAction?: (item: ItemData, action: 'move' | 'delete') => void;
};

export default function SortableArea(props: SortableAreaProps) {
  const { itemInfo, items, editMode, activateSort, list } = props;
  const [activeId, setActiveId] = useState<number | null>(null);
  const [ids, setIds] = useState(props.ids);

  const visibleIds = useMemo(
    () =>
      ids.filter((i) => {
        const item = itemInfo[i];
        return !item.isHidden || editMode;
      }),
    [ids, editMode]
  );

  useEffect(() => {
    setIds(props.ids);
  }, [props.ids]);

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } })
  );

  const debouncedOnChange = useCallback(
    debounce(
      (id: number, value: number, field: 'amount' | 'capValue' | 'isHighlight' | 'isHidden') =>
        props.onChange?.(id, value, field),
      250
    ),
    [props.onChange]
  );

  // create groups of 8 items
  const groupedIds = useMemo(
    () =>
      ids
        .filter((i) => {
          const item = itemInfo[i];
          return !item.isHidden || editMode;
        })
        .reduce((acc, cur, i) => {
          const groupIndex = Math.floor(i / 8);
          if (!acc[groupIndex]) acc[groupIndex] = [];
          acc[groupIndex].push(cur);
          return acc;
        }, [] as number[][]),
    [ids, editMode]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <SortableContext items={ids} disabled={!activateSort} strategy={rectSortingStrategy}>
        {visibleIds.length > 200 && (
          <ViewportList items={groupedIds} viewportRef={null} initialPrerender={4} overscan={2}>
            {(group, index) => (
              <Flex gap={[1, 3]} key={index} justifyContent="center" flexWrap={'wrap'}>
                {group.map((id) => (
                  <SortableItem
                    key={id}
                    id={id}
                    sortType={props.sortType}
                    onClick={props.onClick}
                    itemInfo={itemInfo[id]}
                    onChange={debouncedOnChange}
                    isTrading={list?.purpose === 'trading'}
                    selected={props.itemSelect?.includes(id)}
                    editMode={editMode && !activateSort}
                    onListAction={props.onListAction}
                    item={items[itemInfo[id]?.item_iid]}
                  />
                ))}
              </Flex>
            )}
          </ViewportList>
        )}
        {visibleIds.length <= 200 && (
          <Flex gap={[1, 3]} justifyContent="center" flexWrap={'wrap'}>
            {ids.map((id) => (
              <SortableItem
                key={id}
                id={id}
                sortType={props.sortType}
                onClick={props.onClick}
                itemInfo={itemInfo[id]}
                onChange={debouncedOnChange}
                isTrading={list?.purpose === 'trading'}
                selected={props.itemSelect?.includes(id)}
                editMode={editMode && !activateSort}
                onListAction={props.onListAction}
                item={items[itemInfo[id]?.item_iid]}
              />
            ))}
          </Flex>
        )}
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
