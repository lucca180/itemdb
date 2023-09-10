/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  Badge,
  Box,
  Flex,
  Heading,
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
} from '@chakra-ui/react';
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../../../components/Layout';
import { ItemData, ListItemInfo, UserList } from '../../../types';
import { useAuth } from '../../../utils/auth';
import { useRouter } from 'next/router';
import ItemCard from '../../../components/Items/ItemCard';
import Color from 'color';
import SortableArea from '../../../components/Sortable/SortableArea';
import { SelectItemsCheckbox } from '../../../components/Input/SelectItemsCheckbox';
import { ItemActionModalProps } from '../../../components/Modal/ItemActionModal';
import { NextPageContext } from 'next';
import { getList } from '../../api/v1/lists/[username]/[list_id]';
import { getCookie } from 'cookies-next';

import { CreateListModalProps } from '../../../components/Modal/CreateListModal';

import dynamic from 'next/dynamic';
import ListHeader from '../../../components/UserLists/ListHeader';

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

  const isOwner = user?.username === router.query.username || user?.id === list?.owner.id;
  const color = Color(list?.colorHex || '#4A5568');
  const rgb = color.rgb().array();

  const itemCount = useMemo(() => {
    if (!list) return 0;

    return Object.values(itemInfo).filter((x) => !x.isHidden).length;
  }, [itemInfo]);

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
    if (!list || !user || list.purpose === 'none' || isOwner) return;

    let seeker = list.purpose === 'seeking' ? list.owner.id : user.username;
    let offerer = list.purpose === 'trading' ? list.owner.id : user.username;

    if (list.official) {
      seeker = user.username;
      offerer = list.owner.id;
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
    (id: number, value: number, field: 'amount' | 'capValue' | 'isHighlight' | 'isHidden') => {
      const newInfo = { ...itemInfo };

      if (field === 'isHidden' || field === 'isHighlight') newInfo[id][field] = !!value;
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
      <ListHeader
        list={list}
        isOwner={isOwner}
        color={color}
        items={items}
        itemInfo={itemInfo}
        setOpenCreateModal={setOpenCreateModal}
      />
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
                {itemCount} items
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
                  isDisabled={!!!itemSelect.length || list.dynamicType === 'fullSync'}
                  colorScheme="red"
                  variant="outline"
                  onClick={() => setSelectionAction('delete')}
                >
                  Delete Items
                </Button>
              </Box>
              <Box>
                <Button
                  isDisabled={!!!itemSelect.length || !!list.dynamicType}
                  variant="outline"
                  onClick={() => setSelectionAction('move')}
                >
                  Move Items
                </Button>
              </Box>
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
        {!isEdit && isOwner && (
          <Text
            textAlign={'center'}
            fontSize="xs"
            color="gray.500"
            display={{ base: 'none', md: 'inline' }}
          >
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
  if (!itemA || !itemB) return 0;

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
