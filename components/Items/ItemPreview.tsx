import { AspectRatio, Box, Flex, Link, Skeleton, Text } from '@chakra-ui/react'
import React, { useState } from 'react'
import Image from 'next/image'
import { ItemData } from '../../types'
import { ExternalLinkIcon } from '@chakra-ui/icons'

type Props = {
  item: ItemData
}

const ItemPreview = (props: Props) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const { item } = props
  const color = item.color.rgb

  return (
    <Flex
      // flex={1}
      // maxW='300px'
      width="fit-content"
      borderRadius="md"
      overflow="hidden"
      flexFlow="column"
      boxShadow="sm"
      w="100%"
    >
      <Box
        p={2}
        textAlign="center"
        fontWeight="bold"
        bg={`rgba(${color[0]}, ${color[1]}, ${color[2]}, .6)`}
      >
        <Text>Item Preview</Text>
      </Box>
      <Flex
        // p={3}
        position="relative"
        bg="gray.600"
        boxShadow="md"
        gap={4}
        flexWrap="wrap"
        justifyContent="center"
        alignItems="center"
        h="100%"
      >
        <Skeleton minW={300} minH={300} h="100%" w="100%" isLoaded={isLoaded}>
          <AspectRatio ratio={1}>
            <Image
              src={'/api/cache/preview/' + item.image_id + '.png'}
              alt="Item Preview"
              unoptimized
              fill
              onLoadingComplete={() => setIsLoaded(true)}
            />
          </AspectRatio>
        </Skeleton>
      </Flex>
      <Box
        p={1}
        textAlign="center"
        fontWeight="bold"
        bg={`rgba(${color[0]}, ${color[1]}, ${color[2]}, .6)`}
      >
        <Text fontSize="small">
          Powered by{' '}
          <Link href={item.findAt.dti} isExternal>
            Dress To Impress{' '}
            <ExternalLinkIcon mx="1px" verticalAlign="baseline" />
          </Link>
        </Text>
      </Box>
    </Flex>
  )
}

export default ItemPreview
