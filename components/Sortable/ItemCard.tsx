import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ItemCard from '../Items/ItemCard'
import { ItemData, ListItemInfo } from '../../types'

type Props = {
  id: number
  item: ItemData
  isTrading?: boolean
  itemInfo?: ListItemInfo
  editMode?: boolean
  selected?: boolean
  onClick?: () => void
}

export function SortableItem(props: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'manipulation',
    height: '100%',
  }

  return (
    <div
      ref={setNodeRef}
      onClick={props.onClick}
      style={style}
      {...attributes}
      {...listeners}
    >
      <ItemCard
        item={props.item}
        disableLink={props.editMode}
        selected={props.selected}
        capValue={
          props.isTrading ? props.itemInfo?.capValue ?? undefined : undefined
        }
        quantity={props.itemInfo?.amount ?? undefined}
      />
    </div>
  )
}
