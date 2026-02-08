import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ListItemInfo, ItemData, UserList } from '../../types';
import debounce from 'lodash/debounce';
import { ViewportList } from 'react-viewport-list';
import { Box, Flex, useSize } from '@chakra-ui/react';
import { EditableItemCard, EditableItemCardProps } from './EditableItemCard';
import dynamic from 'next/dynamic';

const SortableItem = dynamic<EditableItemCardProps>(() => import('../Sortable/SortableItemCard'));

export type ListViewportProps = {
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
    value: number | string | null,
    field:
      | 'amount'
      | 'capValue'
      | 'isHighlight'
      | 'isHidden'
      | 'order'
      | 'seriesStart'
      | 'seriesEnd'
  ) => void;
  onListAction?: (item: ItemData, action: 'move' | 'delete') => void;
};

export default function ListViewport(props: ListViewportProps) {
  const elementRef = useRef(null);
  const dimensions = useSize(elementRef, { observeMutation: true });

  const { itemInfo, items, editMode, activateSort, list } = props;
  const [forceIds, setIds] = useState(props.ids);
  const prevProps = React.useRef(props.ids);

  const ids = useMemo(() => {
    if (!checkEqual(prevProps.current, props.ids)) {
      prevProps.current = props.ids;
      setIds(props.ids);

      return props.ids;
    }

    return forceIds;
  }, [props.ids, forceIds]);

  const debouncedOnChange = useCallback(
    // eslint-disable-next-line react-hooks/use-memo
    debounce(
      (
        id: number,
        value: number | string | null,
        field:
          | 'amount'
          | 'capValue'
          | 'isHighlight'
          | 'isHidden'
          | 'order'
          | 'seriesStart'
          | 'seriesEnd'
      ) => props.onChange?.(id, value, field),
      250
    ),
    [props.onChange]
  );

  const groupedIds = useMemo(
    () =>
      ids
        .filter((i) => {
          if (!i) return false;
          const item = itemInfo[i];
          const itemData = items[item?.item_iid];
          if (!itemData) return false;
          return !item?.isHidden || (editMode && !activateSort);
        })
        .reduce((acc, cur, i) => {
          const itemSizeMap = {
            sm: editMode ? 162 : 112,
            md: editMode ? 162 : 162,
          };

          const itemSize = dimensions && window.innerWidth >= 768 ? itemSizeMap.md : itemSizeMap.sm;
          const groupSize = dimensions ? Math.floor(dimensions.width / itemSize) : 8;

          const groupIndex = Math.floor(i / groupSize);
          if (!acc[groupIndex]) acc[groupIndex] = [];
          acc[groupIndex].push(cur);
          return acc;
        }, [] as number[][]),
    [ids, editMode, dimensions?.width]
  );

  return (
    <>
      <Box w="100%" ref={elementRef} h="1px"></Box>
      <ViewportList items={groupedIds} viewportRef={null} initialPrerender={3} overscan={2}>
        {(group, index) => (
          <Flex gap={[1, 3]} key={index} justifyContent="center" flexWrap={'wrap'}>
            {group.map((id) => {
              const itemProps: EditableItemCardProps = {
                id,
                list,
                sortType: props.sortType,
                onClick: props.onClick,
                itemInfo: itemInfo[id],
                onChange: debouncedOnChange,
                isTrading: list?.purpose === 'trading',
                selected: props.itemSelect?.includes(id),
                editMode: editMode && !activateSort,
                onListAction: props.onListAction,
                item: items[itemInfo[id]?.item_iid],
              };

              if (!itemProps.item) return null;

              return (
                <React.Fragment key={id}>
                  {activateSort ? (
                    <SortableItem {...itemProps} />
                  ) : (
                    <EditableItemCard {...itemProps} />
                  )}
                </React.Fragment>
              );
            })}
          </Flex>
        )}
      </ViewportList>
    </>
  );
}

const checkEqual = (a: number[], b: number[]) => {
  return a.length === b.length && JSON.stringify(a) === JSON.stringify(b);
};
