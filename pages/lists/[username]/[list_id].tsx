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
} from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import Layout from '../../../components/Layout';
import CreateListModal from '../../../components/Modal/CreateListModal';
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
import ItemActionModal from '../../../components/Modal/ItemActionModal';
import { BiLinkExternal } from 'react-icons/bi';

type ExtendedListItemInfo = ListItemInfo & { hasChanged?: boolean };

const ListPage = () => {
  const router = useRouter();
  const toast = useToast();

  const { user, getIdToken, authLoading } = useAuth();
  const [list, setList] = useState<UserList>();
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
  const [isLargerThanSM] = useMediaQuery('(min-width: 30em)');

  const isOwner = user?.username === router.query.username;
  const color = Color(list?.colorHex ?? '#4A5568');
  const rgb = color.rgb().array();

  useEffect(() => {
    if (!authLoading && router.isReady && !list) {
      init();
    }
  }, [authLoading, list, router.isReady]);

  useEffect(() => {
    if (list) setList(undefined);

    return () => toast.closeAll();
  }, [router.query]);

  useEffect(() => {
    if (user && list) getMatches();
  }, [user, list]);

  const init = async () => {
    toast.closeAll();
    const { username, list_id } = router.query;
    try {
      const token = await getIdToken();

      const res = await axios.get(`/api/v1/lists/${username}/${list_id}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const listData = res.data as UserList | null;

      if (!listData) throw 'List does not exist';

      const itensId: number[] = listData.itemInfo.map((item) => item.item_iid);

      if (itensId.length === 0) {
        setItemSelect([]);
        setItemInfoIds([]);
        setItemInfo({});
        setMatches([]);
        setSortInfo({ sortBy: listData.sortBy, sortDir: listData.sortDir });
        setList(res.data);
        setItems({});
        return;
      }

      const itemRes = await axios.post(`/api/v1/items/many`, {
        id: itensId,
      });

      const itemInfos = listData.itemInfo;

      const sortedItemInfo = itemInfos.sort((a, b) =>
        sortItems(
          a,
          b,
          listData.sortBy,
          listData.sortDir,
          itemRes.data as { [id: string]: ItemData }
        )
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
      setList(res.data);
      setItems(itemRes.data);
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
      setLockSort(true);
    }

    setEdit(!isEdit);
  };

  const selectItem = (id: number) => {
    if (!isEdit) return;
    if (itemSelect.includes(id)) {
      setItemSelect(itemSelect.filter((item) => item !== id));
    } else {
      setItemSelect([...itemSelect, id]);
    }
  };

  const handleSelectCheckbox = (checkAll: boolean) => {
    if (checkAll) setItemSelect(itemInfoIds);
    else setItemSelect([]);
  };

  const handleSort = (newOrder: number[]) => {
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
  };

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
          <Button variant="solid" onClick={init} colorScheme="blackAlpha" size="sm">
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
          sortInfo: {
            sortBy: sortInfo.sortBy,
            sortDir: sortInfo.sortDir,
          },
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
        init();
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

  const handleItemInfoChange = (
    id: number,
    value: number,
    field: 'amount' | 'capValue' | 'isHighlight'
  ) => {
    const newInfo = { ...itemInfo };

    if (field === 'isHighlight') newInfo[id][field] = !!value;
    else newInfo[id][field] = value;

    newInfo[id].hasChanged = true;

    setItemInfo(newInfo);
    setHasChanges();
  };

  if (!list) return <Layout loading />;

  return (
    <Layout>
      <CreateListModal
        refresh={init}
        isOpen={openCreateModal}
        list={list}
        onClose={() => setOpenCreateModal(false)}
      />
      <ItemActionModal
        refresh={init}
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
                Edit list
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
                <Badge borderRadius="md" colorScheme="blue" variant="solid">
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
                <Link as={NextLink} fontWeight="bold" href={'/lists/' + list.user_username}>
                  {list.user_username}
                </Link>
              </Text>
              {!list.official && list.user_neouser && isLargerThanSM && (
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
            <Text mt={{ base: 2, md: 3 }} fontSize={{ base: 'sm', md: 'md' }}>
              {list.description}
            </Text>
          </Box>
        </Flex>
      </Box>
      <Flex mt={5} gap={6} flexFlow="column">
        {!isOwner && (
          <>
            <Box>
              <Heading size={{ base: 'md', md: 'lg' }}>
                You + {list.name}{' '}
                <Badge fontSize={{ base: 'md', md: 'lg' }} verticalAlign="middle">
                  {matches.length}
                </Badge>
              </Heading>
              <Text color="gray.400" fontSize={{ base: 'sm', md: 'md' }}>
                aka. items you {!list.official && list.purpose === 'trading' ? 'have' : 'seek'} that
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
            <Text as="div" textColor={'gray.300'} fontSize="sm">
              {list.itemCount} items
            </Text>
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
          />
        </Flex>
      </Flex>
    </Layout>
  );
};

export default ListPage;

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
    if (sortDir === 'asc') return (itemA.price.value ?? 0) - (itemB.price.value ?? 0);
    else return (itemB.price.value ?? 0) - (itemA.price.value ?? 0);
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
