/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  Badge,
  Box,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
  Button,
  Center,
  Divider,
  HStack,
  Select,
  FormControl,
  FormLabel,
  Switch,
  useToast,
  Icon,
  Image,
  useMediaQuery,
  Tooltip,
} from '@chakra-ui/react';
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../../../components/Layout';
import { ItemData, ListItemInfo, UserList } from '../../../types';
import { useAuth } from '../../../utils/auth';
import { useRouter } from 'next/router';
import icon from '../../../public/logo_icon.svg';
import NextImage from 'next/image';
import ItemCard from '../../../components/Items/ItemCard';
import Color from 'color';
import NextLink from 'next/link';
import { SortableArea } from '../../../components/Sortable/SortableArea';
import { SelectItemsCheckbox } from '../../../components/Input/SelectItemsCheckbox';
import { ItemActionModalProps } from '../../../components/Modal/ItemActionModal';
import { BiLinkExternal } from 'react-icons/bi';
import { NextPageContext } from 'next';
import { getList } from '../../api/v1/lists/[username]/[list_id]';
import { getCookie } from 'cookies-next';
import GiftBox from '../../../public/icons/giftbox.png';
import NPBag from '../../../public/icons/npbag.png';
import { MdWarning } from 'react-icons/md';

import { CreateListModalProps } from '../../../components/Modal/CreateListModal';

import dynamic from 'next/dynamic';

const CreateListModal = dynamic<CreateListModalProps>(
  () => import('../../../components/Modal/CreateListModal')
);

const ItemActionModal = dynamic<ItemActionModalProps>(
  () => import('../../../components/Modal/ItemActionModal')
);

type ExtendedListItemInfo = ListItemInfo & { hasChanged?: boolean };

type Props = {
  list: UserList;
};

const intl = new Intl.NumberFormat();

