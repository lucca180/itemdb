'use client';

import { Button, Center, Heading, Link, Spinner, Tabs, Text } from '@chakra-ui/react';
import { useToast } from '@utils/theme/toast';
import axios from 'axios';
import { useState } from 'react';
import HeaderCard from '@components/Card/HeaderCard';
import MainLink from '@components/Utils/MainLink';
import { InfoTab, CategoriesTab } from '@components/Modal/EditItemModal';
import { ItemData } from '@types';
import { useAuth } from '@utils/auth';

const defaultItem: Partial<ItemData> = {
  internal_id: -1,
  canonical_id: null,
  item_id: null,
  name: '',
  description: '',
  cacheHash: null,
  image: '',
  image_id: '',
  category: null,
  rarity: null,
  weight: null,
  type: 'np',
  isBD: false,
  isNC: false,
  isWearable: false,
  isNeohome: false,
  estVal: null,
  status: 'active',
  isMissingInfo: true,
  slug: null,
  comment: null,
  price: null as any,
  color: null as any,
  findAt: null as any,
  firstSeen: null,
  saleStatus: null,
  useTypes: {
    canEat: 'unknown',
    canRead: 'unknown',
    canOpen: 'unknown',
    canPlay: 'unknown',
  },
  mallData: null,
};

export function CreateItemPageClient() {
  const toast = useToast();
  const { user, authLoading } = useAuth();
  const [item, setItem] = useState<Partial<ItemData>>(defaultItem);
  const [tags, setTags] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (nextTags: string[], type: 'tags' | 'categories' | 'special') => {
    if (type === 'tags') setTags(nextTags);
    else if (type === 'special') {
      const itemCopy = { ...item };

      if (nextTags.includes('nc')) {
        itemCopy.isNC = true;
        itemCopy.type = 'nc';
      } else if (nextTags.includes('np')) {
        itemCopy.isNC = false;
        itemCopy.type = 'np';
      } else if (nextTags.includes('pb')) {
        itemCopy.isNC = false;
        itemCopy.type = 'pb';
      }

      if (nextTags.includes('wearable')) itemCopy.isWearable = true;
      else itemCopy.isWearable = false;

      if (nextTags.includes('neohome')) itemCopy.isNeohome = true;
      else itemCopy.isNeohome = false;

      setItem(itemCopy);
    }
  };

  const createItem = async () => {
    if (!item.name || !item.image) {
      toast({
        id: 'create-item-missing-fields',
        title: 'Missing required fields.',
        description: 'Please fill out the name and image fields.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });

      return;
    }

    let subtext = '';

    if (item.isWearable) subtext += '(wearable)';
    if (item.isNeohome) subtext += '(neohome)';

    const itemData = {
      item_id: item.item_id ?? undefined,
      name: item.name,
      description: item.description,
      img: item.image,
      subText: subtext,
      estVal: item.estVal ?? undefined,
      rarity: item.rarity ?? undefined,
      weight: item.weight ?? undefined,
      category: item.category ?? undefined,
      status: item.status ?? undefined,
      comment: item.comment ?? undefined,
      type: item.type,
    };

    const toastID = toast({
      id: 'create-item',
      title: 'Creating item...',
      status: 'info',
      duration: null,
      isClosable: false,
    });

    try {
      const res = await fetch('/api/v1/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'itemdb-version': 'admin-panel',
        },
        body: JSON.stringify({
          lang: 'en',
          items: [itemData],
          hash: null,
        }),
      });

      if (!res.ok) {
        throw new Error(`Create failed with status ${res.status}`);
      }

      await axios.post('/api/v1/items/process', {});

      toast.update(toastID, {
        id: toastID,
        title: 'Item created.',
        description: 'The item was successfully created.',
        status: 'success',
        duration: 5000,
      });
      setItem(defaultItem);
      setTags([]);
    } catch (err) {
      console.error(err);
      toast.update(toastID, {
        id: toastID,
        title: 'Error creating item.',
        description: 'There was an error creating the item.',
        status: 'error',
        duration: 10000,
      });
    }
  };

  if (authLoading) {
    return (
      <Center minH="60vh">
        <Spinner />
      </Center>
    );
  }

  if (!user?.isAdmin) {
    return (
      <Center minH="60vh">
        <Heading size="md">You are not authorized to access this page.</Heading>
      </Center>
    );
  }

  return (
    <>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/nt/ntimages/441_xweetok_agent.gif',
          alt: 'xweetok agent thumbnail',
        }}
        color="#7AB92A"
      >
        <Heading as="h1" size="lg">
          Create New Item
        </Heading>
        <Text fontSize={{ base: 'sm', md: undefined }}>
          Preffer to use the{' '}
          <Link asChild fontWeight="bold">
            <MainLink href="/contribute">Item Data Extractor</MainLink>
          </Link>{' '}
          instead this page.
          <br />
          It&apos;s not possible to create tags or categories here. You will have to do it after the
          item is created.
        </Text>
      </HeaderCard>
      <Tabs.Root variant="line" colorPalette="gray" lazyMount defaultValue="info">
        <Tabs.List>
          <Tabs.Trigger value="info">Item Info</Tabs.Trigger>
          <Tabs.Trigger value="categories">Categories and Tags</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="info">
          <InfoTab
            item={item as ItemData}
            itemProps={defaultItem as ItemData}
            onChange={handleChange}
          />
        </Tabs.Content>
        <Tabs.Content value="categories">
          <CategoriesTab
            categories={[]}
            tags={tags}
            onSelectChange={() => {}}
            item={item as ItemData}
            itemProps={defaultItem as ItemData}
            onChange={handleTagsChange}
          />
        </Tabs.Content>
      </Tabs.Root>
      <Center>
        <Button colorPalette="green" onClick={createItem}>
          Create Item
        </Button>
      </Center>
    </>
  );
}
