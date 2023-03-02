import { Center, Divider, Flex, Heading, Spinner, Tag, Text } from '@chakra-ui/react';
import axios from 'axios';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ItemData, ItemTag } from '../../types';

type Props = {
  item_iid: number;
  itemTags: string[];
};

const FeedbackItem = (props: Props) => {
  const { item_iid, itemTags } = props;
  const [item, setItem] = useState<ItemData | undefined>();
  const [tags, setTags] = useState<ItemTag[]>([]);

  const tagsStr = tags.map((tag) => tag.name);

  useEffect(() => {
    if (item_iid) fetchItem();
  }, [item_iid]);

  const fetchItem = async () => {
    const itemPromise = axios.get('/api/v1/items/' + item_iid);

    const tagPromise = axios.get('/api/v1/items/' + item_iid + '/tags');

    const [itemRes, tagsRes] = await Promise.all([itemPromise, tagPromise]);

    const tagsFiltered = tagsRes.data.filter((tag: ItemTag) => tag.type === 'tag');

    setItem(itemRes.data);
    setTags(tagsFiltered);
  };

  return (
    <Flex flexFlow="column" gap={3}>
      {!item && (
        <Center>
          <Spinner size="lg" />
        </Center>
      )}

      {item && (
        <>
          <Flex flexFlow="column" justifyContent="center" alignItems="center" textAlign="center">
            <Image src={item.image} alt={item.name} width={60} height={60} />
            <Text>{item.name}</Text>
            <Text fontSize={'xs'} color="gray.400">
              {item.description}
            </Text>
          </Flex>
          <Divider />
          <Center>
            <Heading size="sm">
              Current Tags <Tag size="sm">{tags.length}</Tag>
            </Heading>
          </Center>
          <Flex
            flexFlow="row"
            flexWrap="wrap"
            justifyContent="center"
            alignItems="center"
            textAlign="center"
          >
            {tags.map((tag) => (
              <Tag key={tag.tag_id} colorScheme={!itemTags.includes(tag.name) ? 'red' : undefined}>
                {tag.name}
              </Tag>
            ))}
            {tags.length === 0 && (
              <Text fontSize={'xs'} color="gray.400">
                No tags
              </Text>
            )}
          </Flex>
          <Center>
            <Heading size="sm">
              After Change <Tag size="sm">{itemTags.length}</Tag>
            </Heading>
          </Center>
          <Flex
            flexFlow="row"
            flexWrap="wrap"
            justifyContent="center"
            alignItems="center"
            textAlign="center"
          >
            {itemTags.map((tag, i) => (
              <Tag key={i} colorScheme={!tagsStr.includes(tag) ? 'green' : undefined}>
                {tag}
              </Tag>
            ))}
            {itemTags.length === 0 && (
              <Text fontSize={'xs'} color="gray.400">
                No tags
              </Text>
            )}
          </Flex>
        </>
      )}
    </Flex>
  );
};

export default FeedbackItem;
