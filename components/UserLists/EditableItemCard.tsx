import React, { useState } from 'react';
import ItemCard from '../Items/ItemCard';
import { ItemData, ListItemInfo, UserList } from '../../types';
import { VStack, Box } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import { dynamicListCan } from '@utils/utils';

const EditableFields = dynamic(() => import('./EditableFields'));

export type EditableItemCardProps = {
  id: number;
  item: ItemData;
  isTrading?: boolean;
  itemInfo?: ListItemInfo;
  editMode?: boolean;
  selected?: boolean;
  sortType?: string;
  list?: UserList;
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
  onClick?: (id: number, force?: boolean) => void;
  onListAction?: (item: ItemData, action: 'move' | 'delete') => any;
  innerRef?: any;
  style?: React.CSSProperties;
  attributes?: any;
  listeners?: any;
};

export function EditableItemCard(props: EditableItemCardProps) {
  const { id, item, editMode, isTrading, selected, sortType } = props;
  const [itemInfo, setItemInfo] = useState<ListItemInfo | undefined>(props.itemInfo);
  const [shouldSelect, setSelected] = useState<boolean>(selected ?? false);

  const isSelected = editMode && (props.selected ?? shouldSelect ?? false);

  const handleItemInfoChange = (
    value: number | string | null,
    field: 'amount' | 'capValue' | 'isHighlight' | 'order' | 'seriesStart' | 'seriesEnd'
  ) => {
    if (!itemInfo) return;
    const newInfo = { ...itemInfo } as any;

    if (['seriesStart', 'seriesEnd'].includes(field)) {
      newInfo[field] = value as string | null;
    } else {
      if (field === 'isHighlight') newInfo[field] = !!value;
      else newInfo[field] = value as number;
    }
    setItemInfo(newInfo);
    props.onChange?.(id, value, field);
  };

  const onClick = (e: React.MouseEvent<any> | null, force = false) => {
    if (!editMode && !e?.ctrlKey && !force) return;

    if (e?.ctrlKey) {
      force = true;
      e.preventDefault();
      e.stopPropagation();
    }
    setSelected(!isSelected);
    props.onClick?.(id, force);
  };

  if (!editMode && itemInfo?.isHidden) return null;

  return (
    <VStack
      ref={props.innerRef}
      style={props.style}
      {...props.attributes}
      {...props.listeners}
      mb={3}
      opacity={itemInfo?.isHidden ? 0.5 : 1}
    >
      <Box onClick={(e) => onClick(e)} style={{ height: '100%' }}>
        <ItemCard
          uniqueID="editable-item-card"
          item={item}
          sortType={sortType}
          disableLink={editMode}
          onSelect={() => onClick(null, true)}
          onListAction={dynamicListCan(props.list, 'remove') ? props.onListAction : undefined}
          selected={isSelected}
          disablePrefetch
          capValue={isTrading ? (itemInfo?.capValue ?? undefined) : undefined}
          quantity={itemInfo?.amount ?? undefined}
        />
      </Box>
      {editMode && (
        <>
          <EditableFields
            {...props}
            handleItemInfoChange={handleItemInfoChange}
            itemInfo={itemInfo}
          />
        </>
      )}
    </VStack>
  );
}
