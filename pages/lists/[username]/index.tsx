import {
  Badge,
  Box,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
  Image,
  Button,
  Center,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Switch,
  useToast,
  Spinner,
  IconButton,
} from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../../components/Layout';
import { CreateListModalProps } from '../../../components/Modal/CreateListModal';
import { ListItemInfo, User, UserAchievement, UserList } from '../../../types';
import { useRouter } from 'next/router';
import { SortableListsProps } from '../../../components/Sortable/SortableLists';
import Color from 'color';
import { SelectItemsCheckbox } from '../../../components/Input/SelectItemsCheckbox';
import { FaEnvelope, FaHouseUser, FaTrash } from 'react-icons/fa';
import { DeleteListModalProps } from '../../../components/Modal/DeleteListModal';
import { EditProfileModalProps } from '../../../components/Modal/EditProfileModal';
import { GetServerSidePropsContext } from 'next';
import { getUser } from '../../api/v1/users/[username]';
import NextImage from 'next/image';
import icon from '../../../public/logo_icon.svg';
import UserAchiev from '../../../components/Achievements/UserAchiev';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { CheckAuth } from '../../../utils/googleCloud';
import { getUserAchievements } from '../../api/v1/users/[username]/achievements';
import UserListCard from '../../../components/UserLists/ListCard';
import { loadTranslation } from '@utils/load-translation';

const Markdown = dynamic(() => import('../../../components/Utils/Markdown'), { ssr: false });

const CreateListModal = dynamic<CreateListModalProps>(
  () => import('../../../components/Modal/CreateListModal')
);

const DeleteListModal = dynamic<DeleteListModalProps>(
  () => import('../../../components/Modal/DeleteListModal')
);

const EditProfileModal = dynamic<EditProfileModalProps>(
  () => import('../../../components/Modal/EditProfileModal')
);

const SortableLists = dynamic<SortableListsProps>(
  () => import('../../../components/Sortable/SortableLists')
);

type ExtendedUserList = UserList & {
  hasChanged?: boolean;
};

type Props = {
  owner: User;
  user: User | null;
  isOwner: boolean;
  achievements: UserAchievement[];
  messages: any;
  locale: string;
};

