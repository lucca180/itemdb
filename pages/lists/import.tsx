import {
  Divider,
  Flex,
  Heading,
  Link,
  ListItem,
  OrderedList,
  Text,
  Icon,
  Box,
  FormControl,
  FormLabel,
  Select,
  Checkbox,
  CheckboxGroup,
  VStack,
  Button,
  useToast,
  useMediaQuery,
} from '@chakra-ui/react';
import Image from 'next/image';
import { AiFillWarning } from 'react-icons/ai';
import HeaderCard from '../../components/Card/HeaderCard';
import Layout from '../../components/Layout';
import icon from '../../public/logo_icon.svg';
import { parseBody } from 'next/dist/server/api-utils/node';
import ListSelect from '../../components/UserLists/ListSelect';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ItemData, UserList } from '../../types';
import ItemCard from '../../components/Items/ItemCard';
import { useAuth } from '../../utils/auth';

type Props = {
  items?: { [item_id: number]: number };
};

const ImportPage = (props: Props) => {
  const { items } = props;
  console.log(items);
  return (
    <Layout>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/caption/sm_caption_831.gif',
          alt: 'Importing Items Thumbnail',
        }}
        color="#65855B"
      >
        <Heading size="lg">Importing Items</Heading>
        <Text as="div" sx={{ a: { color: '#b8e9a9' } }}>
          Import items from your{' '}
          <Link href="https://www.neopets.com/closet.phtml" isExternal>
            closet
          </Link>
          ,{' '}
          <Link href="https://www.neopets.com/gallery/quickremove.phtml" isExternal>
            gallery
          </Link>
          , or even your{' '}
          <Link href="https://www.neopets.com/safetydeposit.phtml" isExternal>
            safety deposit box
          </Link>{' '}
          directly into your itemdb list easily!
        </Text>
      </HeaderCard>
      <Flex flexFlow="column" gap={3} sx={{ a: { color: '#b8e9a9' } }}>
        <Divider />
        {!items && <ImportInfo />}
        {items && <ImportItems items={items} />}
      </Flex>
    </Layout>
  );
};

export default ImportPage;

export async function getServerSideProps(context: any) {
  const body = await parseBody(context.req, '1mb');
  const items = JSON.parse(body?.itemDataJson ?? 'null');
  console.log(items);

  return {
    props: {
      items: items,
    }, // will be passed to the page component as props
  };
}

type ImportItemsProps = {
  items: { [item_id: number | string]: number };
};

const DefaultImportInfo = {
  list: undefined as UserList | undefined,
  items: [] as {
    item_iid: number;
    capValue?: number;
    amount?: number;
    imported: boolean;
  }[],
  ignore: [] as ('np' | 'nc' | 'quantity')[],
  action: 'add' as 'add' | 'remove',
};

