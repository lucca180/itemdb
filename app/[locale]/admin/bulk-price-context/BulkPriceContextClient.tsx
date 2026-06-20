'use client';

import { useMemo, useState } from 'react';
import axios from 'axios';
import {
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
  Separator,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { LuEraser, LuEye, LuListPlus, LuRefreshCw, LuSend, LuTrash2, LuX } from 'react-icons/lu';
import ItemSelect from '@components/Input/ItemSelect';
import ListInput, { ListInputOption } from '@components/Input/ListInput';
import { useToast } from '@utils/theme/toast';
import { ItemData } from '@types';
import type {
  PriceContextDropPool,
  PriceContextPreviewRow,
} from '@app/api/admin/price-context/priceContextService';

type SourceResponse = {
  items: ItemData[];
  count: number;
};

type DropPoolsResponse = {
  pools: PriceContextDropPool[];
  count: number;
};

type PreviewResponse = {
  rows: PriceContextPreviewRow[];
  count: number;
  targets: number;
};

type ApplyResponse = {
  updated: number;
  skipped: number;
  rows: PriceContextPreviewRow[];
};

const today = new Date().toISOString().slice(0, 10);
type ContextOperation = 'set' | 'clear';

export function BulkPriceContextClient() {
  const toast = useToast();
  const [itemsById, setItemsById] = useState<Record<number, ItemData>>({});
  const [selectedList, setSelectedList] = useState<ListInputOption | null>(null);
  const [listId, setListId] = useState('');
  const [parentItem, setParentItem] = useState<ItemData | null>(null);
  const [prizePool, setPrizePool] = useState('');
  const [dropPools, setDropPools] = useState<PriceContextDropPool[]>([]);
  const [startDate, setStartDate] = useState(today);
  const [priceContext, setPriceContext] = useState('');
  const [onlyInflationAlerts, setOnlyInflationAlerts] = useState(false);
  const [previewRows, setPreviewRows] = useState<PriceContextPreviewRow[]>([]);
  const [isLoadingSource, setIsLoadingSource] = useState(false);
  const [isLoadingPools, setIsLoadingPools] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isClearingContext, setIsClearingContext] = useState(false);
  const [confirmOperation, setConfirmOperation] = useState<ContextOperation | null>(null);

  const selectedItems = useMemo(
    () => Object.values(itemsById).sort((a, b) => a.name.localeCompare(b.name)),
    [itemsById]
  );
  const itemIds = selectedItems.map((item) => item.internal_id);
  const targetCount = previewRows.filter((row) => row.price).length;

  const addItems = (items: ItemData[]) => {
    setItemsById((prev) => {
      const next = { ...prev };
      for (const item of items) next[item.internal_id] = item;
      return next;
    });
    setPreviewRows([]);
  };

  const removeItem = (itemId: number) => {
    setItemsById((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    setPreviewRows((prev) => prev.filter((row) => row.itemId !== itemId));
  };

  const clearItems = () => {
    setItemsById({});
    setPreviewRows([]);
  };

  const loadListItems = async () => {
    if (!selectedList && !listId.trim()) return;

    setIsLoadingSource(true);
    const prom = axios.post<SourceResponse>('/api/admin/price-context/source', {
      source: 'list',
      listId: listId.trim() ? Number(listId) : undefined,
      selectedList: selectedList?.list,
    });

    toast.promise(prom, {
      loading: { id: 'bulk-price-context-list-loading', title: 'Loading list items...' },
      success: { id: 'bulk-price-context-list-success', title: 'List items loaded.' },
      error: { id: 'bulk-price-context-list-error', title: 'Unable to load list items.' },
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
    const prom = axios.post<SourceResponse>('/api/admin/price-context/source', {
      source: 'drops',
      parentItemId: parentItem.internal_id,
      prizePool: prizePool.trim() || undefined,
    });

    toast.promise(prom, {
      loading: { id: 'bulk-price-context-drops-loading', title: 'Loading drop items...' },
      success: { id: 'bulk-price-context-drops-success', title: 'Drop items loaded.' },
      error: { id: 'bulk-price-context-drops-error', title: 'Unable to load drop items.' },
    });

    try {
      const res = await prom;
      addItems(res.data.items);
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
        id: 'bulk-price-context-pools-error',
        title: 'Unable to load drop pools.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingPools(false);
    }
  };

  const previewTargets = async () => {
    if (!itemIds.length || !startDate) return;

    setIsPreviewing(true);
    const prom = axios.post<PreviewResponse>('/api/admin/price-context/preview', {
      itemIds,
      startDate,
      onlyInflationAlerts,
    });

    toast.promise(prom, {
      loading: { id: 'bulk-price-context-preview-loading', title: 'Loading preview...' },
      success: { id: 'bulk-price-context-preview-success', title: 'Preview loaded.' },
      error: { id: 'bulk-price-context-preview-error', title: 'Unable to preview targets.' },
    });

    try {
      const res = await prom;
      setPreviewRows(res.data.rows);
    } finally {
      setIsPreviewing(false);
    }
  };

  const applyContext = async (operation: ContextOperation) => {
    if (!itemIds.length || !startDate || (operation === 'set' && !priceContext.trim())) return;

    if (operation === 'clear') {
      setIsClearingContext(true);
    } else {
      setIsApplying(true);
    }
    const prom = axios.post<ApplyResponse>('/api/admin/price-context/apply', {
      itemIds,
      startDate,
      operation,
      priceContext: operation === 'set' ? priceContext : undefined,
      onlyInflationAlerts,
    });

    toast.promise(prom, {
      loading: {
        id: `bulk-price-context-${operation}-loading`,
        title: operation === 'clear' ? 'Clearing context...' : 'Applying context...',
      },
      success: {
        id: `bulk-price-context-${operation}-success`,
        title: operation === 'clear' ? 'Context cleared.' : 'Context applied.',
      },
      error: {
        id: `bulk-price-context-${operation}-error`,
        title: operation === 'clear' ? 'Unable to clear context.' : 'Unable to apply context.',
      },
    });

    try {
      const res = await prom;
      setPreviewRows(res.data.rows);
    } finally {
      if (operation === 'clear') {
        setIsClearingContext(false);
      } else {
        setIsApplying(false);
      }
    }
  };

  return (
    <SimpleGrid columns={{ base: 1, xl: 2 }} gap={8} alignItems="start">
      <Stack gap={5}>
        <Box bg="blackAlpha.400" borderRadius="md" p={4}>
          <Tabs.Root defaultValue="manual" variant="line" colorPalette="blue">
            <Tabs.List>
              <Tabs.Trigger value="manual">Manual</Tabs.Trigger>
              <Tabs.Trigger value="lists">Lists</Tabs.Trigger>
              <Tabs.Trigger value="drops">Drops</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="manual" pt={5}>
              <Field.Root>
                <Field.Label>Item</Field.Label>
                <ItemSelect onChange={(item) => addItems([item])} placeholder="Add item" />
              </Field.Root>
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
                  colorPalette="blue"
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
                  {parentItem && !isLoadingPools && (
                    <Field.HelperText>
                      {dropPools.length
                        ? `${dropPools.length} pool${dropPools.length === 1 ? '' : 's'} loaded from the item drops calculation.`
                        : 'No calculated pools found for this item.'}
                    </Field.HelperText>
                  )}
                </Field.Root>
                <Button
                  alignSelf="flex-start"
                  colorPalette="blue"
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
        </Box>

        <Box bg="blackAlpha.400" borderRadius="md" p={4}>
          <Stack gap={4}>
            <Heading size="sm">Context</Heading>
            <Field.Root required>
              <Field.Label>Start date</Field.Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPreviewRows([]);
                }}
                variant="subtle"
                bg="whiteAlpha.50"
              />
            </Field.Root>
            <Field.Root required>
              <Field.Label>Price context</Field.Label>
              <Textarea
                value={priceContext}
                onChange={(e) => setPriceContext(e.target.value)}
                placeholder="Added to [Item Name](https://itemdb.com.br/item/item-name) prize pool"
                variant="subtle"
                bg="whiteAlpha.50"
                minH="120px"
              />
            </Field.Root>
            <Switch.Root
              checked={onlyInflationAlerts}
              onCheckedChange={(details) => {
                setOnlyInflationAlerts(details.checked);
                setPreviewRows([]);
              }}
              colorPalette="orange"
            >
              <Switch.HiddenInput />
              <Switch.Control />
              <Switch.Label>Only update prices with inflation alerts</Switch.Label>
            </Switch.Root>
            <Flex gap={3} wrap="wrap">
              <Button
                colorPalette="gray"
                variant="outline"
                onClick={previewTargets}
                loading={isPreviewing}
                disabled={!itemIds.length || !startDate}
              >
                <LuEye />
                Preview
              </Button>
              <Button
                colorPalette="green"
                onClick={() => setConfirmOperation('set')}
                loading={isApplying}
                disabled={!itemIds.length || !startDate || !priceContext.trim()}
              >
                <LuSend />
                Apply context
              </Button>
              <Button
                colorPalette="red"
                variant="outline"
                onClick={() => setConfirmOperation('clear')}
                loading={isClearingContext}
                disabled={!itemIds.length || !startDate}
              >
                <LuEraser />
                Clear context
              </Button>
              <Button
                colorPalette="gray"
                variant="ghost"
                onClick={clearItems}
                disabled={!itemIds.length}
              >
                <LuTrash2 />
                Clear items
              </Button>
            </Flex>
          </Stack>
        </Box>
      </Stack>

      <Stack gap={5}>
        <Box bg="blackAlpha.400" borderRadius="md" p={4}>
          <Flex justifyContent="space-between" gap={4} wrap="wrap" mb={4}>
            <Box>
              <Heading size="sm">Selected items</Heading>
              <Text fontSize="sm" color="gray.400">
                {selectedItems.length} item{selectedItems.length === 1 ? '' : 's'} selected
              </Text>
            </Box>
          </Flex>
          {!selectedItems.length && (
            <Center minH="220px" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="md">
              <Text color="gray.400">No items selected</Text>
            </Center>
          )}
          {!!selectedItems.length && (
            <Stack gap={3} maxH="420px" overflowY="auto" pr={2}>
              {selectedItems.map((item) => (
                <SelectedItemRow key={item.internal_id} item={item} onRemove={removeItem} />
              ))}
            </Stack>
          )}
        </Box>

        <Box bg="blackAlpha.400" borderRadius="md" p={4}>
          <Flex alignItems="center" justifyContent="space-between" gap={3} mb={4}>
            <Box>
              <Heading size="sm">Price preview</Heading>
              {!!previewRows.length && (
                <Text fontSize="sm" color="gray.400">
                  {targetCount} of {previewRows.length} selected item
                  {previewRows.length === 1 ? '' : 's'} have a target price that can be updated or
                  cleared
                  {onlyInflationAlerts ? ' because they have inflation alerts.' : '.'}
                </Text>
              )}
            </Box>
            <Button
              size="sm"
              colorPalette="gray"
              variant="ghost"
              onClick={previewTargets}
              loading={isPreviewing}
              disabled={!itemIds.length || !startDate}
            >
              <LuRefreshCw />
              Refresh
            </Button>
          </Flex>
          {!previewRows.length && (
            <Center minH="220px" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="md">
              <Text color="gray.400">Preview will appear here</Text>
            </Center>
          )}
          {!!previewRows.length && (
            <Table.ScrollArea
              maxH="520px"
              borderWidth="1px"
              borderColor="whiteAlpha.200"
              borderRadius="md"
            >
              <Table.Root size="sm" stickyHeader>
                <Table.Header>
                  <Table.Row bg="gray.800">
                    <Table.ColumnHeader minW="220px">Item</Table.ColumnHeader>
                    <Table.ColumnHeader>Price ID</Table.ColumnHeader>
                    <Table.ColumnHeader>Date</Table.ColumnHeader>
                    <Table.ColumnHeader minW="260px">Current context</Table.ColumnHeader>
                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {previewRows.map((row) => (
                    <Table.Row key={row.itemId}>
                      <Table.Cell>
                        <Text fontWeight="medium">{row.item?.name ?? `Item #${row.itemId}`}</Text>
                        <Text fontSize="xs" color="gray.400">
                          #{row.itemId}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>{row.price?.internal_id ?? '-'}</Table.Cell>
                      <Table.Cell>{row.price?.addedAt.slice(0, 10) ?? '-'}</Table.Cell>
                      <Table.Cell
                        whiteSpace="normal"
                        color={row.price?.priceContext ? undefined : 'gray.500'}
                      >
                        {row.price?.priceContext || 'None'}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={row.price ? 'green' : 'red'}>
                          {row.price ? 'Ready' : row.skippedReason}
                        </Badge>
                        {row.price?.inflated && (
                          <Badge colorPalette="orange" ml={2}>
                            Inflation
                          </Badge>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Table.ScrollArea>
          )}
        </Box>
      </Stack>

      <ConfirmApplyDialog
        operation={confirmOperation}
        selectedCount={itemIds.length}
        previewCount={previewRows.length}
        targetCount={targetCount}
        onlyInflationAlerts={onlyInflationAlerts}
        isLoading={isApplying || isClearingContext}
        onClose={() => setConfirmOperation(null)}
        onConfirm={(operation) => {
          setConfirmOperation(null);
          applyContext(operation);
        }}
      />
    </SimpleGrid>
  );
}

function ConfirmApplyDialog({
  operation,
  selectedCount,
  previewCount,
  targetCount,
  onlyInflationAlerts,
  isLoading,
  onClose,
  onConfirm,
}: {
  operation: ContextOperation | null;
  selectedCount: number;
  previewCount: number;
  targetCount: number;
  onlyInflationAlerts: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (operation: ContextOperation) => void;
}) {
  const isClear = operation === 'clear';
  const title = isClear ? 'Clear price context?' : 'Apply price context?';
  const actionLabel = isClear ? 'Clear context' : 'Apply context';
  const targetCopy = previewCount
    ? `${targetCount} of ${previewCount} previewed item${previewCount === 1 ? '' : 's'} currently have a target price.`
    : `${selectedCount} selected item${selectedCount === 1 ? '' : 's'} will be evaluated.`;

  return (
    <Dialog.Root
      role="alertdialog"
      open={!!operation}
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
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={3}>
                <Text color="gray.300">
                  {targetCopy} Targets are recalculated on submit using the selected start date
                  {onlyInflationAlerts ? ' and the inflation alert filter.' : '.'}
                </Text>
                <Text color="gray.400">
                  {isClear
                    ? 'This will remove the current context from each matched price row.'
                    : 'This will overwrite the current context on each matched price row.'}
                </Text>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                colorPalette={isClear ? 'red' : 'green'}
                loading={isLoading}
                onClick={() => {
                  if (operation) onConfirm(operation);
                }}
              >
                {actionLabel}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

function SelectedItemRow({
  item,
  onRemove,
}: {
  item: ItemData;
  onRemove: (itemId: number) => void;
}) {
  return (
    <Flex alignItems="center" gap={3} bg="whiteAlpha.100" borderRadius="md" p={2} minH="64px">
      <Image src={item.image} alt={item.name} boxSize="48px" objectFit="contain" flexShrink={0} />
      <Box minW={0} flex={1}>
        <Text fontWeight="medium" truncate>
          {item.name}
        </Text>
        <Flex gap={2} alignItems="center" wrap="wrap">
          <Text fontSize="xs" color="gray.400">
            #{item.internal_id}
          </Text>
          <Separator orientation="vertical" h="12px" />
          <Badge colorPalette={item.isNC ? 'purple' : 'green'} size="sm">
            {item.type.toUpperCase()}
          </Badge>
        </Flex>
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