const UserListsPage = (props: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const toast = useToast();
  const { isOwner, user } = props;
  const [openCreateModal, setOpenCreateModal] = useState<boolean>(false);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [openEditProfileModal, setOpenEditProfileModal] = useState<boolean>(false);

  const [lists, setLists] = useState<{ [list_id: number]: ExtendedUserList }>({});
  const [listsIds, setListsIds] = useState<number[]>([]);

  const [selectedLists, setSelectedLists] = useState<number[]>([]);
  const [isEdit, setEdit] = useState<boolean>(false);

  const [owner, setOwner] = useState<User>(props.owner);
  const [matches, setMatches] = useState<{
    seek: { [list_id: number]: ListItemInfo[] };
    trade: { [list_id: number]: ListItemInfo[] };
  }>({
    seek: {},
    trade: {},
  });
  const [loading, setLoading] = useState<boolean>(true);

  const color = Color(owner?.profileColor || '#4A5568');
  const rgb = color.rgb().array();

  useEffect(() => {
    if (router.isReady && loading) {
      init();
    }
  }, [router.isReady]);

  useEffect(() => {
    if (owner && router.query.username !== owner.username) init(true);

    return () => toast.closeAll();
  }, [router.query]);

  useEffect(() => {
    setOwner(props.owner);
  }, [props.owner]);

  const seekItems = useMemo(() => {
    const allItems = new Set(Object.values(matches.seek).flat());
    return allItems.size;
  }, [matches.seek]);

  const tradeItems = useMemo(() => {
    const allItems = new Set(Object.values(matches.trade).flat());
    return allItems.size;
  }, [matches.trade]);

  const listGroups = useMemo(() => {
    const groups: { [key: string]: ExtendedUserList[] } = {};

    listsIds.forEach((id) => {
      const list = lists[id];
      if (!list) return;
      const groupTag = list.userTag ?? '';

      if (!groups[groupTag]) groups[groupTag] = [];
      groups[groupTag].push(list);
    });

    return Object.entries(groups)
      .map(([group, lists]) => ({
        group,
        lists,
      }))
      .sort((a, b) => {
        if (a.group === '') return 1;
        if (b.group === '') return -1;
        return a.group.localeCompare(b.group);
      });
  }, [lists]);

  const isGroupMode = owner.profileMode === 'groups';

  const init = async (force = false) => {
    setLists({});
    setLoading(true);
    const targetUsername = router.query.username;
    try {
      if (!targetUsername) throw 'Invalid Username';

      const listsRes = await axios.get(`/api/v1/lists/${targetUsername}`);

      if (force) {
        const userRes = await axios.get(`/api/v1/users/${targetUsername}`);
        if (!userRes.data) throw 'This user does not exist';
        setOwner(userRes.data);
      }

      if (user && !isOwner) {
        const [seekRes, tradeRes] = await Promise.all([
          axios.get(`/api/v1/lists/match/${user.username}/${targetUsername}`),
          axios.get(`/api/v1/lists/match/${targetUsername}/${user.username}`),
        ]);

        setMatches({
          seek: seekRes.data,
          trade: tradeRes.data,
        });
      }

      const listsData = listsRes.data;
      const listsIds = listsData.map((list: UserList) => list.internal_id);
      setListsIds(listsIds);

      const listsObj: { [list_id: number]: UserList } = {};

      listsData.forEach((list: UserList) => {
        listsObj[list.internal_id] = list;
      });

      setLists(listsObj);
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

  const selectItem = (id: number) => {
    if (!isEdit) return;
    if (selectedLists.includes(id)) setSelectedLists(selectedLists.filter((list) => list !== id));
    else setSelectedLists([...selectedLists, id]);
  };

  const handleSelectCheckbox = (checkAll: boolean) => {
    if (checkAll) setSelectedLists(listsIds);
    else setSelectedLists([]);
  };

  const toggleEdit = () => {
    if (isEdit) setSelectedLists([]);

    setEdit(!isEdit);
  };

  const handleSort = (newOrder: number[]) => {
    const newLists = { ...lists };

    for (let i = 0; i < newOrder.length; i++) {
      if (newLists[newOrder[i]].order === i) continue;

      newLists[newOrder[i]].order = i;
      newLists[newOrder[i]].hasChanged = true;
      setHasChanges();
    }

    setListsIds(newOrder);
    setLists(newLists);
  };

  const setHasChanges = () => {
    if (toast.isActive('unsavedChanges')) return;

    toast({
      title: t('General.you-have-unsaved-changes'),
      id: 'unsavedChanges',
      description: (
        <>
          <Button variant="solid" colorScheme="blackAlpha" onClick={handleSaveChanges} size="sm">
            {t('General.save-changes')}
          </Button>
        </>
      ),
      status: 'info',
      duration: null,
    });
  };

  const handleSaveChanges = async () => {
    toast.closeAll();

    const x = toast({
      title: `${t('General.saving-changes')}...`,
      status: 'info',
      duration: null,
    });

    try {
      const listsToSave = Object.values(lists).filter((list) => list.hasChanged);

      if (!user || !isOwner) return;

      const res = await axios.put(`/api/v1/lists/${user.username}`, { lists: listsToSave });

      if (res.data.success) {
        toast.update(x, {
          title: t('Feedback.changes-saved'),
          status: 'success',
          duration: 5000,
        });

        setEdit(false);
      }
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

  const refresh = () => {
    setSelectedLists([]);
    setEdit(false);
    init(true);
  };

  return (
    <Layout
      SEO={{
        title: t('Lists.owner-username-s-lists', { username: router.query.username as string }),
        nofollow: true,
        noindex: true,
      }}
      mainColor={`${color.hex()}b8`}
    >
      {isOwner && (
        <>
          <CreateListModal
            isOpen={openCreateModal}
            onClose={() => setOpenCreateModal(false)}
            refresh={refresh}
          />
          <EditProfileModal
            isOpen={openEditProfileModal}
            onClose={() => setOpenEditProfileModal(false)}
            refresh={refresh}
          />
        </>
      )}
      {isOwner && router.query.username && (
        <DeleteListModal
          username={router.query.username as string}
          selectedLists={selectedLists}
          isOpen={openDeleteModal}
          onClose={() => setOpenDeleteModal(false)}
          refresh={refresh}
        />
      )}
      <Box>
        <Box
          position="absolute"
          h="45vh"
          left="0"
          width="100%"
          bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.6) 80%)`}
          zIndex={-1}
        />
        <Flex gap={{ base: 3, md: 6 }} pt={6} alignItems="center">
          <Box
            position="relative"
            p={{ base: 1, md: 2 }}
            bg={`rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.75)`}
            borderRadius="md"
            display="flex"
            flexFlow="column"
            justifyContent="center"
            alignItems="center"
            boxShadow="sm"
            textAlign="center"
            flex="0 0 auto"
            minW={{ base: '100px', md: '150px' }}
            minH={{ base: '100px', md: '150px' }}
          >
            {!owner.profileImage && (
              <Image
                as={NextImage}
                src={icon}
                width={{ base: '50px', md: '80px' }}
                style={{ opacity: 0.85, flex: 1 }}
                alt={'List Cover'}
              />
            )}
            {owner.profileImage && (
              <Image
                src={owner.profileImage}
                width={{ base: '100px', md: '150px' }}
                height={{ base: '100px', md: '150px' }}
                borderRadius="md"
                alt={'List Cover'}
                objectFit="cover"
              />
            )}
            {isOwner && (
              <Button
                variant="solid"
                mt={2}
                onClick={() => setOpenEditProfileModal(true)}
                colorScheme={color.isLight() ? 'blackAlpha' : 'gray'}
                size="sm"
              >
                {t('Lists.edit-profile')}
              </Button>
            )}
          </Box>
          <Flex flexFlow={'column'} h={'100%'} gap={2} alignItems={'flex-start'}>
            <Stack direction="row" mb={1} flexWrap="wrap">
              <IconButton
                as={Link}
                isExternal
                href={`http://www.neopets.com/userlookup.phtml?user=${owner.neopetsUser}`}
                size="sm"
                aria-label={t('General.userlookup')}
                icon={<FaHouseUser />}
              />
              <IconButton
                as={Link}
                isExternal
                href={`http://www.neopets.com/neomessages.phtml?type=send&recipient=${owner.neopetsUser}`}
                size="sm"
                aria-label={t('General.neomail')}
                icon={<FaEnvelope />}
              />
              {owner.username && <UserAchiev achievements={props.achievements} />}
            </Stack>
            <Heading size={{ base: 'lg', md: undefined }}>
              {t('Lists.owner-username-s-lists', { username: owner.username })}{' '}
              {!loading && (
                <Badge fontSize="lg" verticalAlign="middle">
                  {listsIds.length}
                </Badge>
              )}
            </Heading>
            {owner.description && (
              <Text as="div" fontSize={{ base: 'xs', md: 'sm' }}>
                <Markdown>{owner.description}</Markdown>
              </Text>
            )}
            {isOwner && !owner.description && (
              <Text fontSize={{ base: 'xs', md: 'sm' }} fontStyle={'italic'} opacity={0.8}>
                Tip: you can add a description to your profile!
              </Text>
            )}
            {!isOwner && (
              <Box bg="blackAlpha.400" p={1} px={2} borderRadius="md" mt={2} color="gray.300">
                <Stack gap={1}>
                  <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold">
                    {t.rich('Lists.profile-match-want', {
                      Badge: (chunk) => (
                        <Badge borderRadius="md" verticalAlign="middle" colorScheme="green">
                          {chunk}
                        </Badge>
                      ),
                      username: owner.username,
                      items: seekItems,
                    })}
                  </Text>
                  <Text
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight="bold"
                    sx={{ marginTop: '0 !important' }}
                  >
                    {t.rich('Lists.profile-match-have', {
                      Badge: (chunk) => (
                        <Badge borderRadius="md" verticalAlign="middle" colorScheme="blue">
                          {chunk}
                        </Badge>
                      ),
                      username: owner.username,
                      items: tradeItems,
                    })}
                  </Text>
                </Stack>
              </Box>
            )}
          </Flex>
        </Flex>
      </Box>

      <Divider mt={5} />

      <Flex justifyContent={'space-between'} flexWrap="wrap" gap={3} alignItems="center" py={3}>
        <HStack>
          {isOwner && (
            <Button isLoading={loading} variant="solid" onClick={() => setOpenCreateModal(true)}>
              + {t('Lists.new-list')}
            </Button>
          )}
          {!isEdit && !loading && (
            <Text as="div" textColor={'gray.300'} fontSize="sm">
              {listsIds.length} {t('General.lists')}
            </Text>
          )}
          {isEdit && (
            <Flex gap={3}>
              <Box bg={`rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.35)`} p={2} borderRadius="md">
                <SelectItemsCheckbox
                  checked={selectedLists}
                  allChecked={selectedLists.length === listsIds.length}
                  onClick={handleSelectCheckbox}
                />
              </Box>
              <Button
                isDisabled={!selectedLists.length}
                colorScheme="red"
                leftIcon={<FaTrash />}
                variant="ghost"
                onClick={() => setOpenDeleteModal(true)}
              >
                {t('General.delete')}
              </Button>
              <Box></Box>
            </Flex>
          )}
        </HStack>
        <HStack flex="0 0 auto">
          {isOwner && (
            <FormControl isDisabled={loading} display="flex" alignItems="center">
              <FormLabel mb="0" textColor={'gray.300'} fontSize="sm">
                {t('General.edit-mode')}
              </FormLabel>
              <Switch colorScheme="whiteAlpha" isChecked={isEdit} onChange={toggleEdit} />
            </FormControl>
          )}
        </HStack>
      </Flex>

      {isEdit && !isGroupMode && (
        <Center>
          <Text fontSize="sm" opacity="0.8">
            {t('General.tip')}: {t('Lists.drag-and-drop-to-reorder-lists')}
          </Text>
        </Center>
      )}
      {!loading && (
        <Flex mt={5} gap={4} flexWrap="wrap" justifyContent={'center'}>
          {isEdit && (
            <SortableLists
              cardProps={{ matches }}
              lists={lists}
              ids={listsIds}
              listSelect={selectedLists}
              editMode={isEdit}
              activateSort={isEdit && !isGroupMode}
              onClick={selectItem}
              onSort={handleSort}
            />
          )}

          {isGroupMode &&
            listGroups.map(({ group, lists }) => (
              <Box key={group} width="100%" bg="blackAlpha.400" p={4} borderRadius="md">
                <Text fontSize="lg" fontWeight="bold" mb={2}>
                  {group}
                </Text>
                <Flex gap={4} flexWrap="wrap" justifyContent={'center'}>
                  {lists.map((list) => (
                    <UserListCard
                      canEdit={isOwner}
                      key={list.internal_id}
                      list={list}
                      isSelected={selectedLists.includes(list.internal_id)}
                      matches={matches}
                      refresh={refresh}
                    />
                  ))}
                </Flex>
              </Box>
            ))}

          {!isEdit &&
            !isGroupMode &&
            listsIds.map((id) => (
              <UserListCard
                canEdit={isOwner}
                key={id}
                list={lists[id]}
                isSelected={selectedLists.includes(id)}
                matches={matches}
                refresh={refresh}
              />
            ))}
        </Flex>
      )}
      {loading && (
        <Center mt={5}>
          <Spinner size="lg" />
        </Center>
      )}
    </Layout>
  );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { username } = context.query;
  if (!username || Array.isArray(username)) return { notFound: true };

  let user = null;

  try {
    const res = await CheckAuth((context.req ?? null) as any);
    user = res?.user;
  } catch (err) {}

  const owner = await getUser(username as string);
  if (!owner) return { notFound: true };

  const ownerAchiev = await getUserAchievements(owner);

  const props: Props = {
    owner,
    user: user,
    isOwner: user?.id === owner.id,
    achievements: ownerAchiev ?? [],
    messages: await loadTranslation(context.locale as string, 'lists/[username]/index'),
    locale: context.locale as string,
  };

  return {
    props,
  };
}

export default UserListsPage;
