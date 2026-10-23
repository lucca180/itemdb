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
import {
  buildListsRows,
  buildListsState,
  type ListsEditState,
  useListsRowSize,
} from '@app/[locale]/lists/[username]/userListsRows';
import { useRouter } from '@i18n/navigation';
import type { User, UserList } from '@types';
import axios from 'axios';
import Color from 'color';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { ViewportList } from 'react-viewport-list';
import MainLink from '@components/Utils/MainLink';
import { canDeleteList } from '@utils/list/listPermissions';

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

export type UserListsPageClientProps = {
  owner: User;
  viewer: User | null;
  isOwner: boolean;
  lists: UserList[];
  matches: ProfileListMatches;
  profileColor: string;
};

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
  // group boxes add px={4} on each side
  const [rowsRef, rowSize] = useListsRowSize(isGroupMode ? 32 : 0);
  const listsRows = useMemo(
    () => buildListsRows(lists, listsIds, isGroupMode, rowSize),
    [lists, listsIds, isGroupMode, rowSize]
  );

  const handleRefresh = () => {
    setSelectedLists([]);
    setEditState(null);
    router.refresh();
  };

  // official lists can only be deleted by admins, so curators can't select them
  const deletableIds = useMemo(
    () =>
      listsIds.filter((id) =>
        canDeleteList({ official: lists[id].official, ownerId: lists[id].owner.id }, viewer)
      ),
    [listsIds, lists, viewer]
  );

  const selectItem = (id: number) => {
    if (!isEdit) return;

    if (!deletableIds.includes(id)) {
      if (toast.isActive('official-list-locked')) return;

      toast({
        id: 'official-list-locked',
        description: t.rich('Lists.official-curator-locked', {
          Feedback: (chunk) => (
            <MainLink href="/feedback" trackEvent="official-curator-feedback">
              <b>
                <u>{chunk}</u>
              </b>
            </MainLink>
          ),
        }),
        status: 'info',
        duration: 6000,
        isClosable: true,
      });
      return;
    }

    if (selectedLists.includes(id)) {
      setSelectedLists(selectedLists.filter((list) => list !== id));
    } else {
      setSelectedLists([...selectedLists, id]);
    }
  };

  const handleSelectCheckbox = (checkAll: boolean) => {
    if (checkAll) setSelectedLists(deletableIds);
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
                  allChecked={!!deletableIds.length && selectedLists.length === deletableIds.length}
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

      {isEdit && (
        <Flex mt={5} gap={4} flexWrap="wrap" justifyContent="center">
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
        </Flex>
      )}

      {(isGroupMode || !isEdit) && (
        <Flex ref={rowsRef} mt={5} flexFlow="column" gap={isGroupMode ? 0 : 4}>
          <ViewportList items={listsRows} viewportRef={null} initialPrerender={3} overscan={3}>
            {(row) => {
              if (row.type === 'group') {
                return (
                  <Box key={row.key} bg="blackAlpha.400" px={4} pt={4} pb={2} borderTopRadius="md">
                    <Text fontSize="lg" fontWeight="bold">
                      {row.group}
                    </Text>
                  </Box>
                );
              }

              // padding (not margin) between groups so ViewportList measures row heights right
              return (
                <Box key={row.key} pb={row.isLast ? 4 : undefined}>
                  <Flex
                    gap={4}
                    flexWrap="wrap"
                    justifyContent="center"
                    bg={row.inGroup ? 'blackAlpha.400' : undefined}
                    px={row.inGroup ? 4 : undefined}
                    pb={row.inGroup ? 4 : undefined}
                    borderBottomRadius={row.isLast ? 'md' : undefined}
                  >
                    {row.lists.map((list) => (
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
              );
            }}
          </ViewportList>
        </Flex>
      )}
    </>
  );
}