const ImportItems = (props: ImportItemsProps) => {
  const { user, getIdToken } = useAuth();
  const toast = useToast();
  const { items } = props;
  const [itemData, setItemData] = useState<{ [identifier: string | number]: ItemData } | null>(
    null
  );
  const [notFound, setNotFound] = useState<number>(0);
  const [importInfo, setImportInfo] = useState(DefaultImportInfo);

  useEffect(() => {
    return () => toast.closeAll();
  });

  useEffect(() => {
    init();
  }, [items]);

  const init = async () => {
    const itemRes = await axios.post(`/api/v1/items/many`, {
      item_id: Object.keys(items),
    });

    const data: { [identifier: string | number]: ItemData } = itemRes.data;
    const nullItems = Object.values(items).length - Object.values(data).length;
    setNotFound(nullItems);
    setItemData(data);

    console.log(data);
  };

  const handleImport = async () => {
    if (!itemData || !user || !importInfo.list) return;

    const importData: {
      item_iid: number;
      capValue?: number;
      amount?: number;
      imported: boolean;
    }[] = Object.values(itemData)
      .filter((item: ItemData) => {
        if (item == null) return false;
        if (importInfo.ignore.includes('np') && item.type === 'np') return false;
        if (importInfo.ignore.includes('nc') && item.type === 'nc') return false;
        return true;
      })
      .map((item: ItemData) => ({
        item_iid: item.internal_id,
        amount: importInfo.ignore.includes('quantity') ? 1 : items[item.item_id ?? -1] ?? 1,
        imported: true,
      }));

    if (!importData.length) {
      toast({
        title: 'Error',
        description: `There were no items to import. Please check your "ignore" fields.`,
        status: 'error',
        duration: 10000,
      });

      return;
    }

    const toastInfo = toast({
      title: `${importInfo.action === 'add' ? 'Importing' : 'Removing'} Items`,
      description: `Please wait while we ${
        importInfo.action === 'add' ? 'import' : 'remove'
      } your items.`,
      status: 'info',
      duration: null,
    });

    try {
      if (importInfo.action === 'add') {
        await axios.put(
          `/api/v1/lists/${user.username}/${importInfo.list.internal_id}/`,
          {
            items: importData,
          },
          {
            headers: {
              Authorization: `Bearer ${await getIdToken()}`,
            },
          }
        );
      }

      if (importInfo.action === 'remove') {
        await axios.delete(`/api/v1/lists/${user.username}/${importInfo.list.internal_id}/`, {
          data: {
            item_iid: importData.map((item) => item.item_iid),
          },
          headers: {
            Authorization: `Bearer ${await getIdToken()}`,
          },
        });
      }

      toast.update(toastInfo, {
        title: 'Success',
        description: `Your items have been ${
          importInfo.action === 'add' ? 'imported' : 'removed'
        }!`,
        status: 'success',
        duration: 10000,
        isClosable: true,
      });
    } catch (e) {
      console.log(e);
      toast.update(toastInfo, {
        title: 'Error',
        description: `There was an error ${
          importInfo.action === 'add' ? 'importing' : 'removing'
        } your items. Please try again later.`,
        status: 'error',
        duration: null,
        isClosable: true,
      });
    }
  };

  const handleListChange = (list: UserList) => {
    setImportInfo({
      ...importInfo,
      list,
    });
  };

  const handleIgnoreChange = (ignore: ('np' | 'nc' | 'quantity')[]) => {
    setImportInfo({
      ...importInfo,
      ignore,
    });
  };

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const action = e.target.value as 'add' | 'remove';
    setImportInfo({
      ...importInfo,
      action,
    });
  };

  return (
    <>
      <Heading size="lg">Importing {Object.values(itemData ?? items).length} Items</Heading>
      {notFound > 0 && (
        <Text fontSize="sm" color="red.400">
          Could not find <b>{notFound} items</b> in the database. Please visit the How To Contribute
          to add these items to our database.
        </Text>
      )}
      <Flex flexFlow={{ base: 'column-reverse', md: 'row' }} gap={6}>
        <Flex flex="2" sx={{ a: { color: 'initial' } }} flexFlow="column">
          <Flex flexWrap="wrap" gap={3} justifyContent="center">
            {itemData &&
              Object.entries(itemData).map((item) => (
                <ItemCard key={item[0]} item={item[1]} quantity={items[item[0]]} />
              ))}
            {!itemData && [...Array(20)].map((_, i) => <ItemCard key={i} />)}
          </Flex>
        </Flex>
        <Flex flex="1" flexFlow="column" gap={3} alignItems={{ base: 'center', md: 'flex-start' }}>
          <FormControl>
            <FormLabel color="gray.300">Target List</FormLabel>
            <ListSelect onChange={handleListChange} createNew />
          </FormControl>
          <FormControl>
            <FormLabel color="gray.300">Action</FormLabel>
            <Select
              value={importInfo.action}
              variant="filled"
              maxW="220px"
              onChange={handleActionChange}
            >
              <option value="add">Add these items</option>
              <option value="remove">Remove these items</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel color="gray.300">Ignore</FormLabel>
            <CheckboxGroup
              colorScheme="green"
              value={importInfo.ignore}
              onChange={handleIgnoreChange}
            >
              <VStack justifyContent="flex-start" alignItems="flex-start">
                <Checkbox value="np">NP Items</Checkbox>
                <Checkbox value="nc">NC Items</Checkbox>
                <Checkbox value="quantity">Quantities</Checkbox>
              </VStack>
            </CheckboxGroup>
          </FormControl>
          <Button mt={3} onClick={handleImport} isDisabled={!importInfo.list}>
            Submit
          </Button>
        </Flex>
      </Flex>
    </>
  );
};

