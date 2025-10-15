/* eslint-disable react-you-might-not-need-an-effect/you-might-not-need-an-effect */
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
  FormControl,
  FormLabel,
  Switch,
  useToast,
  IconButton,
  useDisclosure,
  Link,
} from '@chakra-ui/react';
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../../../components/Layout';
import {
  ItemData,
  ListItemInfo,
  UserList,
  SearchFilters as SearchFiltersType,
  SearchStats,
} from '../../../types';
import { useRouter } from 'next/router';
import ItemCard from '../../../components/Items/ItemCard';
import Color from 'color';
import { SelectItemsCheckbox } from '../../../components/Input/SelectItemsCheckbox';
import { ItemActionModalProps } from '../../../components/Modal/ItemActionModal';
import { GetServerSidePropsContext } from 'next';
import { getList } from '../../api/v1/lists/[username]/[list_id]';

import { CreateListModalProps } from '../../../components/Modal/CreateListModal';

import dynamic from 'next/dynamic';
import ListHeader from '../../../components/UserLists/ListHeader';
import { CreateLinkedListButton } from '../../../components/DynamicLists/CreateLinkedList';
import { dynamicListCan, sortListItems, stripMarkdown } from '../../../utils/utils';
import { SearchList } from '../../../components/Search/SearchLists';
import { SortSelect } from '../../../components/Input/SortSelect';
import { CheckAuth } from '../../../utils/googleCloud';
import { useTranslations } from 'next-intl';
import { BsFilter } from 'react-icons/bs';
import { SearchFilterModalProps } from '../../../components/Search/SearchFiltersModal';
import { defaultFilters } from '../../../utils/parseFilters';
import { getFiltersDiff } from '../../search';
import { AddListItemsModalProps } from '../../../components/Modal/AddListItemsModal';
import { ItemList } from '../../../components/UserLists/ItemList';
import { preloadListItems } from '../../api/v1/lists/[username]/[list_id]/items';
import { getSimilarLists } from '../../api/v1/lists/[username]/[list_id]/similar';
import { loadTranslation } from '@utils/load-translation';
import { getListMatch } from '../../api/v1/lists/match/[...usernames]';

const CreateListModal = dynamic<CreateListModalProps>(
  () => import('../../../components/Modal/CreateListModal')
);

const ItemActionModal = dynamic<ItemActionModalProps>(
  () => import('../../../components/Modal/ItemActionModal')
);

const SearchFilterModal = dynamic<SearchFilterModalProps>(
  () => import('../../../components/Search/SearchFiltersModal')
);

const AddListItemsModal = dynamic<AddListItemsModalProps>(
  () => import('../../../components/Modal/AddListItemsModal')
);

const Markdown = dynamic(() => import('../../../components/Utils/Markdown'), { ssr: false });

const UserListCard = dynamic(() => import('../../../components/UserLists/ListCard'));

type ExtendedListItemInfo = ListItemInfo & { hasChanged?: boolean };

type ListPageProps = {
  list: UserList;
  canEdit: boolean;
  isOwner: boolean;
  preloadData: {
    itemMap: { [id: number]: ListItemInfo };
    infoIds: number[];
    itemInfo: ListItemInfo[];
    items: { [id: string]: ItemData };
  };
  similarLists: UserList[];
  matches: ListItemInfo[];
  messages: any;
  locale: string | undefined;
};

