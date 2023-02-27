import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
} from '@chakra-ui/react'
import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Image from 'next/image'
import {
  FullItemColors,
  ItemData,
  ItemLastSeen,
  ItemTag,
  PriceData,
  TradeData,
} from '../../types'
import { useRouter } from 'next/router'
import FindAtCard from '../../components/Items/FindAtCard'
import ItemInfoCard from '../../components/Items/InfoCard'
import ColorInfoCard from '../../components/Items/ColorInfoCard'
import MissingInfoCard from '../../components/Items/MissingInfoCard'
import ItemPreview from '../../components/Items/ItemPreview'
import ItemPriceCard from '../../components/Price/ItemPriceCard'
import axios from 'axios'
import TradeCard from '../../components/Trades/TradeCard'
import ItemTags from '../../components/Items/ItemTags'
import ItemCats from '../../components/Items/CategoryCard'
import { FiSend, FiEdit3 } from 'react-icons/fi'
import EditItemModal from '../../components/Modal/EditItemModal'
import FeedbackModal from '../../components/Modal/FeedbackModal'
import AddToListSelect from '../../components/UserLists/AddToListSelect'

const defaultLastSeen: ItemLastSeen = {
  sw: null,
  tp: null,
  auction: null,
  restock: null,
}

const ItemPage = () => {
  const [item, setItem] = useState<ItemData | null>(null)
  const [colors, setColors] = useState<FullItemColors | null>(null)
  const [prices, setPrices] = useState<PriceData[] | null>(null)
  const [seenStats, setSeen] = useState<ItemLastSeen>(defaultLastSeen)
  const [trades, setTrades] = useState<TradeData[]>([])
  const [tags, setTags] = useState<ItemTag[]>([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)

  const color = item?.color.rgb ?? [255, 255, 255];
  const router = useRouter()

  useEffect(() => {
    init()
  }, [router])

  const init = async () => {
    const id = router.query.id

    if (!id) return

    const resItem = await axios.get('/api/v1/items/' + id)
    const itemData = resItem.data as ItemData

    setItem(itemData)

    const [resColor, resPrice, resStats, resTrades, resTags] =
      await Promise.all([
        axios.get('/api/v1/items/colors?image_id=' + itemData.image_id),
        axios.get(
          `/api/prices/get?item_id=${itemData.item_id ?? -1}&name=${
            itemData.name
          }&image_id=${itemData.image_id}`
        ),
        axios.get(
          `/api/prices/stats?item_id=${itemData.item_id ?? -1}&name=${
            itemData.name
          }&image_id=${itemData.image_id}`
        ),
        axios.get(
          `/api/trades/get?name=${itemData.name}&image_id=${itemData.image_id}`
        ),
        axios.get(`/api/v1/items/${id}/tags`),
      ])

    setColors(resColor.data)
    setPrices(resPrice.data ?? [])
    setSeen(resStats.data)
    setTrades(resTrades.data)
    setTags(resTags.data)
  }

  if (!item) return null

  return (
    <Layout>
      {item && (
        <EditItemModal
          isOpen={isEditModalOpen}
          item={item}
          onClose={() => setIsEditModalOpen(false)}
          tags={tags}
        />
      )}
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
      />
      <Box>
        <Box
          position="absolute"
          h="40vh"
          left="0"
          width="100%"
          bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${color[0]},${color[1]}, ${color[2]},.4) 80%)`}
          zIndex={-1}
        />
        <Flex gap={8} pt={6} alignItems="center">
          <Flex
            position="relative"
            p={2}
            bg={`rgba(${color[0]},${color[1]}, ${color[2]},.4)`}
            borderRadius="md"
            flexFlow="column"
            justifyContent="center"
            gap={2}
            alignItems="center"
            boxShadow="sm"
            textAlign="center"
            flex="0 0 auto"
            minW="100px"
            minH="100px"
          >
            <Image src={item.image} width={80} height={80} alt={item.name} />
          </Flex>
          <Box>
            <Stack direction="row" mb={1}>
              {<Badge borderRadius="md">{item.category ?? '???'}</Badge>}
              {!item.isNC && (
                <Badge colorScheme="green" borderRadius="md">
                  NP
                </Badge>
              )}
              {item.isNC && (
                <Badge colorScheme="purple" borderRadius="md">
                  NC
                </Badge>
              )}
              {item.isWearable && (
                <Badge colorScheme="blue" borderRadius="md">
                  Wearable
                </Badge>
              )}
            </Stack>
            <Heading>{item.name}</Heading>
            <Text>{item.description}</Text>
          </Box>
        </Flex>
      </Box>

      <Flex minH="500px" gap={6} mt={5}>
        <Flex flex="1" maxW="275px" flexFlow="column" gap={5}>
          <AddToListSelect item={item} />
          <FindAtCard item={item} />
          <ItemInfoCard item={item} />
          {colors && <ColorInfoCard colors={colors} />}
          <ItemTags
            toggleModal={() => setIsEditModalOpen(true)}
            item={item}
            tags={tags}
          />
          <Flex justifyContent="center" gap={3}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFeedbackModalOpen(true)}
            >
              <Icon as={FiSend} mr={1} /> Feedback
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Icon as={FiEdit3} mr={1} /> Edit
            </Button>
          </Flex>
        </Flex>
        <Flex flex="1" gap={6}>
          <Flex flex="2" flexFlow="column" gap={6}>
            {item.isMissingInfo && <MissingInfoCard />}
            <ItemPriceCard
              item={item}
              lastSeen={seenStats}
              prices={prices ?? []}
            />
            <ItemCats
              toggleModal={() => setIsEditModalOpen(true)}
              item={item}
              tags={tags}
            />
          </Flex>
          <Flex w="300px" flexFlow="column" gap={6}>
            {item.isWearable && <ItemPreview item={item} />}
            {!item.isNC && <TradeCard item={item} trades={trades} />}
          </Flex>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default ItemPage
