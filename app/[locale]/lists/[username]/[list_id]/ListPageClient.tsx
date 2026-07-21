'use client';

import {
  Badge,
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Center,
  HStack,
  Field,
  Switch,
  IconButton,
  useDisclosure,
  Link,
  Kbd,
} from '@chakra-ui/react';
import type { ReactNode } from 'react';
import type { ListItemInfo, UserList } from '@types';
import ItemCardV2 from '@components/Items/v2/ItemCardV2';
import Color from 'color';
import { ItemActionModalProps } from '@components/Modal/ItemActionModal';
import { CreateListModalProps } from '@components/Modal/CreateListModal';
import dynamic from 'next/dynamic';
import ListHeader from '@components/UserLists/ListHeader';
import { CreateLinkedListButton } from '@components/DynamicLists/CreateLinkedList';
import { dynamicListCan } from '@utils/utils';
import { sortListItemsV2 } from '@utils/item/v2';
import { SearchList } from '@components/Search/SearchLists';
import { SortSelect } from '@components/Input/SortSelect';
import { SelectItemsCheckbox } from '@components/Input/SelectItemsCheckbox';
import { useTranslations } from 'next-intl';
import { BsFilter } from 'react-icons/bs';
import { SearchFilterModalProps } from '@components/Search/SearchFiltersModal';
import { defaultFilters } from '@utils/parseFilters';
import { AddListItemsModalProps } from '@components/Modal/AddListItemsModal';
import { ItemList } from '@components/UserLists/ItemList';
import { BiHelpCircle } from 'react-icons/bi';
import A11yTooltip from '@components/Utils/Tooltip';
import { useKeyboardShortcut } from '@utils/useKeyboardShortcut';
import type { ListItemsData, ListPageClientCore } from './listPage';
import { useListPageState } from './useListPageState';
import { ListFullItemsMergeProvider } from './listPageSuspenseMerge';

// Modals and heavy UI are client-only to avoid SSR/hydration issues with drag-and-drop.
const CreateListModal = dynamic<CreateListModalProps>(
  () => import('@components/Modal/CreateListModal'),
  { ssr: false }
);
const ItemActionModal = dynamic<ItemActionModalProps>(
  () => import('@components/Modal/ItemActionModal'),
  { ssr: false }
);
const SearchFilterModal = dynamic<SearchFilterModalProps>(
  () => import('@components/Search/SearchFiltersModal'),
  { ssr: false }
);
const AddListItemsModal = dynamic<AddListItemsModalProps>(
  () => import('@components/Modal/AddListItemsModal'),
  { ssr: false }
);
const SelectedItemsActionBar = dynamic(
  () =>
    import('@components/UserLists/SelectedItemsActionBar').then(
      (mod) => mod.SelectedItemsActionBar
    ),
  { ssr: false }
);
const UnsavedChangesActionBar = dynamic(
  () =>
    import('@components/UserLists/UnsavedChangesActionBar').then(
      (mod) => mod.UnsavedChangesActionBar
    ),
  { ssr: false }
);
const Markdown = dynamic(() => import('@components/Utils/Markdown'), { ssr: false });
const UserListCard = dynamic(() => import('@components/UserLists/ListCard'), { ssr: false });

export { ListFullItemsReceiver } from './listPageSuspenseMerge';

export function ItemGridSkeleton({ count }: { count: number }) {
  return (
    <Flex gap={3} justifyContent="center" wrap="wrap">
      {Array.from({ length: Math.min(40, count) }).map((_, i) => (
        <ItemCardV2 uniqueID="loading" key={i} isLoading />
      ))}
    </Flex>
  );
}

export type ListPageClientProps = {
  locale: string;
  username: string;
  listId: string;
  core: ListPageClientCore;
  useSuspenseFullLoad: boolean;
  initialPreload: ListItemsData;
  matches: ListItemInfo[];
  similarLists: UserList[];
  children?: ReactNode;
};

