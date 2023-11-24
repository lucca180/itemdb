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
  HStack,
  UnorderedList,
} from '@chakra-ui/react';
import Image from 'next/image';
import { AiFillWarning } from 'react-icons/ai';
import HeaderCard from '../../components/Card/HeaderCard';
import Layout from '../../components/Layout';
import icon from '../../public/logo_icon.svg';
import { parseBody } from 'next/dist/server/api-utils/node/parse-body';
import ListSelect from '../../components/UserLists/ListSelect';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ItemData, UserList } from '../../types';
import ItemCard from '../../components/Items/ItemCard';
import { useAuth } from '../../utils/auth';
import { getList } from '../api/v1/lists/[username]/[list_id]';
import { CreateLinkedListButton } from '../../components/DynamicLists/CreateLinkedList';
import { useRouter } from 'next/router';
import DynamicIcon from '../../public/icons/dynamic.png';
import NextLink from 'next/link';
type Props = {
  items?: { [index: number | string]: number };
  indexType?: string;
  recomended_list?: UserList | null;
};

const ImportPage = (props: Props) => {
  const { items, indexType, recomended_list } = props;
  return (
    <Layout
      SEO={{
        title: 'Checklists and Importing Items',
        description: 'Import items and create your checklists easily with itemdb!',
        openGraph: {
          images: [
            {
              url: 'https://images.neopets.com/caption/sm_caption_831.gif',
              width: 150,
              height: 150,
            },
          ],
        },
      }}
    >
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/caption/sm_caption_831.gif',
          alt: 'Importing Items Thumbnail',
        }}
        color="#65855B"
      >
        <Heading size="lg">Checklists and Importing Items</Heading>
        <Text as="div" sx={{ a: { color: '#b8e9a9' } }}>
          Import items and create your checklists easily with itemdb!
        </Text>
      </HeaderCard>
      <Flex flexFlow="column" gap={3} sx={{ a: { color: '#b8e9a9' } }}>
        <Divider />
        {!items && <ImportInfo />}
        {items && !!indexType && (
          <ImportItems items={items} indexType={indexType} recomended_list={recomended_list} />
        )}
      </Flex>
    </Layout>
  );
};

export default ImportPage;

export async function getServerSideProps(context: any) {
  const body = await parseBody(context.req, '4mb');
  const items = JSON.parse(body?.itemDataJson ?? 'null');
  const indexType = body?.indexType ?? 'item_id';
  const list_id = body?.list_id ?? null;

  const list = list_id ? await getList('official', Number(list_id), null, true, true) : null;

  return {
    props: {
      items: items,
      indexType: indexType,
      recomended_list: list,
    }, // will be passed to the page component as props
  };
}

type ImportItemsProps = {
  items: { [item_id: number | string]: number };
  indexType: string;
  recomended_list?: UserList | null;
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
  action: 'add' as 'add' | 'remove' | 'hide',
};