const ImportInfo = () => {
  const [isLargerThanMD] = useMediaQuery('(min-width: 48em)', { fallback: true });

  return (
    <>
      <Heading size="lg">Step by Step</Heading>
      {!isLargerThanMD && (
        <Text fontSize="sm" color="red.400">
          This guide may not work on mobile devices!
        </Text>
      )}
      <OrderedList spacing={2}>
        <ListItem>
          Install{' '}
          <Link href="https://www.tampermonkey.net/" isExternal>
            Tampermonkey
          </Link>{' '}
          extension for your browser if you don&apos;t have it already.
        </ListItem>
        <ListItem>
          Install the{' '}
          <Link href="https://github.com/lucca180/itemdb/raw/main/userscripts/listImporter.user.js">
            itemdb List Importer
          </Link>{' '}
          script{' '}
          <i>
            (not to be confused with the{' '}
            <Link
              href="https://github.com/lucca180/itemdb/raw/main/userscripts/itemDataExtractor.user.js"
              isExternal
            >
              ItemData Extractor
            </Link>{' '}
            script!)
          </i>
          <Text fontSize="sm">
            <Icon as={AiFillWarning} color="yellow.400" verticalAlign="middle" /> If you encounter
            compatibility issues with other scripts, take a look at this{' '}
            <Link isExternal href="https://www.tampermonkey.net/faq.php?locale=en#Q208">
              troubleshooting guide
            </Link>
            .
          </Text>
        </ListItem>
        <ListItem>
          Open your{' '}
          <Link href="https://www.neopets.com/closet.phtml" isExternal>
            closet
          </Link>
          ,{' '}
          <Link href="https://www.neopets.com/safetydeposit.phtml" isExternal>
            sdb
          </Link>
          , or your{' '}
          <Link href="https://www.neopets.com/gallery/quickremove.phtml" isExternal>
            gallery quick remove
          </Link>{' '}
          page and click the <ImportButton /> button
        </ListItem>
        <ListItem>
          A new tab will open with a list of items that can be imported. Then you choose your target
          list and if you want to import or remove the items from that list
        </ListItem>
      </OrderedList>
      <Heading size="lg" mt={3}>
        Is it safe?
      </Heading>
      <Text>
        The script will only send the data of the items you want to import. No data from your
        neopets account <i>(or the page source code)</i> is sent to our servers.
        <br />
        Don&apos;t trust us? itemdb is{' '}
        <Box as="span" bg="gray.600" p={1} borderRadius="md">
          open source
        </Box>{' '}
        and you can always take a{' '}
        <Link href="https://github.com/lucca180/itemdb/" isExternal>
          look at our code
        </Link>
        !
      </Text>
    </>
  );
};

const ImportButton = () => {
  return (
    <Box
      display="inline-flex"
      alignItems="center"
      bg="#2D3748"
      borderRadius="3px"
      gap="5px"
      p="5px"
      justifyContent="center"
      cursor="pointer"
      verticalAlign="middle"
    >
      <Image src={icon} alt="itemdb logo" width={25} quality="100" />
      <Text fontSize="sm">Import to itemdb list</Text>
    </Box>
  );
};
