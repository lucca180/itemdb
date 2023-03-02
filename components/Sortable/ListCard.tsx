import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UserList } from '../../types';
import UserListCard from '../UserLists/ListCard';
import { Box } from '@chakra-ui/react';

type Props = {
  id: number;
  list: UserList;
  editMode?: boolean;
  selected?: boolean;
  onClick?: () => void;
};

export function SortableListCard(props: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: props.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'manipulation',
    height: '100%',
    cursor: props.editMode ? undefined : 'default',
  };

  return (
    <Box
      ref={setNodeRef}
      onClick={props.onClick}
      style={style}
      {...attributes}
      {...listeners}
      w={{ base: '100%', sm: 'auto' }}
    >
      <UserListCard list={props.list} isSelected={props.selected} disableLink={props.editMode} />
    </Box>
  );
}
