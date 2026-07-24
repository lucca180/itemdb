'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { UTCDate } from '@date-fns/utc';
import { useFormatter } from 'next-intl';
import {
  Alert,
  Badge,
  Box,
  Button,
  Center,
  CloseButton,
  Dialog,
  Field,
  Flex,
  Heading,
  Image,
  Input,
  NativeSelect,
  Portal,
  SimpleGrid,
  Stack,
  Switch,
  Tabs,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { LuListPlus, LuPencil, LuPlus, LuRefreshCw, LuSave, LuTrash2, LuX } from 'react-icons/lu';
import ItemSelect from '@components/Input/ItemSelect';
import ListInput, { ListInputOption } from '@components/Input/ListInput';
import Markdown from '@components/Utils/Markdown';
import { useToast } from '@utils/theme/toast';
import { PriceTableView } from '@app/_components/Item/Price/PriceTable';
import type { ItemData, PriceData, PriceMarker } from '@types';
import type { PriceContextDropPool } from '@app/api/admin/price-context/priceContextShared';
import {
  MARKER_COLOR_PATTERN,
  MAX_MARKER_BADGE_LENGTH,
  MAX_MARKER_DESCRIPTION_LENGTH,
  MAX_MARKER_TITLE_LENGTH,
  type ManualMarkerAdminDTO,
  type ManualMarkerSourceResponse,
} from '@app/api/admin/price-markers/priceMarkersShared';

type DropPoolsResponse = { pools: PriceContextDropPool[]; count: number };
type MarkersResponse = { markers: ManualMarkerAdminDTO[]; count: number };

const DEFAULT_COLOR = '#8f5573';

type FormState = {
  title: string;
  badgeText: string;
  /** When true, persist badgeText as null (auto translated presets). */
  badgeAuto: boolean;
  description: string;
  color: string;
  startAt: string;
  endAt: string;
  isPoint: boolean;
};

const EMPTY_FORM: FormState = {
  title: '',
  badgeText: '',
  badgeAuto: true,
  description: '',
  color: DEFAULT_COLOR,
  startAt: '',
  endAt: '',
  isPoint: false,
};

const PREVIEW_T = (key: string) => {
  const labels: Record<string, string> = {
    'ItemPage.added-to': 'Added to',
    'ItemPage.available-at': 'Available At',
    'ItemPage.unavailable-at': 'Unavailable At',
  };
  return labels[key] ?? key;
};

export function PriceMarkersClient() {
  const toast = useToast();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [itemsById, setItemsById] = useState<Record<number, ItemData>>({});

  const [selectedList, setSelectedList] = useState<ListInputOption | null>(null);
  const [listId, setListId] = useState('');
  const [parentItem, setParentItem] = useState<ItemData | null>(null);
  const [prizePool, setPrizePool] = useState('');
  const [dropPools, setDropPools] = useState<PriceContextDropPool[]>([]);
  const [bulkItemsText, setBulkItemsText] = useState('');
  const [bulkNotFound, setBulkNotFound] = useState<string[]>([]);
  const [isLoadingSource, setIsLoadingSource] = useState(false);
  const [isLoadingPools, setIsLoadingPools] = useState(false);

  const [markers, setMarkers] = useState<ManualMarkerAdminDTO[]>([]);
  const [isLoadingMarkers, setIsLoadingMarkers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManualMarkerAdminDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedItems = useMemo(
    () => Object.values(itemsById).sort((a, b) => a.name.localeCompare(b.name)),
    [itemsById]
  );
  const itemIds = selectedItems.map((item) => item.internal_id);

  const previewMarker = useMemo<PriceMarker | null>(() => {
    const title = form.title.trim() || null;
    const description = form.description.trim() || null;
    // Auto → null; custom empty input → ""; custom filled → string
    const badgeText = form.badgeAuto ? null : form.badgeText.trim();
    // Auto badge alone is not enough — need title and/or description too.
    const hasLabel = !!title || !!description || !!badgeText;
    if (!form.startAt || !hasLabel) return null;
    return {
      id: 'preview',
      type: 'manual',
      title,
      badgeText,
      description,
      color: form.color,
      // Match API date-only → 18:00 UTC so LA calendar days align with persisted markers.
      startAt: normalizePreviewDate(form.startAt),
      endAt: form.isPoint || !form.endAt ? null : normalizePreviewDate(form.endAt),
      isPoint: form.isPoint,
    };
  }, [form]);

  const loadMarkers = useCallback(async () => {
    setIsLoadingMarkers(true);
    try {
      const res = await axios.get<MarkersResponse>('/api/admin/price-markers');
      setMarkers(res.data.markers);
    } catch {
      toast({
        id: 'price-markers-load-error',
        title: 'Unable to load markers.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingMarkers(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadMarkers();
  }, [loadMarkers]);

  const addItems = (items: ItemData[]) => {
    setItemsById((prev) => {
      const next = { ...prev };
      for (const item of items) next[item.internal_id] = item;
      return next;
    });
  };

  const removeItem = (itemId: number) => {
    setItemsById((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const clearItems = () => setItemsById({});

  const loadListItems = async () => {
    if (!selectedList && !listId.trim()) return;
    setIsLoadingSource(true);
    const prom = axios.post<ManualMarkerSourceResponse>('/api/admin/price-context/source', {
      source: 'list',
      listId: listId.trim() ? Number(listId) : undefined,
      selectedList: selectedList?.list,
    });
    toast.promise(prom, {
      loading: { id: 'price-markers-list-loading', title: 'Loading list items...' },
      success: { id: 'price-markers-list-success', title: 'List items loaded.' },
      error: { id: 'price-markers-list-error', title: 'Unable to load list items.' },
    });
    try {
      const res = await prom;
      addItems(res.data.items);
    } finally {
      setIsLoadingSource(false);
    }
  };

  const loadDropItems = async () => {
    if (!parentItem) return;
    setIsLoadingSource(true);
    const prom = axios.post<ManualMarkerSourceResponse>('/api/admin/price-context/source', {
      source: 'drops',
      parentItemId: parentItem.internal_id,
      prizePool: prizePool.trim() || undefined,
    });
    toast.promise(prom, {
      loading: { id: 'price-markers-drops-loading', title: 'Loading drop items...' },
      success: { id: 'price-markers-drops-success', title: 'Drop items loaded.' },
      error: { id: 'price-markers-drops-error', title: 'Unable to load drop items.' },
    });
    try {
      const res = await prom;
      addItems(res.data.items);
    } finally {
      setIsLoadingSource(false);
    }
  };

  const loadBulkItems = async () => {
    if (!bulkItemsText.trim()) return;
    setIsLoadingSource(true);
    setBulkNotFound([]);
    try {
      const res = await axios.post<ManualMarkerSourceResponse>('/api/admin/price-context/source', {
        source: 'bulk',
        text: bulkItemsText,
      });
      addItems(res.data.items);
      setBulkNotFound(res.data.notFound ?? []);
    } catch {
      toast({
        id: 'price-markers-bulk-error',
        title: 'Unable to load items.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingSource(false);
    }
  };

  const loadDropPools = async (item: ItemData) => {
    setParentItem(item);
    setPrizePool('');
    setDropPools([]);
    setIsLoadingPools(true);
    try {
      const res = await axios.post<DropPoolsResponse>('/api/admin/price-context/source', {
        source: 'dropPools',
        parentItemId: item.internal_id,
      });
      setDropPools(res.data.pools);
    } catch {
      toast({
        id: 'price-markers-pools-error',
        title: 'Unable to load drop pools.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingPools(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    clearItems();
  };

  const startEditing = (marker: ManualMarkerAdminDTO) => {
    setEditingId(marker.internal_id);
    setForm({
      title: marker.title ?? '',
      badgeText: marker.badgeText ?? '',
      badgeAuto: marker.badgeText === null,
      description: marker.description ?? '',
      color: marker.color,
      startAt: marker.startAt.slice(0, 10),
      endAt: marker.endAt ? marker.endAt.slice(0, 10) : '',
      isPoint: marker.isPoint,
    });
    setItemsById(
      Object.fromEntries(
        marker.items.map((item) => [
          item.internal_id,
          {
            internal_id: item.internal_id,
            name: item.name,
            image: item.image,
          } as ItemData,
        ])
      )
    );
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasLabel =
    !!form.title.trim() ||
    !!form.description.trim() ||
    (!form.badgeAuto && !!form.badgeText.trim());
  const canSubmit =
    hasLabel &&
    !!form.startAt &&
    MARKER_COLOR_PATTERN.test(form.color) &&
    !!itemIds.length &&
    (form.isPoint || !form.endAt || new Date(form.endAt) >= new Date(form.startAt));

  const submit = async () => {
    if (!canSubmit) return;
    setIsSaving(true);

    const payload = {
      title: form.title.trim() || null,
      // Auto → null; empty custom input → "" (hide badge); otherwise custom copy
      badgeText: form.badgeAuto ? null : form.badgeText.trim(),
      description: form.description.trim() || null,
      color: form.color,
      startAt: form.startAt,
      // Point markers have no range.
      endAt: form.isPoint ? null : form.endAt || null,
      isPoint: form.isPoint,
      itemIds,
    };

    const prom = editingId
      ? axios.patch(`/api/admin/price-markers/${editingId}`, payload)
      : axios.post('/api/admin/price-markers/create', payload);

    toast.promise(prom, {
      loading: {
        id: 'price-markers-save-loading',
        title: editingId ? 'Updating marker...' : 'Creating marker...',
      },
      success: {
        id: 'price-markers-save-success',
        title: editingId ? 'Marker updated.' : 'Marker created.',
      },
      error: { id: 'price-markers-save-error', title: 'Unable to save marker.' },
    });

    try {
      await prom;
      resetForm();
      await loadMarkers();
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMarker = async (marker: ManualMarkerAdminDTO) => {
    setIsDeleting(true);
    const prom = axios.delete(`/api/admin/price-markers/${marker.internal_id}`);
    toast.promise(prom, {
      loading: { id: 'price-markers-delete-loading', title: 'Deleting marker...' },
      success: { id: 'price-markers-delete-success', title: 'Marker deleted.' },
      error: { id: 'price-markers-delete-error', title: 'Unable to delete marker.' },
    });
    try {
      await prom;
      if (editingId === marker.internal_id) resetForm();
      setDeleteTarget(null);
      await loadMarkers();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SimpleGrid columns={{ base: 1, xl: 2 }} gap={8} alignItems="start">
      <Stack gap={5}>
        <Box bg="blackAlpha.400" borderRadius="md" p={4}>
          <Flex justifyContent="space-between" alignItems="center" mb={4} gap={3} wrap="wrap">
            <Heading size="sm">{editingId ? `Editing marker #${editingId}` : 'New marker'}</Heading>
            {editingId && (
              <Button size="xs" variant="ghost" colorPalette="gray" onClick={resetForm}>
                <LuX />
                Cancel edit
              </Button>
            )}
          </Flex>
          <Stack gap={4}>
            <Field.Root>
              <Field.Label>Title (markdown)</Field.Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Marker title shown under the badge"
                variant="subtle"
                bg="whiteAlpha.50"
                maxLength={MAX_MARKER_TITLE_LENGTH}
              />
              <Field.HelperText>
                Supports markdown. At least one of title, description, or custom badge text is
                required (auto badge alone is not enough).
              </Field.HelperText>
            </Field.Root>
            <Field.Root>
              <Field.Label>Badge</Field.Label>
              <Stack gap={3}>
                <Switch.Root
                  checked={form.badgeAuto}
                  onCheckedChange={(details) =>
                    setForm((prev) => ({ ...prev, badgeAuto: details.checked }))
                  }
                  colorPalette="pink"
                >
                  <Switch.HiddenInput />
                  <Switch.Control />
                  <Switch.Label>
                    Use translated presets (Added to / Available at / Unavailable at)
                  </Switch.Label>
                </Switch.Root>
                <Input
                  value={form.badgeText}
                  onChange={(e) => setForm((prev) => ({ ...prev, badgeText: e.target.value }))}
                  placeholder="Custom badge text"
                  variant="subtle"
                  bg="whiteAlpha.50"
                  maxLength={MAX_MARKER_BADGE_LENGTH}
                  disabled={form.badgeAuto}
                />
                <Field.HelperText>
                  {form.badgeAuto
                    ? 'Badge text is saved as null and resolved per locale like official lists.'
                    : 'Leave empty to hide the badge (saves as an empty string).'}
                </Field.HelperText>
              </Stack>
            </Field.Root>
            <Field.Root>
              <Field.Label>Description (markdown)</Field.Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional context shown under the marker"
                variant="subtle"
                bg="whiteAlpha.50"
                minH="90px"
                maxLength={MAX_MARKER_DESCRIPTION_LENGTH}
              />
              <Field.HelperText>
                {form.description.length}/{MAX_MARKER_DESCRIPTION_LENGTH} characters
              </Field.HelperText>
            </Field.Root>
            <Field.Root required invalid={!!form.color && !MARKER_COLOR_PATTERN.test(form.color)}>
              <Field.Label>Color</Field.Label>
              <Flex gap={3} alignItems="center" w="100%">
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(form.color) ? form.color : form.color.slice(0, 7)}
                  onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                  style={{
                    width: 42,
                    height: 38,
                    borderRadius: 6,
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                />
                <Input
                  value={form.color}
                  onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                  placeholder="#aabbcc"
                  variant="subtle"
                  bg="whiteAlpha.50"
                  maxW="160px"
                />
              </Flex>
              <Field.ErrorText>Expected hex like #aabbcc or #aabbccdd</Field.ErrorText>
            </Field.Root>
            <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
              <Field.Root required>
                <Field.Label>Start date</Field.Label>
                <Input
                  type="date"
                  value={form.startAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, startAt: e.target.value }))}
                  variant="subtle"
                  bg="whiteAlpha.50"
                />
              </Field.Root>
              <Field.Root
                disabled={form.isPoint}
                invalid={
                  !form.isPoint &&
                  !!form.endAt &&
                  !!form.startAt &&
                  new Date(form.endAt) < new Date(form.startAt)
                }
              >
                <Field.Label>End date</Field.Label>
                <Input
                  type="date"
                  value={form.isPoint ? '' : form.endAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, endAt: e.target.value }))}
                  variant="subtle"
                  bg="whiteAlpha.50"
                  disabled={form.isPoint}
                />
                {form.isPoint ? (
                  <Field.HelperText>
                    Single point markers are saved without an end date.
                  </Field.HelperText>
                ) : (
                  <Field.ErrorText>End date must be after start date</Field.ErrorText>
                )}
              </Field.Root>
            </SimpleGrid>
            <Switch.Root
              checked={form.isPoint}
              onCheckedChange={(details) =>
                setForm((prev) => ({
                  ...prev,
                  isPoint: details.checked,
                  endAt: details.checked ? '' : prev.endAt,
                }))
              }
              colorPalette="purple"
            >
              <Switch.HiddenInput />
              <Switch.Control />
              <Switch.Label>Single point (event) — render as one chart point</Switch.Label>
            </Switch.Root>
          </Stack>
        </Box>

        <Box bg="blackAlpha.400" borderRadius="md" p={4}>
          <Heading size="sm" mb={4}>
            Items
          </Heading>
          <Tabs.Root defaultValue="manual" variant="line" colorPalette="pink">
            <Tabs.List>
              <Tabs.Trigger value="manual">Manual</Tabs.Trigger>
              <Tabs.Trigger value="paste">Paste</Tabs.Trigger>
              <Tabs.Trigger value="lists">Lists</Tabs.Trigger>
              <Tabs.Trigger value="drops">Drops</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="manual" pt={5}>
              <Field.Root>
                <Field.Label>Item</Field.Label>
                <ItemSelect onChange={(item) => addItems([item])} placeholder="Add item" />
              </Field.Root>
            </Tabs.Content>
            <Tabs.Content value="paste" pt={5}>
              <Stack gap={4}>
                <Field.Root>
                  <Field.Label>Items</Field.Label>
                  <Textarea
                    value={bulkItemsText}
                    onChange={(e) => {
                      setBulkItemsText(e.target.value);
                      setBulkNotFound([]);
                    }}
                    placeholder={'101, 102, 103\nAlpha\nBeta'}
                    variant="subtle"
                    bg="whiteAlpha.50"
                    minH="120px"
                  />
                  <Field.HelperText>
                    One item per line or comma-separated. Use internal IDs or exact item names.
                  </Field.HelperText>
                </Field.Root>
                <Button
                  alignSelf="flex-start"
                  colorPalette="pink"
                  onClick={loadBulkItems}
                  loading={isLoadingSource}
                  disabled={!bulkItemsText.trim()}
                >
                  <LuListPlus />
                  Add items
                </Button>
                {!!bulkNotFound.length && (
                  <Alert.Root status="warning" variant="subtle">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>
                        {bulkNotFound.length} item{bulkNotFound.length === 1 ? '' : 's'} not found
                      </Alert.Title>
                      <Alert.Description fontSize="sm">{bulkNotFound.join(', ')}</Alert.Description>
                    </Alert.Content>
                  </Alert.Root>
                )}
              </Stack>
            </Tabs.Content>
            <Tabs.Content value="lists" pt={5}>
              <Stack gap={4}>
                <Field.Root>
                  <Field.Label>Search lists</Field.Label>
                  <ListInput
                    onChange={setSelectedList}
                    placeholder="Search official or user lists"
                  />
                  {selectedList && (
                    <Field.HelperText>
                      Selected: {selectedList.list.name} #{selectedList.list.internal_id}
                    </Field.HelperText>
                  )}
                </Field.Root>
                <Field.Root>
                  <Field.Label>List ID</Field.Label>
                  <Input
                    value={listId}
                    onChange={(e) => setListId(e.target.value)}
                    placeholder="Optional direct list_id"
                    variant="subtle"
                    bg="whiteAlpha.50"
                  />
                </Field.Root>
                <Button
                  alignSelf="flex-start"
                  colorPalette="pink"
                  onClick={loadListItems}
                  loading={isLoadingSource}
                  disabled={!selectedList && !listId.trim()}
                >
                  <LuListPlus />
                  Load list items
                </Button>
              </Stack>
            </Tabs.Content>
            <Tabs.Content value="drops" pt={5}>
              <Stack gap={4}>
                <Field.Root>
                  <Field.Label>Parent item</Field.Label>
                  <ItemSelect onChange={loadDropPools} placeholder="Select openable item" />
                  {parentItem && (
                    <Field.HelperText>
                      Selected: {parentItem.name} #{parentItem.internal_id}
                    </Field.HelperText>
                  )}
                </Field.Root>
                <Field.Root>
                  <Field.Label>Prize pool</Field.Label>
                  <NativeSelect.Root disabled={!parentItem || isLoadingPools}>
                    <NativeSelect.Field
                      value={prizePool}
                      onChange={(e) => setPrizePool(e.target.value)}
                      bg="blackAlpha.300"
                    >
                      <option value="">
                        {isLoadingPools ? 'Loading pools...' : 'All calculated pools'}
                      </option>
                      {dropPools.map((pool) => (
                        <option key={pool.name} value={pool.name}>
                          {pool.name} ({pool.itemCount} items)
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>
                <Button
                  alignSelf="flex-start"
                  colorPalette="pink"
                  onClick={loadDropItems}
                  loading={isLoadingSource}
                  disabled={!parentItem}
                >
                  <LuListPlus />
                  Load drop items
                </Button>
              </Stack>
            </Tabs.Content>
          </Tabs.Root>

          <Flex justifyContent="space-between" alignItems="center" mt={5} mb={3} gap={3}>
            <Text fontSize="sm" color="gray.400">
              {selectedItems.length} item{selectedItems.length === 1 ? '' : 's'} selected
            </Text>
            {!!selectedItems.length && (
              <Button size="xs" variant="ghost" colorPalette="red" onClick={clearItems}>
                <LuTrash2 />
                Clear items
              </Button>
            )}
          </Flex>
          {!selectedItems.length ? (
            <Center minH="120px" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="md">
              <Text color="gray.400">No items selected</Text>
            </Center>
          ) : (
            <Stack gap={2} maxH="260px" overflowY="auto" pr={2}>
              {selectedItems.map((item) => (
                <SelectedItemRow key={item.internal_id} item={item} onRemove={removeItem} />
              ))}
            </Stack>
          )}
        </Box>

        <Flex gap={3} wrap="wrap">
          <Button colorPalette="pink" onClick={submit} loading={isSaving} disabled={!canSubmit}>
            {editingId ? <LuSave /> : <LuPlus />}
            {editingId ? 'Update marker' : 'Create marker'}
          </Button>
          {editingId && (
            <Button variant="outline" colorPalette="gray" onClick={resetForm} disabled={isSaving}>
              <LuX />
              Cancel
            </Button>
          )}
        </Flex>
      </Stack>

      <Stack gap={5}>
        <Box bg="blackAlpha.400" borderRadius="md" p={4}>
          <Heading size="sm" mb={1}>
            Preview
          </Heading>
          <Text fontSize="sm" color="gray.400" mb={4}>
            Mock price history — only the marker rows reflect the form.
          </Text>
          <MarkerPreviewTable marker={previewMarker} itemColor={form.color} />
        </Box>

        <Box bg="blackAlpha.400" borderRadius="md" p={4}>
          <Flex justifyContent="space-between" alignItems="center" gap={3} mb={4}>
            <Box>
              <Heading size="sm">Existing markers</Heading>
              <Text fontSize="sm" color="gray.400">
                {markers.length} marker{markers.length === 1 ? '' : 's'}
              </Text>
            </Box>
            <Button
              size="sm"
              variant="ghost"
              colorPalette="gray"
              onClick={loadMarkers}
              loading={isLoadingMarkers}
            >
              <LuRefreshCw />
              Refresh
            </Button>
          </Flex>
          {!markers.length ? (
            <Center minH="160px" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="md">
              <Text color="gray.400">No manual markers yet</Text>
            </Center>
          ) : (
            <Stack gap={3} maxH="520px" overflowY="auto" pr={2}>
              {markers.map((marker) => (
                <ExistingMarkerRow
                  key={marker.internal_id}
                  marker={marker}
                  isEditing={editingId === marker.internal_id}
                  onEdit={() => startEditing(marker)}
                  onDelete={() => setDeleteTarget(marker)}
                />
              ))}
            </Stack>
          )}
        </Box>
      </Stack>

      <DeleteMarkerDialog
        marker={deleteTarget}
        isDeleting={isDeleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteMarker}
      />
    </SimpleGrid>
  );
}

function daysMs(days: number) {
  return days * 86_400_000;
}

/** Same convention as admin API / list series dates: date-only → 18:00 UTC. */
function normalizePreviewDate(value: string): string {
  return new UTCDate(new UTCDate(value).setHours(18)).toJSON();
}

/**
 * Builds mock price history around the marker dates so the preview shows
 * entries before / during / after the marker (range or single point).
 */
function buildMockPrices(marker: PriceMarker | null): PriceData[] {
  if (!marker) {
    const now = Date.now();
    return [
      {
        price_id: 1,
        value: 1200,
        addedAt: new Date(now - daysMs(5)).toJSON(),
        inflated: false,
        isLatest: true,
      },
      {
        price_id: 2,
        value: 950,
        addedAt: new Date(now - daysMs(20)).toJSON(),
        inflated: false,
        isLatest: false,
      },
      {
        price_id: 3,
        value: 800,
        addedAt: new Date(now - daysMs(40)).toJSON(),
        inflated: false,
        isLatest: false,
      },
    ];
  }

  const start = new Date(marker.startAt).getTime();
  const end = marker.endAt ? new Date(marker.endAt).getTime() : null;
  const values = [1250, 980, 1420, 760, 1100, 890];
  const timestamps: number[] = [];

  // Before the marker
  timestamps.push(start - daysMs(21), start - daysMs(7));

  if (end && end > start) {
    // During the range — midpoints between start and end
    const span = end - start;
    timestamps.push(start + span * 0.25, start + span * 0.75);
    // After the marker
    timestamps.push(end + daysMs(7), end + daysMs(21));
  } else {
    // Single point / open-ended — entries near and after start
    timestamps.push(start + daysMs(1), start + daysMs(14), start + daysMs(28));
  }

  // Newest first so isLatest lands on the most recent mock price
  timestamps.sort((a, b) => b - a);

  return timestamps.map((ts, index) => ({
    price_id: index + 1,
    value: values[index % values.length],
    addedAt: new Date(ts).toJSON(),
    inflated: false,
    isLatest: index === 0,
  }));
}

function MarkerPreviewTable({
  marker,
  itemColor,
}: {
  marker: PriceMarker | null;
  itemColor: string;
}) {
  const format = useFormatter();
  const mockPrices = useMemo(() => buildMockPrices(marker), [marker]);

  return (
    <PriceTableView
      data={mockPrices}
      markers={marker ? [marker] : []}
      itemColor={MARKER_COLOR_PATTERN.test(itemColor) ? itemColor : DEFAULT_COLOR}
      t={PREVIEW_T}
      format={format}
      maxH="360px"
    />
  );
}

function SelectedItemRow({ item, onRemove }: { item: ItemData; onRemove: (id: number) => void }) {
  return (
    <Flex alignItems="center" gap={3} bg="whiteAlpha.100" borderRadius="md" p={2} minH="56px">
      {item.image && (
        <Image src={item.image} alt={item.name} boxSize="40px" objectFit="contain" flexShrink={0} />
      )}
      <Box minW={0} flex={1}>
        <Text fontWeight="medium" truncate>
          {item.name}
        </Text>
        <Text fontSize="xs" color="gray.400">
          #{item.internal_id}
        </Text>
      </Box>
      <Button
        aria-label={`Remove ${item.name}`}
        size="xs"
        variant="ghost"
        colorPalette="red"
        onClick={() => onRemove(item.internal_id)}
      >
        <LuX />
      </Button>
    </Flex>
  );
}

function ExistingMarkerRow({
  marker,
  isEditing,
  onEdit,
  onDelete,
}: {
  marker: ManualMarkerAdminDTO;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Box
      bg="whiteAlpha.100"
      borderRadius="md"
      p={3}
      borderLeft={`4px solid ${marker.color}`}
      borderWidth={isEditing ? '1px' : 0}
      borderColor="pink.400"
    >
      <Flex justifyContent="space-between" gap={3} alignItems="flex-start">
        <Box minW={0}>
          <Flex gap={2} alignItems="center" wrap="wrap">
            {marker.badgeText === null && (
              <Badge colorPalette="gray" size="sm">
                Auto badge
              </Badge>
            )}
            {!!marker.badgeText && (
              <Badge style={{ backgroundColor: marker.color }}>{marker.badgeText}</Badge>
            )}
            {!!marker.title && (
              <Text fontWeight="medium" css={{ '& a, & strong, & b': { color: marker.color } }}>
                <Markdown skipParagraph>{marker.title}</Markdown>
              </Text>
            )}
            {!marker.badgeText &&
              marker.badgeText !== null &&
              !marker.title &&
              !!marker.description && (
                <Text fontWeight="medium" lineClamp={1}>
                  {marker.description}
                </Text>
              )}
            {marker.isPoint && (
              <Badge colorPalette="purple" size="sm">
                Point
              </Badge>
            )}
          </Flex>
          <Text fontSize="xs" color="gray.400" mt={1}>
            {marker.startAt.slice(0, 10)}
            {marker.endAt ? ` → ${marker.endAt.slice(0, 10)}` : ''} · {marker.items.length} item
            {marker.items.length === 1 ? '' : 's'}
          </Text>
          {!!marker.description &&
            (marker.badgeText === null || !!marker.badgeText || !!marker.title) && (
              <Text fontSize="xs" color="whiteAlpha.700" mt={1} lineClamp={2}>
                {marker.description}
              </Text>
            )}
        </Box>
        <Flex gap={1} flexShrink={0}>
          <Button size="xs" variant="ghost" colorPalette="blue" onClick={onEdit}>
            <LuPencil />
          </Button>
          <Button size="xs" variant="ghost" colorPalette="red" onClick={onDelete}>
            <LuTrash2 />
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}

function DeleteMarkerDialog({
  marker,
  isDeleting,
  onClose,
  onConfirm,
}: {
  marker: ManualMarkerAdminDTO | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: (marker: ManualMarkerAdminDTO) => void;
}) {
  return (
    <Dialog.Root
      role="alertdialog"
      open={!!marker}
      size="sm"
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="gray.900" borderWidth="1px" borderColor="whiteAlpha.200">
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Header>
              <Dialog.Title>Delete marker?</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={3}>
                <Text color="gray.300">
                  This permanently deletes the marker
                  {marker
                    ? ` “${marker.title || marker.badgeText || marker.description || `#${marker.internal_id}`}”`
                    : ''}{' '}
                  and removes it from {marker?.items.length ?? 0} item
                  {marker?.items.length === 1 ? '' : 's'}.
                </Text>
                <Text color="gray.400">This action cannot be undone.</Text>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onClose} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                colorPalette="red"
                loading={isDeleting}
                onClick={() => {
                  if (marker) onConfirm(marker);
                }}
              >
                Delete
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