const ListPage = (props: Props) => {
  const router = useRouter();
  const toast = useToast();

  const { user, getIdToken, authLoading } = useAuth();
  const [list, setList] = useState<UserList>(props.list);
  const [openCreateModal, setOpenCreateModal] = useState<boolean>(false);

  const [itemInfoIds, setItemInfoIds] = useState<number[]>([]);
  const [itemInfo, setItemInfo] = useState<{
    [itemInfoId: number]: ExtendedListItemInfo;
  }>({});
  const [sortInfo, setSortInfo] = useState<{
    sortBy: string;
    sortDir: string;
  }>({ sortBy: 'name', sortDir: 'asc' });
  const [items, setItems] = useState<{ [item_iid: string]: ItemData }>({});
  const [itemSelect, setItemSelect] = useState<number[]>([]);

  const [isEdit, setEdit] = useState<boolean>(false);
  const [lockSort, setLockSort] = useState<boolean>(true);
  const [selectionAction, setSelectionAction] = useState<string>('');

  const [matches, setMatches] = useState<ListItemInfo[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);

  const [isLargerThanSM] = useMediaQuery('(min-width: 30em)');

  const isOwner = user?.username === router.query.username || user?.id === list?.user_id;
  const color = Color(list?.colorHex || '#4A5568');
  const rgb = color.rgb().array();

  const unpricedItems = useMemo(() => {
    if (!list) return 0;

    return Object.values(items).reduce((acc, item) => {
      if (!item) return acc;

      if (!item.isNC && !item.price.value && item.status === 'active') return acc + 1;

      return acc;
    }, 0);
  }, [items]);

  const NPPrice = useMemo(() => {
    if (!list) return 0;

    return list.itemInfo.reduce((acc, item) => {
      const itemData = items[item.item_iid];
      if (!itemData || !itemData.price.value) return acc;

      return acc + itemData.price.value * item.amount;
    }, 0);
  }, [items, itemInfo]);

  const NCPrice = useMemo(() => {
    if (!list) return 0;

    return list.itemInfo.reduce((acc, item) => {
      const itemData = items[item.item_iid];
      if (!itemData || !itemData.owls || !itemData.owls.valueMin) return acc;

      return acc + itemData.owls.valueMin * item.amount;
    }, 0);
  }, [items, itemInfo]);

  useEffect(() => {
    if (!authLoading && router.isReady) {
      init();
    }
  }, [authLoading, router.isReady]);

  useEffect(() => {
    // if (list) setList(undefined);

    return () => toast.closeAll();
  }, [router.query]);

  useEffect(() => {
    if (user && list) getMatches();
  }, [user, list]);

  const init = async (force = false) => {
    setLoading(true);
    toast.closeAll();
    try {
      let res;
      if (force) {
        const { username, list_id } = router.query;
        const token = await getIdToken();

        res = await axios.get(`/api/v1/lists/${username}/${list_id}`, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
      }

      const listData: UserList = res?.data ?? list;

      if (!listData) throw 'List does not exist';

      if (listData.official) router.replace('/lists/official/' + listData.internal_id);

      const itensId: number[] = listData.itemInfo.map((item) => item.item_iid);

      if (itensId.length === 0) {
        setItemSelect([]);
        setItemInfoIds([]);
        setItemInfo({});
        setMatches([]);
        setSortInfo({ sortBy: listData.sortBy, sortDir: listData.sortDir });
        if (force && res) setList(res.data);
        setItems({});
        setLoading(false);
        return;
      }

      const itemRes = await axios.post(`/api/v1/items/many`, {
        id: itensId,
      });

      const itemInfos = listData.itemInfo;
      const itemData: { [id: string]: ItemData } = itemRes?.data;

      const sortedItemInfo = itemInfos.sort((a, b) =>
        sortItems(a, b, listData.sortBy, listData.sortDir, itemData)
      );
      const infoIds = [];
      const itemMap: { [id: number]: ListItemInfo } = {};

      for (const itemInfo of sortedItemInfo) {
        infoIds.push(itemInfo.internal_id);
        itemMap[itemInfo.internal_id] = itemInfo;
      }

      setItemSelect([]);
      setSortInfo({ sortBy: listData.sortBy, sortDir: listData.sortDir });
      setItemInfoIds(infoIds);
      setItemInfo(itemMap);

      if (force && res) setList(res.data);
      setItems(itemData);

      setLoading(false);
    } catch (err) {
      console.error(err);

      toast({
        title: 'An error occurred',
        description: typeof err === 'string' ? err : 'Please try again later',
        status: 'error',
        duration: null,
      });
    }
  };

  const getMatches = async () => {
    if (!list || !user || list.purpose === 'none') return;

    let seeker = list.purpose === 'seeking' ? list.user_username : user.username;
    let offerer = list.purpose === 'trading' ? list.user_username : user.username;

    if (list.official) {
      seeker = user.username;
      offerer = list.user_username;
    }

    const token = await getIdToken();

    const res = await axios.get(`/api/v1/lists/match/${seeker}/${offerer}`, {
      params: {
        list_id: list.internal_id,
      },
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    setMatches(res.data);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!list) return;
    const name = e.target.name;

    if (name === 'sortBy') {
      const sortBy = e.target.value;
      const sortedItemInfo = list.itemInfo.sort((a, b) =>
        sortItems(a, b, sortBy, sortInfo.sortDir, items)
      );
      setSortInfo({ sortBy, sortDir: sortInfo.sortDir });
      if (sortBy === 'custom') setSortInfo({ sortBy, sortDir: 'asc' });

      setItemInfoIds(sortedItemInfo.map((item) => item.internal_id));

      setLockSort(true);
    }

    if (name === 'sortDir') {
      const sortDir = e.target.value;
      const sortedItemInfo = list.itemInfo.sort((a, b) =>
        sortItems(a, b, sortInfo.sortBy, sortDir, items)
      );
      setSortInfo({ sortBy: sortInfo.sortBy, sortDir: sortDir });
      setItemInfoIds(sortedItemInfo.map((item) => item.internal_id));
    }
  };

  const toggleEdit = () => {
    if (isEdit) {
      setItemSelect([]);
    }

    setLockSort(true);
    setEdit(!isEdit);
  };

  const selectItem = useCallback(
    (infoId: number, force = false) => {
      if (!isEdit && !force) return;

      if (force) setEdit(true);

      if (itemSelect.includes(infoId)) {
        setItemSelect(itemSelect.filter((item) => item !== infoId));
      } else {
        setItemSelect([...itemSelect, infoId]);
      }
    },
    [isEdit, itemSelect]
  );

  const handleSelectCheckbox = useCallback(
    (checkAll: boolean) => {
      if (checkAll) setItemSelect(itemInfoIds);
      else setItemSelect([]);
    },
    [itemInfoIds]
  );

  const handleSort = useCallback(
    (newOrder: number[]) => {
      const newInfo = { ...itemInfo };

      const highlights = itemInfoIds.filter((a) => itemInfo[a].isHighlight);

      for (let i = 0; i < newOrder.length; i++) {
        if (newInfo[newOrder[i]].order === i) continue;

        newInfo[newOrder[i]].order = i;
        newInfo[newOrder[i]].hasChanged = true;
        setHasChanges();
      }

      setItemInfoIds([...newOrder, ...highlights]);
      setItemInfo(newInfo);
    },
    [itemInfo, itemInfoIds]
  );

  const setHasChanges = () => {
    if (toast.isActive('unsavedChanges')) return;

    toast({
      title: 'You have unsaved changes',
      id: 'unsavedChanges',
      description: (
        <Flex gap={2}>
          <Button variant="solid" onClick={saveChanges} colorScheme="blackAlpha" size="sm">
            Save Changes
          </Button>
          <Button variant="solid" onClick={() => init(true)} colorScheme="blackAlpha" size="sm">
            Cancel
          </Button>
        </Flex>
      ),
      status: 'info',
      duration: null,
      // isClosable: true,
    });
  };

  const saveChanges = async () => {
    if (!list) return;

    toast.closeAll();

    const x = toast({
      title: 'Saving changes...',
      status: 'info',
      duration: null,
    });

    const { username, list_id } = router.query;
    const token = await getIdToken();

    const changedItems = Object.values(itemInfo).filter((item) => item.hasChanged);

    try {
      const res = await axios.post(
        `/api/v1/lists/${username}/${list_id}`,
        {
          list_id: list.internal_id,
          itemInfo: changedItems,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        toast.update(x, {
          title: 'Changes saved',
          status: 'success',
          duration: 5000,
        });

        setEdit(false);
        init(true);
      } else throw res.data.error;
    } catch (err) {
      console.error(err);
      toast.update(x, {
        title: 'An error occurred',
        description: 'Please try again later',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleItemInfoChange = useCallback(
    (id: number, value: number, field: 'amount' | 'capValue' | 'isHighlight') => {
      const newInfo = { ...itemInfo };

      if (field === 'isHighlight') newInfo[id][field] = !!value;
      else newInfo[id][field] = value;

      newInfo[id].hasChanged = true;

      setItemInfo(newInfo);
      setHasChanges();
    },
    [itemInfo]
  );

  const cntxAction = useCallback(
    (item: ItemData, action: 'move' | 'delete') => {
      const infoId = itemInfoIds.find((id) => itemInfo[id].item_iid === item.internal_id);
      if (!infoId) return;
      setItemSelect([infoId]);
      setSelectionAction(action);
    },
    [itemInfoIds]
  );

  if (isLoading)
    return (
      <Layout
        SEO={{
          title: `${list.name} - ${list.official ? 'Official' : list.owner.username + "'s"} List`,
          nofollow: !list.official,
          noindex: !list.official,
          themeColor: list.colorHex ?? '#4A5568',
          description: list.description || undefined,
          openGraph: {
            images: [
              {
                url: list.coverURL ?? 'https://itemdb.com.br/logo_icon.png',
                width: 150,
                height: 150,
              },
            ],
          },
        }}
        loading
      />
    );

  return (
    <Layout
      SEO={{
        title: `${list.name} - ${list.official ? 'Official' : list.owner.username + "'s"} List`,
        nofollow: !list.official,
        noindex: !list.official,
        themeColor: list.colorHex ?? '#4A5568',
        description: list.description || undefined,
        openGraph: {
          images: [
            {
              url: list.coverURL ?? 'https://itemdb.com.br/logo_icon.png',
              width: 150,
              height: 150,
            },
          ],
        },
      }}
    >
      <CreateListModal
        refresh={() => init(true)}
        isOpen={openCreateModal}
        list={list}
        onClose={() => setOpenCreateModal(false)}
      />
      <ItemActionModal
        refresh={() => init(true)}
        isOpen={!!selectionAction}
        onClose={() => setSelectionAction('')}
        selectedItems={itemSelect.map((id) => itemInfo[id])}
        action={selectionAction}
        list={list}
      />
      <Box>
        <Box
          position="absolute"
          h="30vh"
          left="0"
          width="100%"
          bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.6) 80%)`}
          zIndex={-1}
        />
        <Flex gap={{ base: 3, md: 6 }} pt={6} alignItems="center">
          <Flex
            position="relative"
            p={{ base: 1, md: 2 }}
            bg={`rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.75)`}
            borderRadius="md"
            flexFlow="column"
            justifyContent="center"
            alignItems="center"
            boxShadow="sm"
            textAlign="center"
            minW={{ base: '100px', md: '150px' }}
            minH={{ base: '100px', md: '150px' }}
            flex="0 0 auto"
          >
            {!list.coverURL && (
              <Image
                as={NextImage}
                src={icon}
                width={{ base: '50px', md: '80px' }}
                style={{ opacity: 0.85, flex: 1 }}
                alt={'List Cover'}
              />
            )}
            {list.coverURL && (
              <Image
                src={list.coverURL}
                objectFit="cover"
                width={{ base: '100px', md: '150px' }}
                height={{ base: '100px', md: '150px' }}
                borderRadius="md"
                alt={'List Cover'}
              />
            )}
            {(isOwner || user?.isAdmin) && (
              <Button
                variant="solid"
                mt={3}
                colorScheme={color.isLight() ? 'blackAlpha' : 'gray'}
                onClick={() => setOpenCreateModal(true)}
                size="sm"
              >
                Edit list info
              </Button>
            )}
          </Flex>
          <Box>
            <Stack direction="row" mb={1} alignItems="center">
              {!list.official && list.purpose !== 'none' && (
                <Badge borderRadius="md" colorScheme={color.isLight() ? 'black' : 'gray'}>
                  {list.purpose}
                </Badge>
              )}
              {list.official && (
                <Badge
                  as={NextLink}
                  href="/lists/official"
                  borderRadius="md"
                  colorScheme="blue"
                  variant="solid"
                >
                  ✓ Official
                </Badge>
              )}
              {list.visibility !== 'public' && (
                <Badge
                  borderRadius="md"
                  colorScheme={color.isLight() ? 'black' : 'gray'}
                  variant="solid"
                >
                  {list.visibility}
                </Badge>
              )}
            </Stack>
            <Heading size={{ base: 'lg', md: undefined }}>{list.name}</Heading>
            <Stack direction="row" mb={1} alignItems="center" flexWrap="wrap">
              <Text fontSize={{ base: 'xs', md: 'sm' }}>
                {list.official ? 'curated' : ''} by{' '}
                <Link as={NextLink} fontWeight="bold" href={'/lists/' + list.owner.username}>
                  {list.owner.username}
                </Link>
              </Text>
              {!list.official && list.owner.neopetsUser && isLargerThanSM && (
                <>
                  <Link
                    isExternal
                    href={`http://www.neopets.com/userlookup.phtml?user=${list.user_neouser}`}
                  >
                    <Badge borderRadius="md" colorScheme={color.isLight() ? 'black' : 'gray'}>
                      Userlookup <Icon as={BiLinkExternal} verticalAlign="text-top" />
                    </Badge>
                  </Link>
                  <Link
                    isExternal
                    href={`http://www.neopets.com/neomessages.phtml?type=send&recipient=${list.user_neouser}`}
                  >
                    <Badge borderRadius="md" colorScheme={color.isLight() ? 'black' : 'gray'}>
                      Neomail <Icon as={BiLinkExternal} verticalAlign="text-top" />
                    </Badge>
                  </Link>
                </>
              )}
            </Stack>
            {list.description && (
              <Text mt={{ base: 2, md: 3 }} fontSize={{ base: 'sm', md: 'md' }}>
                {list.description}
              </Text>
            )}
            {(!!NPPrice || !!NCPrice) && (
              <Flex
                display={'inline-flex'}
                mt={{ base: 2, md: 3 }}
                py={1}
                px={2}
                bg="blackAlpha.300"
                borderRadius={'md'}
                alignItems="flex-start"
              >
                <Tooltip
                  hasArrow
                  label={`There are ${unpricedItems} items without a price`}
                  placement="top"
                  isDisabled={!unpricedItems}
                >
                  <Text fontSize="sm">
                    {!!unpricedItems && (
                      <span>
                        <Icon as={MdWarning} boxSize={'1rem'} mr="0.2rem" verticalAlign="middle" />
                      </span>
                    )}
                    This list costs aprox.{' '}
                    {!!NPPrice && (
                      <>
                        <b>{intl.format(NPPrice)} NP</b>
                        <Image
                          as={NextImage}
                          display="inline"
                          verticalAlign="bottom"
                          //@ts-ignore
                          src={NPBag}
                          width="24px"
                          height="24px"
                          alt="gift box icon"
                        />
                      </>
                    )}{' '}
                    {!!NPPrice && !!NCPrice && 'and'}{' '}
                    {!!NCPrice && (
                      <>
                        <b>{intl.format(NCPrice)} Caps</b>{' '}
                        <Image
                          as={NextImage}
                          display="inline"
                          verticalAlign="bottom"
                          //@ts-ignore
                          src={GiftBox}
                          width="24px"
                          height="24px"
                          alt="gift box icon"
                        />
                      </>
                    )}
                  </Text>
                </Tooltip>
              </Flex>
            )}
          </Box>
        </Flex>
      </Box>
      <Flex mt={5} gap={6} flexFlow="column">
        {!isOwner && user && list.purpose !== 'none' && (
          <>
            <Box>
              <Heading size={{ base: 'md', md: 'lg' }}>
                You + {list.name}{' '}
                <Badge fontSize={{ base: 'md', md: 'lg' }} verticalAlign="middle">
                  {matches.length}
                </Badge>
              </Heading>
              <Text color="gray.400" fontSize={{ base: 'sm', md: 'md' }}>
                aka. items you {!list.official && list.purpose === 'trading' ? 'seek' : 'have'} that
                are on this list
              </Text>
            </Box>
            <Flex gap={3} flexWrap="wrap" w="100%" justifyContent="center">
              {matches
                .sort((a, b) => sortItems(a, b, 'name', 'asc', items))
                .map((itemMatch) => (
                  <ItemCard
                    item={items[itemMatch.item_iid]}
                    key={itemMatch.item_iid}
                    capValue={itemMatch.capValue}
                    quantity={itemMatch.amount}
                  />
                ))}
            </Flex>

            <Divider />
          </>
        )}
        <Flex
          justifyContent={'space-between'}
          alignItems="center"
          gap={3}
          flexFlow={{ base: 'column-reverse', md: 'row' }}
        >
          {!isEdit && (
            <HStack>
              {isOwner && (
                <Button variant="solid" onClick={() => router.push('/lists/import')}>
                  Import Items
                </Button>
              )}

              <Text as="div" textColor={'gray.300'} fontSize="sm">
                {list.itemCount} items
              </Text>
            </HStack>
          )}
          {isEdit && (
            <Flex gap={3} flexWrap="wrap" justifyContent={'center'}>
              <Box bg={`rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.35)`} p={2} borderRadius="md">
                <SelectItemsCheckbox
                  checked={itemSelect}
                  allChecked={itemSelect.length === list.itemInfo.length}
                  onClick={handleSelectCheckbox}
                />
              </Box>
              <Box>
                <Button
                  isDisabled={!!!itemSelect.length}
                  colorScheme="red"
                  variant="outline"
                  onClick={() => setSelectionAction('delete')}
                >
                  Delete Items
                </Button>
              </Box>
              <Box>
                <Button
                  isDisabled={!!!itemSelect.length}
                  variant="outline"
                  onClick={() => setSelectionAction('move')}
                >
                  Move Items
                </Button>
              </Box>
              {/* <Box>
                <Select
                  variant="filled"
                  disabled={!!!itemSelect.length}
                  value={selectionAction}
                  onChange={(event) => setSelectionAction(event.target.value)}
                >
                  <option value="">Select an action</option>
                  <option value="delete">Delete</option>
                  <option value="move">Move to List</option>
                </Select>
              </Box> */}
            </Flex>
          )}

          <HStack flex="0 0 auto" minW={{ base: 'none', md: 400 }}>
            {isOwner && (
              <FormControl display="flex" alignItems="center" justifyContent="center">
                <FormLabel mb="0" textColor={'gray.300'} fontSize="sm">
                  Edit Mode
                </FormLabel>
                <Switch colorScheme="whiteAlpha" isChecked={isEdit} onChange={toggleEdit} />
              </FormControl>
            )}
            <Text
              flex="0 0 auto"
              textColor={'gray.300'}
              fontSize="sm"
              display={{ base: 'none', md: 'inherit' }}
            >
              Sort By
            </Text>
            <Select
              minW={{ base: 'none', sm: '150px' }}
              name="sortBy"
              variant="filled"
              value={sortInfo.sortBy}
              onChange={handleSortChange}
              size={{ base: 'sm', md: 'md' }}
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="color">Color</option>
              <option value="custom">Custom</option>
              <option value="addedAt">Added At</option>
            </Select>
            <Select
              minW={{ base: 'none', sm: '150px' }}
              name="sortDir"
              variant="filled"
              value={sortInfo.sortDir}
              onChange={handleSortChange}
              size={{ base: 'sm', md: 'md' }}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </Select>
          </HStack>
        </Flex>
        {!isEdit && isOwner && isLargerThanSM && (
          <Text textAlign={'center'} fontSize="xs" color="gray.500">
            Tip: you can use right click or ctrl+click to select multiple items
          </Text>
        )}
        {isEdit && sortInfo.sortBy === 'custom' && (
          <Center>
            <FormControl display="flex" alignItems="center" justifyContent="center">
              <FormLabel mb="0" textColor={'gray.300'}>
                Lock Sort
              </FormLabel>
              <Switch
                colorScheme="whiteAlpha"
                isChecked={lockSort}
                onChange={() => setLockSort(!lockSort)}
              />
            </FormControl>
          </Center>
        )}

        {itemInfoIds.filter((a) => itemInfo[a].isHighlight).length > 0 && (
          <Flex gap={3} flexFlow="column" p={3} bg="gray.700" borderRadius="md">
            <Center flexFlow="column">
              <Heading size="lg" mb={3}>
                Highlights
              </Heading>
              {isEdit && (
                <Text fontSize="xs" fontStyle="italic">
                  Highlights are only sorted by name
                </Text>
              )}
            </Center>
            <Flex gap={3} flexWrap="wrap" justifyContent="center">
              <SortableArea
                onClick={selectItem}
                ids={itemInfoIds
                  .filter((a) => itemInfo[a].isHighlight)
                  .sort((a, b) =>
                    items[itemInfo[a].item_iid].name.localeCompare(items[itemInfo[b].item_iid].name)
                  )}
                list={list}
                itemInfo={itemInfo}
                items={items}
                itemSelect={itemSelect}
                editMode={isEdit}
                activateSort={false}
                onSort={handleSort}
                onChange={handleItemInfoChange}
              />
            </Flex>
          </Flex>
        )}
        <Flex gap={3} px={3} flexWrap="wrap" justifyContent="center">
          <SortableArea
            list={list}
            onClick={selectItem}
            ids={itemInfoIds.filter((a) => !itemInfo[a].isHighlight)}
            itemInfo={itemInfo}
            items={items}
            itemSelect={itemSelect}
            editMode={isEdit}
            activateSort={isEdit && !lockSort}
            onSort={handleSort}
            onChange={handleItemInfoChange}
            onListAction={cntxAction}
          />
        </Flex>
      </Flex>
    </Layout>
  );
};

export default ListPage;

export async function getServerSideProps(context: NextPageContext) {
  const token = getCookie('userToken', { req: context.req, res: context.res }) as
    | string
    | undefined
    | null;

  const { list_id, username } = context.query;
  if (!username || !list_id || Array.isArray(username) || Array.isArray(list_id))
    return { notFound: true };

  const list = await getList(username, parseInt(list_id), token, username === 'official');

  if (!list) return { notFound: true };

  return {
    props: {
      list,
    },
  };
}

const sortItems = (
  a: ListItemInfo,
  b: ListItemInfo,
  sortBy: string,
  sortDir: string,
  items: { [id: string]: ItemData }
) => {
  const itemA = items[a.item_iid];
  const itemB = items[b.item_iid];

  if (sortBy === 'name') {
    if (sortDir === 'asc') return itemA.name.localeCompare(itemB.name);
    else return itemB.name.localeCompare(itemA.name);
  } else if (sortBy === 'price') {
    if (sortDir === 'asc')
      return (
        (itemA.price.value ?? 0) - (itemB.price.value ?? 0) ||
        (itemA.owls?.valueMin ?? -1) - (itemB.owls?.valueMin ?? -1)
      );
    else
      return (
        (itemB.price.value ?? 0) - (itemA.price.value ?? 0) ||
        (itemB.owls?.valueMin ?? -1) - (itemA.owls?.valueMin ?? -1)
      );
  } else if (sortBy === 'addedAt') {
    const dateA = new Date(a.addedAt);
    const dateB = new Date(b.addedAt);

    if (sortDir === 'asc') return dateA.getTime() - dateB.getTime();
    else return dateB.getTime() - dateA.getTime();
  } else if (sortBy === 'color') {
    const colorA = new Color(itemA.color.hex);
    const colorB = new Color(itemB.color.hex);
    const hsvA = colorA.hsv().array();
    const hsvB = colorB.hsv().array();

    if (sortDir === 'asc') return hsvB[0] - hsvA[0] || hsvB[1] - hsvA[1] || hsvB[2] - hsvA[2];
    else return hsvA[0] - hsvB[0] || hsvA[1] - hsvB[1] || hsvA[2] - hsvB[2];
  } else if (sortBy === 'custom') {
    if (sortDir === 'asc') return (a.order ?? -1) - (b.order ?? -1);
    else return (b.order ?? -1) - (a.order ?? -1);
  }

  return 0;
};
