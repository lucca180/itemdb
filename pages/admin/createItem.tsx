import {
  Button,
  Center,
  Heading,
  Link,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { NextPageContext, NextApiRequest } from 'next';
import React, { useState } from 'react';
import HeaderCard from '../../components/Card/HeaderCard';
import Layout from '../../components/Layout';
import { InfoTab, CategoriesTab } from '../../components/Modal/EditItemModal';
import { ItemData } from '../../types';
import { useAuth } from '../../utils/auth';
import { CheckAuth } from '../../utils/googleCloud';

const defaultItem: ItemData = {
  internal_id: -1,
  canonical_id: null,
  item_id: null,
  name: '',
  description: '',
  image: '',
  image_id: '',
  category: null,
  rarity: null,
  weight: null,
  type: 'np',
  isNC: false,
  isWearable: false,
  isNeohome: false,
  estVal: null,
  specialType: null,
  status: 'active',
  isMissingInfo: true,
  slug: null,
  comment: null,
  owls: null,
  price: null as any,
  color: null as any,
  findAt: null as any,
};

const CreateItem = () => {
  const toast = useToast();
  const { user, authLoading, getIdToken } = useAuth();
  const [item, setItem] = useState<ItemData>(defaultItem);
  const [tags, setTags] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (tags: string[], type: 'tags' | 'categories' | 'special') => {
    if (type === 'tags') setTags(tags);
    // else if (type === 'categories') setCategories(tags);
    else if (type === 'special') {
      const itemCopy = { ...item };

      if (tags.includes('nc')) {
        itemCopy.isNC = true;
        itemCopy.type = 'nc';
      } else if (tags.includes('np')) {
        itemCopy.isNC = false;
        itemCopy.type = 'np';
      } else if (tags.includes('pb')) {
        itemCopy.isNC = false;
        itemCopy.type = 'pb';
      }

      if (tags.includes('wearable')) itemCopy.isWearable = true;
      else itemCopy.isWearable = false;

      if (tags.includes('neohome')) itemCopy.isNeohome = true;
      else itemCopy.isNeohome = false;

      setItem(itemCopy);
    }
  };

  const createItem = async () => {
    if (!item.name || !item.image) {
      toast({
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
      title: 'Creating item...',
      status: 'info',
      duration: null,
      isClosable: false,
    });

    try {
      const token = await getIdToken();

      const res = await fetch('/api/v1/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lang: 'en',
          items: [itemData],
          hash: null,
        }),
      });

      if (res.status === 200) {
        await axios.post('/api/v1/items/process', undefined, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        toast.update(toastID, {
          title: 'Item created.',
          description: 'The item was successfully created.',
          status: 'success',
          duration: 5000,
        });
        setItem(defaultItem);
        setTags([]);
      }
    } catch (err) {
      console.error(err);
      toast.update(toastID, {
        title: 'Error creating item.',
        description: 'There was an error creating the item.',
        status: 'error',
        duration: 10000,
      });
    }
  };

  if (authLoading)
    return (
      <Layout SEO={{ nofollow: true, noindex: true }}>
        <Center h="80vh">
          <Spinner />
        </Center>
      </Layout>
    );

  if (!user || !user.isAdmin)
    return (
      <Layout SEO={{ nofollow: true, noindex: true }}>
        <Center h="80vh">
          <Heading size="md">You are not authorized to access this page.</Heading>
        </Center>
      </Layout>
    );

  return (
    <Layout SEO={{ title: 'Create New Item', nofollow: true, noindex: true }}>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/nt/ntimages/441_xweetok_agent.gif',
          alt: 'xweetok agent thumbnail',
        }}
        color="#7AB92A"
      >
        <Heading size="lg">Create New Item</Heading>
        <Text size={{ base: 'sm', md: undefined }}>
          Preffer to use the{' '}
          <Link href="/contribute" fontWeight="bold">
            Item Data Extractor
          </Link>{' '}
          instead this page.
          <br />
          It&apos;s not possible to create tags or categories here. You will have to do it after the
          item is created.
        </Text>
      </HeaderCard>
      <Tabs variant="line" colorScheme="gray" isLazy>
        <TabList>
          <Tab>Item Info</Tab>
          <Tab>Categories and Tags</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <InfoTab item={item} itemProps={defaultItem} onChange={handleChange} />
          </TabPanel>
          <TabPanel>
            <CategoriesTab
              categories={[]}
              tags={tags}
              item={item as ItemData}
              itemProps={defaultItem}
              onChange={handleTagsChange}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
      <Center>
        <Button colorScheme="green" onClick={createItem}>
          Create Item
        </Button>
      </Center>
    </Layout>
  );
};

export default CreateItem;

export async function getServerSideProps(context: NextPageContext) {
  try {
    const token = getCookie('userToken', { req: context.req, res: context.res }) as
      | string
      | undefined
      | null;

    if (!token) throw new Error('No token found');

    const res = await CheckAuth(context.req as NextApiRequest, token);

    if (!res || !res.user || !res.user?.isAdmin) throw new Error('User is not an admin');

    return {
      props: {},
    };
  } catch (e) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
}
