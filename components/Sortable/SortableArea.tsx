import React, { useCallback, useEffect, useState } from 'react';
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
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { ListItemInfo, ItemData, UserList } from '../../types';
import { SortableItem } from './ItemCard';
import {
  InputGroup,
  InputLeftAddon,
  VStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Checkbox,
  Text,
} from '@chakra-ui/react';
import debounce from 'lodash/debounce';

type Props = {
  ids: number[];
  list?: UserList;
  itemInfo: { [id: string]: ListItemInfo };
  items: { [id: string]: ItemData };
  itemSelect?: number[];
  editMode?: boolean;
  activateSort?: boolean;
  onClick?: (id: number) => void;
  onSort?: (ids: number[]) => void;
  onChange?: (
    id: number,
    value: number,
    field: 'amount' | 'capValue' | 'isHighlight'
  ) => void;
};

export function SortableArea(props: Props) {
  const { itemInfo, items, editMode, activateSort, list } = props;
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

  const debouncedOnChange = useCallback(
    debounce(
      (
        id: number,
        value: number,
        field: 'amount' | 'capValue' | 'isHighlight'
      ) => props.onChange?.(id, value, field),
      250
    ),
    [props.onChange]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <SortableContext
        items={ids}
        disabled={!activateSort}
        strategy={rectSortingStrategy}
      >
        {ids.map((id) => {
          const item = items[itemInfo[id]?.item_iid];
          if (!item) return null;

          const listItem = itemInfo[id];
          return (
            <VStack mb={3} key={id}>
              <SortableItem
                isTrading={list?.purpose === 'trading'}
                selected={props.itemSelect?.includes(id)}
                onClick={() => props.onClick?.(id)}
                editMode={editMode}
                id={id}
                itemInfo={listItem}
                item={item}
              />
              {editMode && !activateSort && (
                <VStack maxW="150px">
                  <InputGroup size="xs">
                    <InputLeftAddon children="Quantity" />
                    <NumberInput
                      max={999}
                      min={1}
                      variant="filled"
                      defaultValue={listItem.amount}
                      onChange={(value) =>
                        debouncedOnChange(id, Number(value || 0), 'amount')
                      }
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </InputGroup>
                  {item.isNC && list?.purpose === 'trading' && (
                    <InputGroup size="xs">
                      <InputLeftAddon children="Cap Value" />
                      <NumberInput
                        defaultValue={listItem.capValue ?? undefined}
                        min={0}
                        max={99}
                        variant="filled"
                        onChange={(value) =>
                          debouncedOnChange(id, Number(value || 0), 'capValue')
                        }
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </InputGroup>
                  )}
                  <Checkbox
                    defaultChecked={listItem.isHighlight}
                    size="sm"
                    onChange={(value) =>
                      props.onChange?.(
                        id,
                        Number(value.target.checked),
                        'isHighlight'
                      )
                    }
                  >
                    <Text fontSize="xs">Highlight?</Text>
                  </Checkbox>
                </VStack>
              )}
            </VStack>
          );
        })}
      </SortableContext>
      <DragOverlay>
        {activeId ? (
          <SortableItem
            id={activeId}
            item={items[itemInfo[activeId].item_iid]}
          />
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