export function ListPageClient({
  locale,
  username,
  listId,
  core,
  useSuspenseFullLoad,
  initialPreload,
  matches,
  similarLists,
  children,
}: ListPageClientProps) {
  const t = useTranslations();
  const { open, onOpen, onClose } = useDisclosure();
  const { open: isOpenInsert, onOpen: onOpenInsert, onClose: onCloseInsert } = useDisclosure();

  const state = useListPageState({ locale, username, listId, core, initialPreload });

  const color = Color(state.list?.colorHex || '#4A5568');
  const rgb = color.rgb().array();

  useKeyboardShortcut('a', onOpenInsert, {
    enabled:
      state.canEdit &&
      !state.isEdit &&
      !state.isLoading &&
      !isOpenInsert &&
      !open &&
      !state.openCreateModal &&
      !state.selectionAction &&
      dynamicListCan(state.list, 'add'),
    altKey: false,
    ctrlKey: false,
    metaKey: false,
  });

  const openFiltersModal = async () => {
    await state.handleOpenFilters();
    onOpen();
  };

  const highlightIds = state.displayedItemInfoIds.filter(
    (id) => state.itemInfo[id].isHighlight && (!state.itemInfo[id].isHidden || state.isEdit)
  );

  // Keep Suspense children mounted during filter loads so the full-load receiver is not remounted.
  const showMainItemGrid = !state.isLoading || !!state.itemInfoIds.length || useSuspenseFullLoad;

  return (
    <ListFullItemsMergeProvider value={state.mergeContext}>
      {/* --- Modals (lazy, gated by open state) --- */}
      {open && (
        <SearchFilterModal
          isLists
          isOpen={open}
          onClose={onClose}
          filters={state.filters}
          stats={state.listStats}
          onChange={(nextFilters) => state.setFilters(nextFilters)}
          resetFilters={() => state.applyFilters(defaultFilters)}
          applyFilters={() => state.applyFilters()}
        />
      )}
      {state.openCreateModal && (
        <CreateListModal
          refresh={() => state.refreshList()}
          isOpen={state.openCreateModal}
          list={state.list}
          onClose={() => state.setOpenCreateModal(false)}
        />
      )}
      {!!state.selectionAction && (
        <ItemActionModal
          refresh={() => state.refreshList()}
          isOpen={!!state.selectionAction}
          onClose={() => state.setSelectionAction('')}
          selectedItems={state.selectedItems}
          action={state.selectionAction}
          list={state.list}
        />
      )}
      {isOpenInsert && (
        <AddListItemsModal isOpen={isOpenInsert} onClose={onCloseInsert} list={state.list} />
      )}

      <ListHeader
        list={state.list}
        canEdit={state.canEdit}
        color={color}
        items={state.items}
        itemInfo={state.itemInfo}
        isLoading={state.isLoading}
        setOpenCreateModal={state.setOpenCreateModal}
      />

      <Flex mt={5} gap={6} flexFlow="column">
        {/* --- Toolbar: add items, counts, filters, search, sort --- */}
        <Flex
          justifyContent="space-between"
          alignItems="center"
          gap={3}
          flexFlow={{ base: 'column-reverse', lg: 'row' }}
        >
          {!state.isEdit && (
            <HStack>
              {state.canEdit && dynamicListCan(state.list, 'add') && (
                <Button onClick={onOpenInsert} loading={state.isLoading}>
                  {t('Lists.add-items')}{' '}
                  <Kbd ml={2} fontSize="xs">
                    A
                  </Kbd>
                </Button>
              )}
              {(state.isOwner || state.list.official || state.list.canBeLinked) && (
                <CreateLinkedListButton list={state.list} isLoading={state.isLoading} />
              )}
              <HStack gap={1}>
                <Text as="div" color="gray.300" fontSize="sm">
                  {t('Lists.itemcount-items', { itemCount: state.qtyCount.visibleQty })}
                </Text>
                <A11yTooltip
                  position="right"
                  label={t.rich('Lists.itemcount-info-tooltip', {
                    br: () => <br />,
                    unique: state.qtyCount.visible,
                    hidden: state.qtyCount.hidden,
                    total: state.qtyCount.totalQty,
                  })}
                >
                  <IconButton aria-label="Item Count Info" size="xs" variant="ghost">
                    <BiHelpCircle />
                  </IconButton>
                </A11yTooltip>
              </HStack>
            </HStack>
          )}

          {state.isEdit && (
            <Flex gap={3} flexWrap="wrap" justifyContent="center">
              <Box bg={`rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.35)`} p={2} borderRadius="md">
                <SelectItemsCheckbox
                  checked={state.itemSelect}
                  allChecked={state.itemSelect.length === Object.values(state.itemInfo).length}
                  onClick={state.handleSelectCheckbox}
                />
              </Box>
            </Flex>
          )}

          <HStack
            flex="0 0 auto"
            minW={{ base: 'none', md: 400 }}
            justifyContent={['center', 'flex-end']}
            flexWrap="wrap"
          >
            <IconButton
              loading={state.isLoading}
              aria-label="search filters"
              onClick={openFiltersModal}
              colorPalette={state.isServerFiltered ? 'blue' : undefined}
            >
              <BsFilter />
            </IconButton>
            <SearchList
              disabled={state.isLoading}
              onChange={state.handleSearch}
              value={state.searchQuery}
            />
            {state.canEdit && (
              <Field.Root display="flex" alignItems="center" justifyContent="center" w="auto">
                <Switch.Root
                  colorPalette="whiteAlpha"
                  checked={state.isEdit}
                  onCheckedChange={state.toggleEdit}
                  display="flex"
                  alignItems="center"
                  disabled={state.isLoading}
                >
                  <Switch.HiddenInput />
                  <Switch.Label mb="0" color="gray.300" fontSize="sm">
                    {t('General.edit-mode')}
                  </Switch.Label>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </Field.Root>
            )}
            <HStack>
              <Text
                flex="0 0 auto"
                color="gray.300"
                fontSize="sm"
                display={{ base: 'none', md: 'inherit' }}
              >
                {t('General.sort-by')}
              </Text>
              <SortSelect
                sortTypes={state.sortTypes}
                sortBy={state.sortInfo.sortBy}
                onClick={state.handleSortChange}
                sortDir={state.sortInfo.sortDir as 'asc' | 'desc'}
                disabled={state.isLoading}
              />
            </HStack>
          </HStack>
        </Flex>

        {!state.isEdit && state.canEdit && (
          <Text
            textAlign="center"
            fontSize="xs"
            color="gray.400"
            display={{ base: 'none', md: 'inline' }}
          >
            {t('General.tip')}: {t('Lists.user-list-tip-1')}
          </Text>
        )}
        {state.isStampList && (
          <Text
            textAlign="center"
            fontSize="xs"
            color="gray.400"
            display={{ base: 'none', md: 'inline' }}
          >
            {t('General.tip')}:{' '}
            {t.rich('Lists.stamp-script-tip', {
              Link: (chunk) => (
                <Link
                  color="gray.200"
                  href="/articles/userscripts"
                  target="_blank"
                  rel="noreferrer"
                >
                  {chunk}
                </Link>
              ),
            })}
          </Text>
        )}

        {/* Drag-sort is only available in custom sort without active filters/search. */}
        {state.isEdit && state.sortInfo.sortBy === 'custom' && (
          <Flex flexFlow="column" gap={2}>
            {state.hasListViewFilter && (
              <Text textAlign="center" fontSize="xs" color="orange.300">
                {t('Lists.drag-sort-disabled-filter')}
              </Text>
            )}
            <Center>
              <Field.Root display="flex" alignItems="center" justifyContent="center">
                <Switch.Root
                  colorPalette="whiteAlpha"
                  checked={state.lockSort}
                  disabled={state.hasListViewFilter}
                  onCheckedChange={() => state.setLockSort(!state.lockSort)}
                  display="flex"
                  alignItems="center"
                >
                  <Switch.HiddenInput />
                  <Switch.Label mb="0" color="gray.300">
                    {t('Lists.lock-sort')}
                  </Switch.Label>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </Field.Root>
            </Center>
          </Flex>
        )}

        {/* --- Trade matches (seek/have overlap with logged-in user) --- */}
        {matches.length > 0 && (
          <Flex flexFlow="column" gap={3} bg="blackAlpha.400" p={4} borderRadius="md">
            <Box>
              <Heading size="md">
                {t.rich('Lists.you-plus-list', {
                  Badge: (chunk) => (
                    <Badge fontSize={0} verticalAlign="middle">
                      {chunk}
                    </Badge>
                  ),
                  matches: matches.length,
                  listName: state.list.name,
                })}
              </Heading>
              <Text color="gray.400" fontSize="sm">
                {!state.list.official && state.list.purpose === 'trading'
                  ? t('Lists.aka-seek')
                  : t('Lists.aka-have')}
              </Text>
            </Box>
            <Flex gap={3} flexWrap="wrap" w="100%" justifyContent="center">
              {[...matches]
                .sort((a, b) =>
                  sortListItemsV2(a, b, state.sortInfo.sortBy, state.sortInfo.sortDir, state.items)
                )
                .map((itemMatch) => (
                  <ItemCardV2
                    small
                    uniqueID="list-match"
                    item={state.items[itemMatch.item_iid]}
                    key={itemMatch.item_iid}
                    capValue={itemMatch.capValue}
                    quantity={itemMatch.amount}
                  />
                ))}
            </Flex>
          </Flex>
        )}

        {/* --- Highlight section (pinned items) --- */}
        {highlightIds.length > 0 && (
          <Flex
            gap={3}
            flexFlow="column"
            p={3}
            bg="blackAlpha.500"
            borderRadius="md"
            boxShadow="sm"
          >
            <Center flexFlow="column">
              <Flex
                mb={3}
                alignItems="center"
                gap={1}
                flexWrap="wrap"
                justifyContent="center"
                textAlign="center"
                flexFlow="column"
              >
                <Heading size="lg">
                  {state.list.highlight
                    ? state.list.highlight
                    : state.list.official
                      ? t('Lists.exclusives')
                      : t('Lists.highlights')}
                </Heading>
                {state.list.highlightText && (
                  <Text as="div" fontSize="sm" color="whiteAlpha.800">
                    <Markdown>{state.list.highlightText}</Markdown>
                  </Text>
                )}
              </Flex>
              {state.isEdit && (
                <Text fontSize="xs" fontStyle="italic">
                  {t('Lists.highlights-text')}
                </Text>
              )}
            </Center>
            <Flex px={[1, 3]} flexFlow="column">
              <ItemList
                onClick={state.selectItem}
                ids={highlightIds.sort((a, b) =>
                  state.items[state.itemInfo[a].item_iid]?.name?.localeCompare(
                    state.items[state.itemInfo[b].item_iid]?.name ?? ''
                  )
                )}
                list={state.list}
                itemInfo={state.itemInfo}
                items={state.items}
                itemSelect={state.itemSelect}
                editMode={state.isEdit}
                activateSort={false}
                onSort={state.handleSort}
                onChange={state.handleItemInfoChange}
                onListAction={state.canEdit ? state.cntxAction : undefined}
              />
            </Flex>
          </Flex>
        )}

        {/* Full-grid skeleton when async load cleared rows (e.g. filter apply). */}
        {state.isLoading && !state.itemInfoIds.length && (
          <Flex gap={3} justifyContent="center" wrap="wrap">
            {Array.from({ length: Math.min(8 * 5, state.list.itemCount ?? 40) }).map((_, i) => (
              <ItemCardV2 uniqueID="loading" key={i} isLoading />
            ))}
          </Flex>
        )}

        {/* Tier 2 Suspense slot ({children}) + main item grid. */}
        {showMainItemGrid && (
          <Flex flexFlow="column">
            {children}
            <ItemList
              list={state.list}
              sortType={state.sortInfo.sortBy}
              onClick={state.selectItem}
              ids={state.mainItemIds}
              itemInfo={state.itemInfo}
              items={state.items}
              itemSelect={state.itemSelect}
              editMode={state.isEdit}
              activateSort={state.isEdit && !state.lockSort && !state.hasListViewFilter}
              onSort={state.handleSort}
              onChange={state.handleItemInfoChange}
              onListAction={state.canEdit ? state.cntxAction : undefined}
            />
          </Flex>
        )}
      </Flex>

      {similarLists.length > 0 && (
        <Flex flexFlow="column" mt={10} gap={3} p={5} borderRadius="lg" bg="blackAlpha.500">
          <Heading size="lg">{t('Lists.similar-lists')}</Heading>
          <Flex gap={5} flexWrap="wrap" justifyContent="center">
            {similarLists.map((similarList) => (
              <UserListCard
                isSmall
                key={similarList.internal_id}
                list={similarList}
                utm_content="similar-lists"
              />
            ))}
          </Flex>
        </Flex>
      )}

      {state.isEdit && state.itemSelect.length > 0 && (
        <SelectedItemsActionBar
          selectedItems={state.selectedItems}
          totalItems={Object.values(state.itemInfo).length}
          canRemove={dynamicListCan(state.list, 'remove')}
          onSelectItems={state.handleSelectCheckbox}
          onClearSelection={() => state.setItemSelect([])}
          onToggleField={state.handleSelectedItemsBulkChange}
          onAction={state.setSelectionAction}
        />
      )}
      {state.hasChanges && (
        <UnsavedChangesActionBar
          open={state.hasChanges}
          offsetBottom={state.isEdit && state.itemSelect.length > 0}
          onCancel={() => state.refreshList()}
          onSave={state.saveChanges}
        />
      )}
    </ListFullItemsMergeProvider>
  );
}
