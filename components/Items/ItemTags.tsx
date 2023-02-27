import { Button, Flex, Tag, Text } from '@chakra-ui/react'
import React from 'react'
import { ItemData, ItemTag } from '../../types'
import CardBase from '../Card/CardBase'

type Props = {
  item: ItemData
  tags: ItemTag[]
  toggleModal: () => void
}

const ItemTags = (props: Props) => {
  const { item, tags, toggleModal } = props
  const color = item.color.rgb
  const tagsFiltered = tags.filter((a) => a.type == 'tag')

  return (
    <CardBase title="Tags" color={item.color.rgb}>
      <Flex wrap="wrap" gap={2} justifyContent="center">
        {tagsFiltered.map((tag, i) => (
          <Tag
            variant="subtle"
            key={i}
            bg={`rgba(${color[0]}, ${color[1]}, ${color[2]}, .45)`}
          >
            {tag.name}
          </Tag>
        ))}
        {tagsFiltered.length === 0 && (
          <Flex flexFlow="column" gap={2}>
            <Text fontSize="xs" color="gray.200">
              This item doesn&apos;t have any tags yet :(
            </Text>
            <Button size="sm" variant="solid" onClick={toggleModal}>
              Add New Tags
            </Button>
          </Flex>
        )}
      </Flex>
    </CardBase>
  )
}

export default ItemTags