const ListPage = (props: ListPageProps) => {
  const t = useTranslations();
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isOpenInsert, onOpen: onOpenInsert, onClose: onCloseInsert } = useDisclosure();
  const { canEdit, isOwner, locale, preloadData, similarLists, matches } = props;

  const [forceList, setList] = useState<UserList>(props.list);

  const [openCreateModal, setOpenCreateModal] = useState<boolean>(false);

  const [itemInfoIds, setItemInfoIds] = useState<number[]>(preloadData.infoIds);
  const [rawItemInfo, setRawItemInfo] = useState<ListItemInfo[]>(preloadData.itemInfo);
  const [itemInfo, setItemInfo] = useState<{
    [itemInfoId: number]: ExtendedListItemInfo;
  }>(preloadData.itemMap);

  const [sortInfo, setSortInfo] = useState<{
    sortBy: string;
    sortDir: string;
  }>({ sortBy: props.list.sortBy, sortDir: props.list.sortDir });

  const [items, setItems] = useState<{ [item_iid: string]: ItemData }>(preloadData.items);
  const [itemSelect, setItemSelect] = useState<number[]>([]);

  const [isEdit, setEdit] = useState<boolean>(false);
  const [lockSort, setLockSort] = useState<boolean>(true);
  const [selectionAction, setSelectionAction] = useState<'move' | 'delete' | 'copy' | ''>('');

  const [isLoading, setLoading] = useState<boolean>(true);
  const [searchItemInfoIds, setSearchItemInfoIds] = useState<number[] | null>(null);

  const [listStats, setListStats] = useState<SearchStats | null>(null);
  const [filters, setFilters] = useState<SearchFiltersType>(defaultFilters);
  const searchQuery = useRef('');
  const prevList = useRef(props.list);

  const list = useMemo(() => {
    if (forceList && props.list.internal_id === forceList.internal_id) return forceList;
    return props.list;
  }, [forceList, props.list]);

  const color = Color(list?.colorHex || '#4A5568');
  const rgb = color.rgb().array();

  const sortTypes = useMemo(() => {
    return {
      name: 'name',
      price: 'price',
      rarity: 'rarity',
      color: 'color',
      custom: list.officialTag?.toLowerCase() === 'stamps' ? 'album-order' : 'custom',
      addedAt: 'added-at',
      faerieFest: 'recycling-points',
      item_id: 'item-id',
      quantity: 'quantity',
    };
  }, [list.officialTag]);

  const itemCount = useMemo(() => {
    if (!list) return 0;

    if (searchItemInfoIds) {
      return searchItemInfoIds.length;
    }

    return isLoading ? list.itemCount : Object.keys(itemInfo).length;
  }, [list, isLoading, itemInfo, searchItemInfoIds]);

  const qtyCount = useMemo(() => {
    let count = 0;

    if (isLoading) return list.itemCount;

    (searchItemInfoIds ?? itemInfoIds).forEach((id) => {
      count += itemInfo[id]?.amount ?? 0;
    });

    return count;
  }, [isLoading, itemInfo, itemInfoIds, searchItemInfoIds]);

  useEffect(() => {
    if (router.isReady) {
      init();
    }
  }, [router.isReady]);

  useEffect(() => {
    if (props.list.internal_id !== prevList.current.internal_id) {
      init(true);
      prevList.current = props.list;
    }

    return () => toast.closeAll();
  }, [props.list]);

  useEffect(() => {
    setItemInfoIds(preloadData.infoIds);
    setRawItemInfo(preloadData.itemInfo);
    setItemInfo(preloadData.itemMap);
    setItems(preloadData.items);
  }, [preloadData]);

  const isFiltered = useMemo(() => {
    return rawItemInfo.length !== Object.keys(itemInfo).length;
  }, [itemInfo]);

  const init = async (force = false) => {
    setLoading(true);
    toast.closeAll();
    searchQuery.current = '';
    setSearchItemInfoIds(null);
    setFilters(defaultFilters);
    try {
      const list_id = props.list.internal_id;
      const { username } = router.query;

      let listData = props.list;

      if (force || !list) {
        const res = await axios.get(`/api/v1/lists/${username}/${list_id}`);

        listData = res.data;

        if (listData.slug && listData.slug !== router.query.list_id) {
          router.replace(`/lists/${username}/${listData.slug}`);
        }

        if (!listData) throw 'List does not exist';
        setList(listData);
      }

      const [itemData, itemInfos] = await getItems(listData);

      const itemsId: number[] = itemInfos.map((item) => item.item_iid);

      if (itemsId.length === 0) {
        setRawItemInfo([]);
        setItemSelect([]);
        setItemInfoIds([]);
        setItemInfo({});
        setSortInfo({ sortBy: listData.sortBy, sortDir: listData.sortDir });
        if (force) setList(listData);
        setItems({});
        setLoading(false);
        return;
      }

      setRawItemInfo([...itemInfos]);

      const { infoIds, itemMap } = getSortedItemInfo(itemInfos, listData, itemData);

      setItemSelect([]);
      setSortInfo({ sortBy: listData.sortBy, sortDir: listData.sortDir });
      setItemInfoIds(infoIds);
      setItemInfo(itemMap);

      if (force) setList(listData);
      setItems(itemData);

      setLoading(false);
    } catch (err) {
      console.error(err);

      toast({
        title: t('General.an-error-occurred'),
        description: typeof err === 'string' ? err : t('General.try-again-later'),
        status: 'error',
        duration: null,
      });
    }
  };

  const getItems = async (
    newList: UserList
  ): Promise<[{ [id: string]: ItemData }, ListItemInfo[]]> => {
    if (!newList) return [{}, []];

    const basePath = `/api/v1/lists/${newList.owner.username}/${newList.internal_id}`;

    axios.get(`${basePath}/stats`).then((res) => setListStats(res.data));
    const [itemInfoRes, itemRes] = await Promise.all([
      axios.get(`${basePath}/items`),
      axios.get(`${basePath}/itemdata?asObject=true`),
    ]);
    const itemInfoData: ListItemInfo[] = itemInfoRes.data;

    const itemsId: number[] = itemInfoData.map((item) => item.item_iid);

    if (itemsId.length === 0) {
      return [{}, itemInfoData];
    }

    const itemDataRaw: { [id: string]: ItemData } = itemRes?.data;

    return [itemDataRaw, itemInfoData];
  };

  const handleSortChange = (sortBy: string, sortDir: string) => {
    if (!list) return;

    if (sortBy === 'custom' && list.officialTag?.toLowerCase() === 'stamps') {
      sortDir = 'asc';
    }

    if (searchItemInfoIds) {
      const itemInfoIds = Object.values(itemInfo)
        .filter((a) => items[a.item_iid]?.name.toLowerCase().includes(searchQuery.current))
        .sort((a, b) => sortListItems(a, b, sortBy, sortDir, items))
        .map((item) => item.internal_id);

      setSearchItemInfoIds(itemInfoIds);
    }

    const sortedItemInfo = Object.values(itemInfo).sort((a, b) =>
      sortListItems(a, b, sortBy, sortDir, items)
    );
    setSortInfo({ sortBy, sortDir });
    setItemInfoIds(sortedItemInfo.map((item) => item.internal_id));
    setLockSort(true);
  };

  const handleSearch = (query: string) => {
    if (!list) return;

    searchQuery.current = query.toLowerCase();

    if (!query) {
      setSearchItemInfoIds(null);
      return;
    }

    const itemInfoIds = Object.values(itemInfo)
      .filter((a) => items[a.item_iid]?.name.toLowerCase().includes(searchQuery.current.trim()))
      .sort((a, b) => sortListItems(a, b, sortInfo.sortBy, sortInfo.sortDir, items))
      .map((item) => item.internal_id);

    setSearchItemInfoIds(itemInfoIds);
  };

  const applyFilters = async (customFilters?: SearchFiltersType) => {
    const params = getFiltersDiff({ ...(customFilters ?? filters) });

    if (customFilters) {
      setFilters(customFilters);
    }
    setLoading(true);
    setItemInfoIds([]);
    const itemRes = await axios.get(
      `/api/v1/lists/${list.owner.username}/${list.internal_id}/items`,
      {
        params,
      }
    );

    const itemInfoData = itemRes.data as ListItemInfo[];

    const { infoIds, itemMap } = getSortedItemInfo(itemInfoData, list, items);

    searchQuery.current = '';
    setSearchItemInfoIds(null);
    setItemSelect([]);
    setItemInfoIds(infoIds);
    setItemInfo(itemMap);
    setLoading(false);
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
      if (!canEdit) return;
      if (!isEdit && !force) return;

      if (force) setEdit(true);

      if (itemSelect.includes(infoId)) {
        setItemSelect(itemSelect.filter((item) => item !== infoId));
      } else {
        setItemSelect([...itemSelect, infoId]);
      }
    },
    [isEdit, itemSelect, canEdit]
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
      title: t('General.you-have-unsaved-changes'),
      id: 'unsavedChanges',
      description: (
        <Flex gap={2}>
          <Button variant="solid" onClick={saveChanges} colorScheme="blackAlpha" size="sm">
            {t('General.save-changes')}
          </Button>
          <Button variant="solid" onClick={() => init(true)} colorScheme="blackAlpha" size="sm">
            {t('General.cancel')}
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
      title: `${t('General.saving-changes')}...`,
      status: 'info',
      duration: null,
    });

    const changedItems = Object.values(itemInfo).filter((item) => item.hasChanged);

    try {
      const res = await axios.post(`/api/v1/lists/${list.owner.username}/${list.internal_id}`, {
        list_id: list.internal_id,
        itemInfo: changedItems,
      });

      if (res.data.success) {
        toast.update(x, {
          title: t('Feedback.changes-saved'),
          status: 'success',
          duration: 5000,
        });

        setEdit(false);
        init(true);
      } else throw res.data.error;
    } catch (err) {
      console.error(err);
      toast.update(x, {
        title: t('General.an-error-occurred'),
        description: t('General.try-again-later'),
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleItemInfoChange = useCallback(
    (
      id: number,
      value: number | string | null,
      field:
        | 'amount'
        | 'capValue'
        | 'isHighlight'
        | 'isHidden'
        | 'order'
        | 'seriesStart'
        | 'seriesEnd'
    ) => {
      const newInfo = { ...itemInfo } as any;

      if (field === 'seriesStart' || field === 'seriesEnd') {
        newInfo[id][field] = value as string | null;
      } else {
        if (field === 'isHidden' || field === 'isHighlight') newInfo[id][field] = !!value;
        else newInfo[id][field] = value;
      }

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

  return (
    <Layout
      SEO={{
        title: `${list.name} - ${
          list.official
            ? t('General.official-list')
            : t('Lists.owner-username-s-lists', { username: list.owner.username ?? '' })
        }`,
        nofollow: !list.official,
        noindex: !list.official,
        themeColor: list.colorHex ?? '#4A5568',
        description: stripMarkdown(list.description ?? '') || undefined,
        canonical: `https://itemdb.com.br${locale === 'pt' ? '/pt' : ''}/lists/${
          list.official ? 'official' : list.owner.username
        }/${list.slug ?? list.internal_id}`,
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
      mainColor={`${color.hex()}b8`}
    >
      {isOpen && (
        <SearchFilterModal
          isLists
          isOpen={isOpen}
          onClose={onClose}
          filters={filters}
          stats={listStats}
          onChange={(filters) => setFilters(filters)}
          resetFilters={() => applyFilters(defaultFilters)}
          applyFilters={() => applyFilters()}
        />
      )}
      {openCreateModal && (
        <CreateListModal
          refresh={() => init(true)}
          isOpen={openCreateModal}
          list={list}
          onClose={() => setOpenCreateModal(false)}
        />
      )}
      {!!selectionAction && (
        <ItemActionModal
          refresh={() => init(true)}
          isOpen={!!selectionAction}
          onClose={() => setSelectionAction('')}
          selectedItems={itemSelect.map((id) => itemInfo[id])}
          action={selectionAction}
          list={list}
        />
      )}
      {isOpenInsert && (
        <AddListItemsModal isOpen={isOpenInsert} onClose={onCloseInsert} list={list} />
      )}
      <ListHeader
        list={list}
        canEdit={canEdit}
        color={color}
        items={items}
        itemInfo={itemInfo}
        isLoading={isLoading}
        setOpenCreateModal={setOpenCreateModal}
      />
      <Flex mt={5} gap={6} flexFlow="column">
        {matches.length > 0 && (
          <>
            <Box>
              <Heading size={{ base: 'md', md: 'lg' }}>
                {t.rich('Lists.you-plus-list', {
                  Badge: (chunk) => (
                    <Badge fontSize={0} verticalAlign="middle">
                      {chunk}
                    </Badge>
                  ),
                  matches: matches.length,
                  listName: list.name,
                })}
              </Heading>
              <Text color="gray.400" fontSize={{ base: 'sm', md: 'md' }}>
                {!list.official && list.purpose === 'trading'
                  ? t('Lists.aka-seek')
                  : t('Lists.aka-have')}
              </Text>
            </Box>
            <Flex gap={3} flexWrap="wrap" w="100%" justifyContent="center">
              {matches
                .sort((a, b) => sortListItems(a, b, 'name', 'asc', items))
                .map((itemMatch) => (
                  <ItemCard
                    uniqueID="list-match"
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
          flexFlow={{ base: 'column-reverse', lg: 'row' }}
        >
          {!isEdit && (
            <HStack>
              {canEdit && (
                <Button variant="solid" onClick={onOpenInsert} isLoading={isLoading}>
                  {t('Lists.add-items')}
                </Button>
              )}
              {(isOwner || list.official || list.canBeLinked) && !list.linkedListId && (
                <CreateLinkedListButton list={list} isLoading={isLoading} />
              )}
              {(!qtyCount || itemCount === qtyCount) && (
                <Text as="div" textColor={'gray.300'} fontSize="sm">
                  {t('Lists.itemcount-items', { itemCount })}
                </Text>
              )}
              {!!qtyCount && qtyCount !== itemCount && (
                <Text as="div" textColor={'gray.300'} fontSize="sm">
                  {t('Lists.xx-unique-items-yy-total', { itemCount, qtyCount })}
                </Text>
              )}
            </HStack>
          )}
          {isEdit && (
            <Flex gap={3} flexWrap="wrap" justifyContent={'center'}>
              <Box bg={`rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.35)`} p={2} borderRadius="md">
                <SelectItemsCheckbox
                  checked={itemSelect}
                  allChecked={itemSelect.length === Object.values(itemInfo).length}
                  onClick={handleSelectCheckbox}
                />
              </Box>
              <Box>
                <Button
                  isDisabled={!itemSelect.length || !dynamicListCan(list, 'remove')}
                  colorScheme="red"
                  variant="outline"
                  onClick={() => setSelectionAction('delete')}
                >
                  {t('Lists.delete-items')}
                </Button>
              </Box>
              <Box>
                <Button
                  isDisabled={!itemSelect.length || !dynamicListCan(list, 'remove')}
                  variant="outline"
                  onClick={() => setSelectionAction('move')}
                >
                  {t('Lists.move-items')}
                </Button>
              </Box>
              <Box>
                <Button
                  isDisabled={!itemSelect.length}
                  variant="outline"
                  onClick={() => setSelectionAction('copy')}
                >
                  {t('Lists.copy-items')}
                </Button>
              </Box>
            </Flex>
          )}

          <HStack
            flex="0 0 auto"
            minW={{ base: 'none', md: 400 }}
            justifyContent={['center', 'flex-end']}
            flexWrap={'wrap'}
          >
            <IconButton
              isLoading={isLoading}
              aria-label="search filters"
              onClick={onOpen}
              icon={<BsFilter />}
              colorScheme={isFiltered ? 'blue' : undefined}
            />
            <SearchList disabled={isLoading} onChange={handleSearch} />
            {canEdit && (
              <FormControl
                display="flex"
                alignItems="center"
                justifyContent="center"
                w={'auto'}
                isDisabled={isLoading}
              >
                <FormLabel mb="0" textColor={'gray.300'} fontSize="sm">
                  {t('General.edit-mode')}
                </FormLabel>
                <Switch colorScheme="whiteAlpha" isChecked={isEdit} onChange={toggleEdit} />
              </FormControl>
            )}
            <HStack>
              <Text
                flex="0 0 auto"
                textColor={'gray.300'}
                fontSize="sm"
                display={{ base: 'none', md: 'inherit' }}
              >
                {t('General.sort-by')}
              </Text>
              <SortSelect
                sortTypes={sortTypes}
                sortBy={sortInfo.sortBy}
                onClick={handleSortChange}
                sortDir={sortInfo.sortDir as 'asc' | 'desc'}
                disabled={isLoading}
              />
            </HStack>
          </HStack>
        </Flex>
        {!isEdit && canEdit && (
          <Text
            textAlign={'center'}
            fontSize="xs"
            color="gray.400"
            display={{ base: 'none', md: 'inline' }}
          >
            {t('General.tip')}: {t('Lists.user-list-tip-1')}
          </Text>
        )}
        {list.officialTag === 'Stamps' && (
          <Text
            textAlign={'center'}
            fontSize="xs"
            color="gray.400"
            display={{ base: 'none', md: 'inline' }}
          >
            {t('General.tip')}:{' '}
            {t.rich('Lists.stamp-script-tip', {
              Link: (chunk) => (
                <Link color="gray.200" href="/articles/userscripts" isExternal>
                  {chunk}
                </Link>
              ),
            })}
          </Text>
        )}
        {isEdit && sortInfo.sortBy === 'custom' && (
          <Center>
            <FormControl display="flex" alignItems="center" justifyContent="center">
              <FormLabel mb="0" textColor={'gray.300'}>
                {t('Lists.lock-sort')}
              </FormLabel>
              <Switch
                colorScheme="whiteAlpha"
                isChecked={lockSort}
                onChange={() => setLockSort(!lockSort)}
              />
            </FormControl>
          </Center>
        )}

        {(searchItemInfoIds ?? itemInfoIds).filter(
          (a) => !!itemInfo && itemInfo[a].isHighlight && (!itemInfo[a].isHidden || isEdit)
        ).length > 0 && (
          <Flex
            gap={3}
            flexFlow="column"
            p={3}
            bg="blackAlpha.500"
            borderRadius="md"
            boxShadow={'lg'}
          >
            <Center flexFlow="column">
              <Flex
                mb={3}
                alignItems="center"
                gap={1}
                flexWrap="wrap"
                justifyContent="center"
                textAlign={'center'}
                flexFlow={'column'}
              >
                <Heading size="lg">
                  {list.highlight
                    ? list.highlight
                    : list.official
                      ? t('Lists.exclusives')
                      : t('Lists.highlights')}
                </Heading>
                {list.highlightText && (
                  <Text as="div" fontSize={'sm'} color="whiteAlpha.800">
                    <Markdown>{list.highlightText}</Markdown>
                  </Text>
                )}
              </Flex>
              {isEdit && (
                <Text fontSize="xs" fontStyle="italic">
                  {t('Lists.highlights-text')}
                </Text>
              )}
            </Center>
            <Flex px={[1, 3]} flexFlow="column">
              <ItemList
                onClick={selectItem}
                ids={(searchItemInfoIds ?? itemInfoIds)
                  .filter((a) => itemInfo[a].isHighlight)
                  .sort((a, b) =>
                    items[itemInfo[a].item_iid]?.name?.localeCompare(
                      items[itemInfo[b].item_iid]?.name ?? ''
                    )
                  )}
                list={list}
                itemInfo={itemInfo}
                items={items}
                itemSelect={itemSelect}
                editMode={isEdit}
                activateSort={false}
                onSort={handleSort}
                onChange={handleItemInfoChange}
                onListAction={canEdit ? cntxAction : undefined}
              />
            </Flex>
          </Flex>
        )}
        {isLoading && !itemInfoIds.length && (
          <Flex gap={3} justifyContent={'center'} wrap={'wrap'}>
            {Array.from({ length: Math.min(8 * 5, list.itemCount) }).map((_, i) => (
              <ItemCard uniqueID={`loading`} key={i} isLoading />
            ))}
          </Flex>
        )}
        {(!isLoading || !!itemInfoIds.length) && (
          <Flex flexFlow="column">
            <ItemList
              list={list}
              sortType={sortInfo.sortBy}
              onClick={selectItem}
              ids={(searchItemInfoIds ?? itemInfoIds).filter((a) => !itemInfo[a].isHighlight)}
              itemInfo={itemInfo}
              items={items}
              itemSelect={itemSelect}
              editMode={isEdit}
              activateSort={isEdit && !lockSort}
              onSort={handleSort}
              onChange={handleItemInfoChange}
              onListAction={canEdit ? cntxAction : undefined}
            />
          </Flex>
        )}
      </Flex>
      {similarLists.length > 0 && (
        <Flex flexFlow="column" mt={10} gap={3} p={5} borderRadius={'lg'} bg="blackAlpha.500">
          <Heading size="lg">{t('Lists.similar-lists')}</Heading>
          <Flex gap={5} flexWrap="wrap" justifyContent={'center'}>
            {similarLists.map((list) => (
              <UserListCard
                isSmall
                key={list.internal_id}
                list={list}
                utm_content="similar-lists"
              />
            ))}
          </Flex>
        </Flex>
      )}
    </Layout>
  );
};

export default ListPage;

function getSortedItemInfo(
  itemInfos: ListItemInfo[],
  listData: UserList,
  itemData: { [id: string]: ItemData }
): { infoIds: number[]; itemMap: { [id: number]: ListItemInfo } } {
  const sortedItemInfo = itemInfos.sort((a, b) =>
    sortListItems(a, b, listData.sortBy, listData.sortDir, itemData)
  );
  const infoIds = [];
  const itemMap: { [id: number]: ListItemInfo } = {};

  for (const itemInfo of sortedItemInfo) {
    infoIds.push(itemInfo.internal_id);
    itemMap[itemInfo.internal_id] = itemInfo;
  }
  return { infoIds, itemMap };
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { list_id, username } = context.query;
  if (!username || !list_id || Array.isArray(username) || Array.isArray(list_id))
    return { notFound: true };

  let user = null;

  try {
    const res = await CheckAuth((context.req ?? null) as any);
    user = res?.user;
  } catch (err) {}

  const isNum = /^\d+$/.test(list_id);

  const parsedId = !isNum ? undefined : parseInt(list_id as string);
  const slug = isNum ? undefined : list_id;

  const list = await getList(username, (parsedId ?? slug)!, user, username === 'official');

  if (!list) return { notFound: true };

  if (parsedId && list.slug) {
    let actualUsername = username;
    if (list.official) actualUsername = 'official';
    return {
      redirect: {
        destination: `/lists/${actualUsername}/${list.slug}`,
        permanent: true,
      },
    };
  }

  if (list.official && username !== 'official') {
    return {
      redirect: {
        destination: `/lists/official/${list.slug ?? list.internal_id}`,
        permanent: true,
      },
    };
  }
  const isOwner = user && user.id === list.owner.id;

  const shouldGetMatches = !!list && !!user && list.purpose !== 'none' && !isOwner;

  const seeker: string = list.purpose === 'seeking' ? list.owner.username! : (user?.username ?? '');
  const offerer: string =
    list.purpose === 'trading' ? list.owner.username! : (user?.username ?? '');

  const [preloadData, similarLists, matches] = await Promise.all([
    preloadListItems(list, 30),
    list.official ? getSimilarLists(list, 3) : [],
    shouldGetMatches
      ? (
          getListMatch(seeker, offerer, (context.req ?? null) as any, list.internal_id) as Promise<
            ListItemInfo[]
          >
        ).catch(() => [])
      : [],
  ]);

  const { itemMap, infoIds } = getSortedItemInfo(preloadData.items, list, preloadData.itemData);

  const props: ListPageProps = {
    list,
    preloadData: {
      itemMap,
      infoIds,
      itemInfo: preloadData.items,
      items: preloadData.itemData,
    },
    similarLists,
    matches,
    canEdit: !!(user && (user.id === list.owner.id || (list.official && user.isAdmin))),
    isOwner: !!(user && user.id === list.owner.id),
    messages: await loadTranslation(context.locale as string, 'lists/[username]/[list_id]'),
    locale: context.locale,
  };

  return {
    props,
  };
}
