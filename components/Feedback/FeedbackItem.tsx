import { Center, Divider, Flex, Heading, Spinner, Tag, Text } from '@chakra-ui/react';
import axios from 'axios';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ItemData, ItemTag } from '../../types';

type Props = {
  item_iid: number;
  itemTags: string[];
  itemNotes?: string;
};

const FeedbackItem = (props: Props) => {
  const { item_iid, itemTags } = props;
  const [item, setItem] = useState<ItemData | undefined>();
  const [tags, setTags] = useState<ItemTag[]>([]);
  const [shouldHideTags, setShouldHideTags] = useState(false);
  const [shouldHideNotes, setShouldHideNotes] = useState(false);

  const tagsStr = tags.map((tag) => tag.name);

  const fetchItem = async () => {
    const itemPromise = axios.get('/api/v1/items/' + item_iid);

    const tagPromise = axios.get('/api/v1/items/' + item_iid + '/tags');

    const [itemRes, tagsRes] = await Promise.all([itemPromise, tagPromise]);

    const tagsFiltered = tagsRes.data.filter((tag: ItemTag) => tag.type === 'tag');

    //check if tags are the same
    let hideTags = true;
    if (tagsFiltered.length !== itemTags.length) hideTags = false;
    else {
      hideTags = tagsFiltered.every((tag: ItemTag) => itemTags.includes(tag.name));
    }

    let hideNotes = true;
    if (itemRes.data.comment !== props.itemNotes) hideNotes = false;

    setItem(itemRes.data);
    setTags(tagsFiltered);
    setShouldHideTags(hideTags);
    setShouldHideNotes(hideNotes);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (item_iid) fetchItem();
  }, [item_iid]);

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
          <Heading size="md" textAlign="center">
            Now
          </Heading>
          {!shouldHideTags && (
            <>
              <Heading size="sm" textAlign="center">
                Tags <Tag size="sm">{tags.length}</Tag>
              </Heading>
              <Flex
                flexFlow="row"
                flexWrap="wrap"
                justifyContent="center"
                alignItems="center"
                textAlign="center"
              >
                {tags.map((tag) => (
                  <Tag
                    key={tag.tag_id}
                    colorScheme={!itemTags.includes(tag.name) ? 'red' : undefined}
                  >
                    {tag.name}
                  </Tag>
                ))}
                {tags.length === 0 && (
                  <Text fontSize={'xs'} color="gray.400">
                    No tags
                  </Text>
                )}
              </Flex>
            </>
          )}
          {!shouldHideNotes && (
            <>
              <Heading size="sm" textAlign="center">
                Notes
              </Heading>
              <Text fontSize="sm" textAlign="center">
                {item.comment ?? 'none'}
              </Text>
            </>
          )}
          <Divider />
          <Heading size="md" textAlign="center">
            Suggested Changes
          </Heading>
          {!shouldHideTags && (
            <>
              <Heading size="sm" textAlign="center">
                Tags <Tag size="sm">{itemTags.length}</Tag>
              </Heading>
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
          {!shouldHideNotes && (
            <>
              <Heading size="sm" textAlign="center">
                Notes
              </Heading>
              <Text fontSize="sm" textAlign="center">
                {props.itemNotes}
              </Text>
            </>
          )}
        </>
      )}
    </Flex>
  );
};

export default FeedbackItem;
