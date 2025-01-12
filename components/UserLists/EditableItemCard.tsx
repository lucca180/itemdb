import React, { useEffect, useState } from 'react';
import ItemCard from '../Items/ItemCard';
import { ItemData, ListItemInfo } from '../../types';
import { VStack, Box } from '@chakra-ui/react';
import dynamic from 'next/dynamic';

const EditableFields = dynamic(() => import('./EditableFields'));

export type EditableItemCardProps = {
  id: number;
  item: ItemData;
  isTrading?: boolean;
  itemInfo?: ListItemInfo;
  editMode?: boolean;
  selected?: boolean;
  sortType?: string;
  onChange?: (
    id: number,
    value: number,
    field: 'amount' | 'capValue' | 'isHighlight' | 'isHidden' | 'order'
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
  const [isSelected, setSelected] = useState<boolean>(selected ?? false);

  useEffect(() => {
    if (!editMode) setSelected(false);
    else if (selected !== isSelected) setSelected(selected ?? false);
  }, [selected, editMode]);

  const handleItemInfoChange = (
    value: number,
    field: 'amount' | 'capValue' | 'isHighlight' | 'order'
  ) => {
    if (!itemInfo) return;
    const newInfo = { ...itemInfo };

    if (field === 'isHighlight') newInfo[field] = !!value;
    else newInfo[field] = value;

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
          item={item}
          sortType={sortType}
          disableLink={editMode}
          onSelect={() => onClick(null, true)}
          onListAction={props.onListAction}
          selected={isSelected}
          disablePrefetch
          capValue={isTrading ? itemInfo?.capValue ?? undefined : undefined}
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
