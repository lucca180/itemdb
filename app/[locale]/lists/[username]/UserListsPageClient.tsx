'use client';

import {
  Box,
  Button,
  Center,
  Field,
  Flex,
  HStack,
  Separator,
  Switch,
  Text,
} from '@chakra-ui/react';
import { useToast } from '@utils/theme/toast';
import { SelectItemsCheckbox } from '@components/Input/SelectItemsCheckbox';
import { CreateListModalProps } from '@components/Modal/CreateListModal';
import { DeleteListModalProps } from '@components/Modal/DeleteListModal';
import { EditProfileModalProps } from '@components/Modal/EditProfileModal';
import { SortableListsProps } from '@components/Sortable/SortableLists';
import UserListCard from '@components/UserLists/ListCard';
import type { ProfileListMatches } from '@app/[locale]/lists/[username]/loadUserProfile';
import { useRouter } from '@i18n/navigation';
import type { User, UserList } from '@types';
import axios from 'axios';
import Color from 'color';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { FaTrash } from 'react-icons/fa';

const CreateListModal = dynamic<CreateListModalProps>(
  () => import('@components/Modal/CreateListModal'),
  { ssr: false }
);

const DeleteListModal = dynamic<DeleteListModalProps>(
  () => import('@components/Modal/DeleteListModal'),
  { ssr: false }
);

const EditProfileModal = dynamic<EditProfileModalProps>(
  () => import('@components/Modal/EditProfileModal'),
  { ssr: false }
);

const SortableLists = dynamic<SortableListsProps>(
  () => import('@components/Sortable/SortableLists'),
  {
    ssr: false,
  }
);

type ExtendedUserList = UserList & {
  hasChanged?: boolean;
};

type ListsEditState = {
  lists: { [list_id: number]: ExtendedUserList };
  listsIds: number[];
};

export type UserListsPageClientProps = {
  owner: User;
  viewer: User | null;
  isOwner: boolean;
  lists: UserList[];
  matches: ProfileListMatches;
  profileColor: string;
};

function buildListsState(lists: UserList[]): ListsEditState {
  const listsIds = lists.map((list) => list.internal_id);
  const listsMap: { [list_id: number]: ExtendedUserList } = {};

  lists.forEach((list) => {
    listsMap[list.internal_id] = list;
  });

  return { listsIds, lists: listsMap };
}

function groupUserLists(
  lists: { [list_id: number]: ExtendedUserList },
  listsIds: number[]
): { group: string; lists: ExtendedUserList[] }[] {
  const groups: { [key: string]: ExtendedUserList[] } = {};

  listsIds.forEach((id) => {
    const list = lists[id];
    if (!list) return;
    const groupTag = list.userTag ?? '';

    if (!groups[groupTag]) groups[groupTag] = [];
    groups[groupTag].push(list);
  });

  return Object.entries(groups)
    .map(([group, groupLists]) => ({
      group,
      lists: groupLists,
    }))
    .sort((a, b) => {
      if (a.group === '') return 1;
      if (b.group === '') return -1;
      return a.group.localeCompare(b.group);
    });
}

