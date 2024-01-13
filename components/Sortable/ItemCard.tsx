import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ItemCard from '../Items/ItemCard';
import { ItemData, ListItemInfo } from '../../types';
import {
  Text,
  Checkbox,
  InputGroup,
  InputLeftAddon,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  VStack,
  Box,
} from '@chakra-ui/react';
import { useInView } from 'react-intersection-observer';
import { useTranslations } from 'next-intl';

type Props = {
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
    field: 'amount' | 'capValue' | 'isHighlight' | 'isHidden'
  ) => void;
  onClick?: (id: number, force?: boolean) => void;
  onListAction?: (item: ItemData, action: 'move' | 'delete') => any;
};

function SortableItem1(props: Props) {
  const t = useTranslations();
  const ref = useRef<Element | null | undefined>();
  const { id, item, editMode, isTrading, selected, sortType } = props;
  const [itemInfo, setItemInfo] = useState<ListItemInfo | undefined>(props.itemInfo);
  const [isSelected, setSelected] = useState<boolean>(selected ?? false);
  const { ref: inViewRef, inView } = useInView();

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: props.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'manipulation',
    // height: '100%',
  };

  useEffect(() => {
    if (!editMode) setSelected(false);
    else if (selected !== isSelected) setSelected(selected ?? false);
  }, [selected, editMode]);

  const handleItemInfoChange = (value: number, field: 'amount' | 'capValue' | 'isHighlight') => {
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

  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      ref.current = node;
      inViewRef(node);
      setNodeRef(node);
    },
    [inViewRef, setNodeRef]
  );

  if (!editMode && itemInfo?.isHidden) return null;

  if (!inView)
    return (
      <VStack mb={3} ref={setRefs} style={style} {...attributes} {...listeners}>
        <Box style={{ height: '100%' }}>
          <ItemCard item={item} sortType={sortType} disablePrefetch />
        </Box>
      </VStack>
    );

  return (
    <VStack
      mb={3}
      ref={setRefs}
      style={style}
      {...attributes}
      {...listeners}
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
        <VStack maxW="150px">
          <InputGroup size="xs">
            <InputLeftAddon children={t('General.quantity')} />
            <NumberInput
              max={999}
              min={1}
              variant="filled"
              defaultValue={itemInfo?.amount}
              onChange={(value) => handleItemInfoChange(Number(value || 1), 'amount')}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </InputGroup>
          {item.isNC && isTrading && (
            <InputGroup size="xs">
              <InputLeftAddon children={t('General.cap-value')} />
              <NumberInput
                defaultValue={itemInfo?.capValue ?? undefined}
                min={0}
                max={99}
                variant="filled"
                onChange={(value) => handleItemInfoChange(Number(value || 0), 'capValue')}
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
            defaultChecked={itemInfo?.isHighlight}
            size="sm"
            onChange={(value) => props.onChange?.(id, Number(value.target.checked), 'isHighlight')}
          >
            <Text fontSize="xs">{t('Lists.highlight')}?</Text>
          </Checkbox>
          <Checkbox
            defaultChecked={itemInfo?.isHidden}
            size="sm"
            onChange={(value) => props.onChange?.(id, Number(value.target.checked), 'isHidden')}
          >
            <Text fontSize="xs">{t('Lists.hidden')}?</Text>
          </Checkbox>
        </VStack>
      )}
    </VStack>
  );
}

export const SortableItem = React.memo(SortableItem1);