const ImportItems = (props: ImportItemsProps) => {
  const { user, getIdToken } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { items, indexType, recomended_list } = props;
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
      [indexType]: Object.keys(items),
    });

    const data: { [identifier: string | number]: ItemData } = itemRes.data;
    const nullItems = Object.values(items).length - Object.values(data).length;
    setNotFound(nullItems);
    setItemData(data);
  };

  const handleImport = async () => {
    if (!itemData || !user || !importInfo.list) return;
    const canonicalAmount = {} as { [canonical_id: number]: number };
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

        if (item.canonical_id) {
          canonicalAmount[item.canonical_id] = (canonicalAmount[item.canonical_id] ?? 0) + 1;
        }

        return true;
      })
      .map((item: ItemData) => ({
        item_iid: item.canonical_id ?? item.internal_id,
        amount: importInfo.ignore.includes('quantity')
          ? 1
          : item.canonical_id
          ? canonicalAmount[item.canonical_id]
          : items[item.item_id ?? -1] ?? 1,
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
        importInfo.action === 'add' ? 'import' : importInfo.action === 'hide' ? 'hide' : 'remove'
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

      if (importInfo.action === 'remove' || importInfo.action === 'hide') {
        await axios.delete(`/api/v1/lists/${user.username}/${importInfo.list.internal_id}/`, {
          data: {
            item_iid: importData.map((item) => item.item_iid),
          },
          params: {
            hide: importInfo.action === 'hide',
          },
          headers: {
            Authorization: `Bearer ${await getIdToken()}`,
          },
        });
      }

      toast.update(toastInfo, {
        title: 'Success',
        description: `Your items have been ${
          importInfo.action === 'add'
            ? 'imported'
            : importInfo.action === 'hide'
            ? 'hidden'
            : 'removed'
        }!`,
        status: 'success',
        duration: 10000,
        isClosable: true,
      });

      router.push(`/lists/${user.username}/${importInfo.list.internal_id}`);
    } catch (e) {
      console.error(e);
      toast.update(toastInfo, {
        title: 'Error',
        description: `There was an error ${
          importInfo.action === 'add'
            ? 'importing'
            : importInfo.action === 'hide'
            ? 'hidding'
            : 'removing'
        } your items. Please try again later.`,
        status: 'error',
        duration: null,
        isClosable: true,
      });
    }
  };

  const handleListChange = (list: UserList) => {
    let action = importInfo.action;

    if (list.dynamicType === 'fullSync' && ['remove', 'add'].includes(importInfo.action)) {
      action = 'hide';
    }

    if (list.dynamicType && list.dynamicType !== 'addOnly' && importInfo.action == 'add') {
      action = 'hide';
    }

    setImportInfo({
      ...importInfo,
      action,
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
    const action = e.target.value as 'add' | 'remove' | 'hide';
    setImportInfo({
      ...importInfo,
      action,
    });
  };

  const handleLinkedList = (list: UserList) => {
    setImportInfo({
      ...importInfo,
      action: 'hide',
      list,
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
              Object.entries(itemData)
                .slice(0, 25)
                .map((item) => (
                  <ItemCard
                    disablePrefetch={true}
                    key={item[0]}
                    item={item[1]}
                    quantity={items[item[0]]}
                  />
                ))}
            {!itemData && [...Array(20)].map((_, i) => <ItemCard key={i} />)}
          </Flex>
          {itemData && Object.entries(itemData).length > 25 && (
            <Text textAlign="center">...and {Object.entries(itemData).length - 25} more</Text>
          )}
        </Flex>
        <Flex flex="1" flexFlow="column" gap={3} alignItems={{ base: 'center', md: 'flex-start' }}>
          <FormControl>
            <FormLabel color="gray.300">Target List</FormLabel>
            <ListSelect defaultValue={importInfo.list} onChange={handleListChange} createNew />
          </FormControl>
          <FormControl>
            <FormLabel color="gray.300">Action</FormLabel>
            <Select
              value={importInfo.action}
              variant="filled"
              maxW="220px"
              onChange={handleActionChange}
            >
              <option
                value="add"
                disabled={
                  !!importInfo.list?.dynamicType && importInfo.list?.dynamicType !== 'addOnly'
                }
              >
                Add these items
              </option>
              <option
                value="remove"
                disabled={
                  !!importInfo.list?.dynamicType && importInfo.list?.dynamicType === 'fullSync'
                }
              >
                Remove these items
              </option>
              <option value="hide">Mark as hidden</option>
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
          <HStack mt={3}>
            <Button onClick={handleImport} isDisabled={!importInfo.list}>
              Submit
            </Button>
            {recomended_list && (
              <CreateLinkedListButton list={recomended_list} isImport onCreate={handleLinkedList} />
            )}
          </HStack>
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
          Open one of the supported pages:{' '}
          <UnorderedList>
            <ListItem>
              <Link href="https://www.neopets.com/closet.phtml" isExternal>
                Closet
              </Link>
            </ListItem>
            <ListItem>
              <Link href="https://www.neopets.com/gallery/quickremove.phtml" isExternal>
                Gallery Quick Remove
              </Link>
            </ListItem>
            <ListItem>
              <Link href="https://www.neopets.com/safetydeposit.phtml" isExternal>
                Safety Deposit Box
              </Link>
            </ListItem>
            <ListItem>
              <Link href="https://www.neopets.com/gourmet_club.phtml" isExternal>
                <Image
                  src={DynamicIcon}
                  alt="lightning bolt"
                  width={8}
                  style={{ display: 'inline' }}
                />{' '}
                Gourmet Club - Checklist
              </Link>
            </ListItem>
            <ListItem>
              <Link href="https://www.neopets.com/games/neodeck/index.phtml" isExternal>
                <Image
                  src={DynamicIcon}
                  alt="lightning bolt"
                  width={8}
                  style={{ display: 'inline' }}
                />{' '}
                NeoDeck - Checklist
              </Link>
            </ListItem>
            <ListItem>
              <Link
                href="https://www.neopets.com/stamps.phtml?type=album&page_id=1&owner="
                isExternal
              >
                <Image
                  src={DynamicIcon}
                  alt="lightning bolt"
                  width={8}
                  style={{ display: 'inline' }}
                />{' '}
                Stamp Album - Checklist
              </Link>
            </ListItem>
          </UnorderedList>
        </ListItem>
        <ListItem>
          Click the <ImportButton /> button
        </ListItem>
        <ListItem>
          A new tab will open with a list of items that can be imported. Then you choose your target
          list and if you want to import, remove or hide the items from that list
          <Text fontSize="sm">
            <Image src={DynamicIcon} alt="lightning bolt" width={8} style={{ display: 'inline' }} />{' '}
            You can also make a{' '}
            <Link as={NextLink} href={'/articles/checklists-and-dynamic-lists'}>
              Dynamic Checklist
            </Link>{' '}
            based on one of our{' '}
            <Link as={NextLink} href={'/lists/official'}>
              Official Lists
            </Link>
            !
          </Text>
        </ListItem>
      </OrderedList>
      <Heading size="md" mt={3}>
        Is it safe?
      </Heading>
      <Text>
        The script will only send the data of the items you want to import. No data from your
        neopets account <i>(or the page source code)</i> is sent to our servers.
        <br />
        Don&apos;t trust us? itemdb is <b>open source</b> and you can always take a{' '}
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
      <Text fontSize="sm">Import to itemdb</Text>
    </Box>
  );
};