export function UserListsPageClient({
  owner,
  viewer,
  isOwner,
  lists: initialLists,
  matches,
  profileColor,
}: UserListsPageClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const toast = useToast();

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditProfileModal, setOpenEditProfileModal] = useState(false);
  const [selectedLists, setSelectedLists] = useState<number[]>([]);
  const [editState, setEditState] = useState<ListsEditState | null>(null);

  const listsFromProps = useMemo(() => buildListsState(initialLists), [initialLists]);
  const isEdit = editState !== null;
  const { lists, listsIds } = isEdit ? editState : listsFromProps;

  const color = Color(profileColor);
  const rgb = color.rgb().array();
  const isGroupMode = owner.profileMode === 'groups';
  const listGroups = useMemo(
    () => (isGroupMode ? groupUserLists(lists, listsIds) : []),
    [isGroupMode, lists, listsIds]
  );

  const handleRefresh = () => {
    setSelectedLists([]);
    setEditState(null);
    router.refresh();
  };

  const selectItem = (id: number) => {
    if (!isEdit) return;
    if (selectedLists.includes(id)) {
      setSelectedLists(selectedLists.filter((list) => list !== id));
    } else {
      setSelectedLists([...selectedLists, id]);
    }
  };

  const handleSelectCheckbox = (checkAll: boolean) => {
    if (checkAll) setSelectedLists(listsIds);
    else setSelectedLists([]);
  };

  const toggleEdit = () => {
    if (isEdit) {
      setSelectedLists([]);
      setEditState(null);
      return;
    }

    setEditState(buildListsState(initialLists));
  };

  const setHasChanges = () => {
    if (toast.isActive('unsavedChanges')) return;

    toast({
      title: t('General.you-have-unsaved-changes'),
      id: 'unsavedChanges',
      description: (
        <Button variant="solid" colorPalette="blackAlpha" onClick={handleSaveChanges} size="sm">
          {t('General.save-changes')}
        </Button>
      ),
      status: 'info',
      duration: Infinity,
    });
  };

  const handleSort = (newOrder: number[]) => {
    if (!editState) return;

    const newLists = { ...editState.lists };

    for (let i = 0; i < newOrder.length; i++) {
      if (newLists[newOrder[i]].order === i) continue;

      newLists[newOrder[i]].order = i;
      newLists[newOrder[i]].hasChanged = true;
      setHasChanges();
    }

    setEditState({ listsIds: newOrder, lists: newLists });
  };

  const handleSaveChanges = async () => {
    if (!editState || !viewer || !isOwner) return;

    toast.closeAll();

    const loadingToast = toast({
      id: 'user-lists-save-changes',
      title: `${t('General.saving-changes')}...`,
      status: 'loading',
      duration: Infinity,
    });

    try {
      const listsToSave = Object.values(editState.lists).filter((list) => list.hasChanged);
      const res = await axios.put(`/api/v1/lists/${viewer.username}`, { lists: listsToSave });

      if (res.data.success) {
        toast.update(loadingToast, {
          id: loadingToast,
          title: t('Feedback.changes-saved'),
          status: 'success',
          duration: 5000,
        });
        handleRefresh();
      }
    } catch (err) {
      console.error(err);

      toast.update(loadingToast, {
        id: loadingToast,
        title: t('General.an-error-occurred'),
        description: t('General.try-again-later'),
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <>
      {isOwner && (
        <>
          <CreateListModal
            isOpen={openCreateModal}
            onClose={() => setOpenCreateModal(false)}
            refresh={handleRefresh}
          />
          <EditProfileModal
            isOpen={openEditProfileModal}
            onClose={() => setOpenEditProfileModal(false)}
            refresh={handleRefresh}
          />
          <DeleteListModal
            username={owner.username!}
            selectedLists={selectedLists}
            isOpen={openDeleteModal}
            onClose={() => setOpenDeleteModal(false)}
            refresh={handleRefresh}
          />
        </>
      )}

      <Separator mt={5} />

      <Flex justifyContent="space-between" flexWrap="wrap" gap={3} alignItems="center" py={3}>
        <HStack>
          {isOwner && (
            <>
              <Button
                variant="subtle"
                colorPalette="whiteAlpha"
                onClick={() => setOpenCreateModal(true)}
              >
                + {t('Lists.new-list')}
              </Button>
              <Button
                variant="subtle"
                colorPalette="whiteAlpha"
                onClick={() => setOpenEditProfileModal(true)}
              >
                {t('Lists.edit-profile')}
              </Button>
            </>
          )}
          {!isEdit && (
            <Text as="div" color="gray.300" fontSize="sm">
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
                disabled={!selectedLists.length}
                colorPalette="red"
                variant="ghost"
                onClick={() => setOpenDeleteModal(true)}
              >
                <FaTrash />
                {t('General.delete')}
              </Button>
            </Flex>
          )}
        </HStack>
        <HStack flex="0 0 auto">
          {isOwner && (
            <Field.Root display="flex" alignItems="center">
              <Switch.Root
                colorPalette="whiteAlpha"
                checked={isEdit}
                onCheckedChange={toggleEdit}
                display="flex"
                alignItems="center"
              >
                <Switch.HiddenInput />
                <Switch.Label mb="0" color="gray.300" fontSize="sm">
                  {t('General.edit-mode')}
                </Switch.Label>
                <Switch.Control bg="whiteAlpha.400">
                  <Switch.Thumb bg="white" />
                </Switch.Control>
              </Switch.Root>
            </Field.Root>
          )}
        </HStack>
      </Flex>

      {isEdit && !isGroupMode && (
        <Center>
          <Text fontSize="sm" opacity={0.8}>
            {t('General.tip')}: {t('Lists.drag-and-drop-to-reorder-lists')}
          </Text>
        </Center>
      )}

      <Flex mt={5} gap={4} flexWrap="wrap" justifyContent="center">
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
          listGroups.map(({ group, lists: groupLists }) => (
            <Box key={group} width="100%" bg="blackAlpha.400" p={4} borderRadius="md">
              <Text fontSize="lg" fontWeight="bold" mb={2}>
                {group}
              </Text>
              <Flex gap={4} flexWrap="wrap" justifyContent="center">
                {groupLists.map((list) => (
                  <UserListCard
                    canEdit={isOwner}
                    key={list.internal_id}
                    list={list}
                    isSelected={selectedLists.includes(list.internal_id)}
                    matches={matches}
                    refresh={handleRefresh}
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
              refresh={handleRefresh}
            />
          ))}
      </Flex>
    </>
  );
}
