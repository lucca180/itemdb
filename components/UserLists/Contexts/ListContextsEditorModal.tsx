'use client';

import {
  Badge,
  Box,
  Button,
  Center,
  Checkbox,
  CloseButton,
  Dialog,
  Field,
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  Input,
  NativeSelect,
  Portal,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useMemo, useState, type ReactNode } from 'react';
import axios from 'axios';
import { useTranslations } from 'next-intl';
import {
  LuGripVertical,
  LuListPlus,
  LuPencil,
  LuPlus,
  LuSave,
  LuTrash2,
  LuX,
} from 'react-icons/lu';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ItemV2For, ListContext, ListItemInfo, UserList } from '@types';
import ItemCardV2 from '@components/Items/v2/ItemCardV2';
import { useToast } from '@utils/theme/toast';
import {
  LIST_CONTEXT_COLOR_PATTERN,
  MAX_LIST_CONTEXT_BADGE_LENGTH,
  MAX_LIST_CONTEXT_DESCRIPTION_LENGTH,
  MAX_LIST_CONTEXT_TITLE_LENGTH,
  LIST_CONTEXT_MODES,
  contextShowsBadge,
  type ListContextFields,
  type ListContextItemDates,
  type ListContextMode,
  type ListContextSaveResponse,
} from '@utils/list/listContexts';
import {
  ListContextPanel,
  contextTextColor,
} from '@components/UserLists/Contexts/ListContextPopover';
import { ListContextCorner } from '@components/UserLists/Contexts/ListContextBadges';
import { groupContextsByItem } from '@components/UserLists/Contexts/ListContextsProvider';
import {
  ListContextSeriesDatesFields,
  emptySeriesDatesForm,
  resolveSeriesDatesForm,
} from '@components/UserLists/Contexts/ListContextSeriesDatesFields';

const SWATCHES = ['#2f855a', '#b7791f', '#805ad5', '#2b6cb0', '#c53030', '#c05621', '#4a5568'];

type Form = { id: number | null; badgeText: string; title: string; description: string } & Pick<
  ListContextFields,
  'color' | 'mode' | 'itemIids'
>;

const emptyForm = (): Form => ({
  id: null,
  badgeText: '',
  title: '',
  description: '',
  color: SWATCHES[0],
  mode: 'both',
  itemIids: [],
});

const toForm = (context: ListContext): Form => ({
  id: context.internal_id,
  badgeText: context.badgeText,
  title: context.title ?? '',
  description: context.description ?? '',
  color: context.color,
  mode: context.mode,
  itemIids: context.itemIids,
});

export type ListContextsEditorModalProps = {
  list: UserList;
  contexts: ListContext[];
  onContextsChange: (contexts: ListContext[]) => void;
  itemInfo: Record<string, ListItemInfo>;
  items: Record<string, ItemV2For<'card'>>;
  /** The page has item edits that weren't saved yet */
  hasUnsavedChanges: boolean;
  /** Series dates changed together with a context */
  onItemDatesChange: (itemDates: ListContextItemDates[]) => void;
  onClose: () => void;
};

/** Create, edit and delete the contexts of a list (modelled on /admin/price-markers). */
export default function ListContextsEditorModal({
  list,
  contexts,
  onContextsChange,
  itemInfo,
  items,
  hasUnsavedChanges,
  onItemDatesChange,
  onClose,
}: ListContextsEditorModalProps) {
  const t = useTranslations();
  const toast = useToast();
  const [form, setForm] = useState<Form>(emptyForm);
  const [datesForm, setDatesForm] = useState(emptySeriesDatesForm);
  const [search, setSearch] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [notFound, setNotFound] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const apiBase = `/api/v1/lists/${list.official ? 'official' : list.owner.username}/${list.internal_id}/contexts`;

  const listItems = useMemo(
    () =>
      Object.values(itemInfo)
        .map((info) => items[info.item_iid])
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [itemInfo, items]
  );

  const formRows = useMemo(() => {
    const iids = new Set(form.itemIids);
    return Object.values(itemInfo).filter((info) => iids.has(info.item_iid));
  }, [form.itemIids, itemInfo]);

  const datesState = resolveSeriesDatesForm(datesForm, formRows);

  /** Opens a context (or a new one); the dates form never carries over. */
  const openForm = (next: Form) => {
    setForm(next);
    setDatesForm(emptySeriesDatesForm());
  };

  const contextsByItem = useMemo(() => groupContextsByItem(contexts), [contexts]);

  const query = search.trim().toLowerCase();
  const filtered = query
    ? listItems.filter((item) => item.name.toLowerCase().includes(query))
    : listItems;

  const toggleItem = (iid: number) =>
    setForm((prev) => ({
      ...prev,
      itemIids: prev.itemIids.includes(iid)
        ? prev.itemIids.filter((x) => x !== iid)
        : [...prev.itemIids, iid],
    }));

  const addPasted = () => {
    const tokens = pasteText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const missing: string[] = [];
    const found: number[] = [];

    tokens.forEach((token) => {
      const match = listItems.find(
        (item) =>
          String(item.internal_id) === token || item.name.toLowerCase() === token.toLowerCase()
      );
      if (match) found.push(match.internal_id);
      else missing.push(token);
    });

    setForm((prev) => ({ ...prev, itemIids: [...new Set([...prev.itemIids, ...found])] }));
    setNotFound(missing);
    if (!missing.length) setPasteText('');
  };

  const showError = (err: unknown) => {
    console.error(err);
    const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
    toast({
      id: 'list-contexts-error',
      title: t('Lists.contexts-error'),
      description: typeof message === 'string' ? message : undefined,
      status: 'error',
    });
  };

  const save = async () => {
    setSaving(true);
    const { id, ...fields } = form;
    const body = {
      ...fields,
      title: fields.title || null,
      description: fields.description || null,
      seriesDates: datesState.change ?? undefined,
    };

    try {
      const res = id
        ? await axios.patch<ListContextSaveResponse>(`${apiBase}/${id}`, body)
        : await axios.post<ListContextSaveResponse>(apiBase, body);
      const { itemDates, ...context } = res.data;

      onContextsChange(
        id
          ? contexts.map((ctx) => (ctx.internal_id === id ? context : ctx))
          : [...contexts, context]
      );
      onItemDatesChange(itemDates);

      toast({ id: 'list-contexts-saved', title: t('Lists.contexts-saved'), status: 'success' });
      openForm(emptyForm());
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (context: ListContext) => {
    if (confirmDelete !== context.internal_id) {
      setConfirmDelete(context.internal_id);
      return;
    }

    setSaving(true);
    try {
      await axios.delete(`${apiBase}/${context.internal_id}`);
      onContextsChange(contexts.filter((ctx) => ctx.internal_id !== context.internal_id));
      if (form.id === context.internal_id) openForm(emptyForm());
      toast({ id: 'list-contexts-deleted', title: t('Lists.contexts-deleted'), status: 'success' });
    } catch (err) {
      showError(err);
    } finally {
      setConfirmDelete(null);
      setSaving(false);
    }
  };

  // saved right away; the order also decides which context leads an item's corner
  const reorder = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const from = contexts.findIndex((ctx) => ctx.internal_id === active.id);
    const to = contexts.findIndex((ctx) => ctx.internal_id === over.id);
    if (from < 0 || to < 0) return;

    const previous = contexts;
    const next = arrayMove(contexts, from, to).map((ctx, order) => ({ ...ctx, order }));
    onContextsChange(next);

    setSaving(true);
    try {
      const res = await axios.patch<ListContext[]>(apiBase, {
        contextIds: next.map((ctx) => ctx.internal_id),
      });
      onContextsChange(res.data);
      toast({
        id: 'list-contexts-order-saved',
        title: t('Lists.contexts-order-saved'),
        status: 'success',
      });
    } catch (err) {
      onContextsChange(previous);
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const validColor = LIST_CONTEXT_COLOR_PATTERN.test(form.color.trim());
  const canSave = !!form.badgeText.trim() && validColor && datesState.isValid && !saving;

  const previewContext: ListContext = {
    internal_id: form.id ?? -1,
    list_id: list.internal_id,
    badgeText: form.badgeText || '…',
    title: form.title || null,
    description: form.description || null,
    color: validColor ? form.color : SWATCHES[0],
    order: 0,
    mode: form.mode,
    createdAt: '',
    updatedAt: '',
    itemIids: form.itemIids,
  };
  const previewItem = items[form.itemIids[0]];

  return (
    <Dialog.Root
      open
      onOpenChange={(e) => !e.open && onClose()}
      size="full"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="gray.800">
            <Dialog.Header>
              <Dialog.Title>{t('Lists.contexts-manage')}</Dialog.Title>
            </Dialog.Header>
            {/* lg+: the columns fill the screen and scroll on their own */}
            <Dialog.Body display={{ lg: 'flex' }} flexDirection="column" minH={0}>
              <SimpleGrid
                columns={{ base: 1, lg: 3 }}
                gap={5}
                flex={{ lg: '1' }}
                minH={{ lg: 0 }}
                gridTemplateRows={{ lg: 'minmax(0, 1fr)' }}
              >
                {/* existing contexts */}
                <Stack gap={2} bg="blackAlpha.400" borderRadius="md" p={3} minH={0}>
                  <Button size="sm" colorPalette="pink" onClick={() => openForm(emptyForm())}>
                    <LuPlus /> {t('Lists.contexts-new')}
                  </Button>
                  {!contexts.length && (
                    <Center minH="80px">
                      <Text color="gray.400">{t('Lists.contexts-empty')}</Text>
                    </Center>
                  )}
                  {contexts.length > 1 && (
                    <Text fontSize="xs" color="gray.400">
                      {t('Lists.contexts-reorder-help')}
                    </Text>
                  )}
                  <Stack gap={2} minH={0} overflowY={{ lg: 'auto' }} pr={1}>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={reorder}
                    >
                      <SortableContext
                        items={contexts.map((ctx) => ctx.internal_id)}
                        strategy={verticalListSortingStrategy}
                        disabled={saving}
                      >
                        {contexts.map((context) => (
                          <SortableContextRow
                            key={context.internal_id}
                            id={context.internal_id}
                            dragLabel={t('Lists.contexts-drag', { badge: context.badgeText })}
                            dragDisabled={saving || contexts.length < 2}
                            bg={
                              form.id === context.internal_id ? 'whiteAlpha.200' : 'blackAlpha.300'
                            }
                          >
                            <Badge
                              style={{ backgroundColor: context.color }}
                              color={contextTextColor(context.color)}
                              maxW="140px"
                              truncate
                              textTransform="none"
                            >
                              {context.badgeText}
                            </Badge>
                            {context.mode !== 'both' && (
                              <Badge size="sm" variant="outline" textTransform="none">
                                {t(`Lists.contexts-mode-${context.mode}-short`)}
                              </Badge>
                            )}
                            <Text fontSize="xs" color="gray.400" flex="1">
                              {confirmDelete === context.internal_id
                                ? t('Lists.contexts-delete-confirm')
                                : t('Lists.contexts-item-count', {
                                    count: context.itemIids.length,
                                  })}
                            </Text>
                            <IconButton
                              aria-label={t('Lists.contexts-editing', { badge: context.badgeText })}
                              size="xs"
                              variant="ghost"
                              disabled={saving}
                              onClick={() => {
                                setConfirmDelete(null);
                                openForm(toForm(context));
                              }}
                            >
                              <LuPencil />
                            </IconButton>
                            <IconButton
                              aria-label={t('General.delete')}
                              size="xs"
                              variant={confirmDelete === context.internal_id ? 'solid' : 'ghost'}
                              colorPalette="red"
                              disabled={saving}
                              onClick={() => remove(context)}
                            >
                              <LuTrash2 />
                            </IconButton>
                          </SortableContextRow>
                        ))}
                      </SortableContext>
                    </DndContext>
                  </Stack>
                </Stack>

                {/* form */}
                <Stack
                  gap={4}
                  bg="blackAlpha.400"
                  borderRadius="md"
                  p={3}
                  overflowY={{ lg: 'auto' }}
                >
                  <Heading size="sm">
                    {form.id
                      ? t('Lists.contexts-editing', { badge: form.badgeText })
                      : t('Lists.contexts-new')}
                  </Heading>
                  <Field.Root required>
                    <Field.Label>{t('Lists.contexts-badge')}</Field.Label>
                    <Input
                      size="sm"
                      variant="subtle"
                      maxLength={MAX_LIST_CONTEXT_BADGE_LENGTH}
                      value={form.badgeText}
                      onChange={(e) => setForm((prev) => ({ ...prev, badgeText: e.target.value }))}
                    />
                    <Field.HelperText fontSize="xs">
                      {t('Lists.contexts-badge-help', { max: MAX_LIST_CONTEXT_BADGE_LENGTH })}
                    </Field.HelperText>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t('Lists.contexts-title')}</Field.Label>
                    <Input
                      size="sm"
                      variant="subtle"
                      maxLength={MAX_LIST_CONTEXT_TITLE_LENGTH}
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t('Lists.contexts-description')}</Field.Label>
                    <Textarea
                      size="sm"
                      variant="subtle"
                      minH="110px"
                      maxLength={MAX_LIST_CONTEXT_DESCRIPTION_LENGTH}
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                    />
                  </Field.Root>
                  <Field.Root invalid={!validColor}>
                    <Field.Label>{t('Lists.contexts-color')}</Field.Label>
                    <HStack gap={2} flexWrap="wrap">
                      {SWATCHES.map((hex) => (
                        <Box
                          key={hex}
                          as="button"
                          aria-label={hex}
                          w="24px"
                          h="24px"
                          borderRadius="full"
                          outline={form.color === hex ? '2px solid white' : undefined}
                          outlineOffset="2px"
                          style={{ background: hex }}
                          onClick={() => setForm((prev) => ({ ...prev, color: hex }))}
                        />
                      ))}
                      <Input
                        size="xs"
                        variant="subtle"
                        maxW="100px"
                        maxLength={9}
                        value={form.color}
                        onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                      />
                    </HStack>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t('Lists.contexts-mode')}</Field.Label>
                    <NativeSelect.Root size="sm" variant="subtle">
                      <NativeSelect.Field
                        value={form.mode}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            mode: e.target.value as ListContextMode,
                          }))
                        }
                      >
                        {LIST_CONTEXT_MODES.map((mode) => (
                          <option key={mode} value={mode}>
                            {t(`Lists.contexts-mode-${mode}`)}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                    <Field.HelperText fontSize="xs">
                      {t(`Lists.contexts-mode-${form.mode}-help`)}
                    </Field.HelperText>
                  </Field.Root>
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" mb={2}>
                      {t('Lists.contexts-preview')}
                    </Text>
                    <Flex gap={3} alignItems="flex-start" flexWrap="wrap">
                      {previewItem && (
                        <ItemCardV2
                          small
                          disableLink
                          uniqueID="list-context-preview"
                          item={previewItem}
                          corner={
                            contextShowsBadge(previewContext) ? (
                              <ListContextCorner contexts={[previewContext]} />
                            ) : undefined
                          }
                        />
                      )}
                      <Box
                        flex="1"
                        minW="180px"
                        p={3}
                        borderRadius="md"
                        bg="gray.900"
                        style={{ borderTop: `3px solid ${previewContext.color}` }}
                      >
                        <ListContextPanel context={previewContext} />
                      </Box>
                    </Flex>
                  </Box>
                </Stack>

                {/* items */}
                <Stack
                  gap={3}
                  bg="blackAlpha.400"
                  borderRadius="md"
                  p={3}
                  overflowY={{ lg: 'auto' }}
                >
                  <Heading size="sm">{t('Lists.contexts-items')}</Heading>
                  <Tabs.Root
                    defaultValue="list"
                    variant="line"
                    colorPalette="pink"
                    size="sm"
                    display="flex"
                    flexDirection="column"
                    flex={{ lg: '1 0 260px' }}
                    minH={0}
                  >
                    <Tabs.List>
                      <Tabs.Trigger value="list">{t('Lists.contexts-list-items')}</Tabs.Trigger>
                      <Tabs.Trigger value="paste">{t('Lists.contexts-paste')}</Tabs.Trigger>
                    </Tabs.List>
                    <Tabs.Content
                      value="list"
                      pt={3}
                      flex="1"
                      minH={0}
                      display="flex"
                      flexDirection="column"
                      _closed={{ display: 'none' }}
                    >
                      <Input
                        size="sm"
                        variant="subtle"
                        placeholder={t('Lists.contexts-search')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        mb={2}
                        flexShrink={0}
                      />
                      <Stack
                        gap={1}
                        flex="1"
                        minH={0}
                        maxH={{ base: '380px', lg: 'none' }}
                        overflowY="auto"
                        pr={1}
                      >
                        {filtered.map((item) => {
                          const others = (contextsByItem.get(item.internal_id) ?? []).filter(
                            (context) => context.internal_id !== form.id
                          );
                          return (
                            <Checkbox.Root
                              key={item.internal_id}
                              size="sm"
                              checked={form.itemIids.includes(item.internal_id)}
                              onCheckedChange={() => toggleItem(item.internal_id)}
                              p={1}
                              borderRadius="sm"
                              _hover={{ bg: 'whiteAlpha.100' }}
                              w="100%"
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control />
                              <Checkbox.Label flex="1" minW={0}>
                                <HStack gap={2}>
                                  <Image
                                    src={item.image.url}
                                    alt=""
                                    w="28px"
                                    h="28px"
                                    borderRadius="sm"
                                  />
                                  <Text fontSize="xs" truncate flex="1">
                                    {item.name}
                                  </Text>
                                  {others.slice(0, 2).map((context) => (
                                    <Badge
                                      key={context.internal_id}
                                      size="xs"
                                      textTransform="none"
                                      style={{ backgroundColor: context.color }}
                                      color={contextTextColor(context.color)}
                                    >
                                      {context.badgeText}
                                    </Badge>
                                  ))}
                                </HStack>
                              </Checkbox.Label>
                            </Checkbox.Root>
                          );
                        })}
                      </Stack>
                    </Tabs.Content>
                    <Tabs.Content value="paste" pt={3}>
                      <Stack gap={2}>
                        <Textarea
                          size="sm"
                          variant="subtle"
                          minH="120px"
                          value={pasteText}
                          onChange={(e) => {
                            setPasteText(e.target.value);
                            setNotFound([]);
                          }}
                        />
                        <Text fontSize="xs" color="gray.400">
                          {t('Lists.contexts-paste-help')}
                        </Text>
                        <Button
                          size="sm"
                          alignSelf="flex-start"
                          colorPalette="pink"
                          disabled={!pasteText.trim()}
                          onClick={addPasted}
                        >
                          <LuListPlus /> {t('Lists.contexts-add-items')}
                        </Button>
                        {!!notFound.length && (
                          <Text fontSize="xs" color="orange.300">
                            {t('Lists.contexts-not-found', { count: notFound.length })}:{' '}
                            {notFound.join(', ')}
                          </Text>
                        )}
                      </Stack>
                    </Tabs.Content>
                  </Tabs.Root>
                  <Text fontSize="sm" color="gray.400">
                    {t('Lists.contexts-selected', { count: form.itemIids.length })}
                  </Text>
                  {/* items only use their own dates when the list has a series type */}
                  {list.seriesType && (
                    <ListContextSeriesDatesFields
                      form={datesForm}
                      onChange={setDatesForm}
                      state={datesState}
                      rows={formRows}
                      items={items}
                      hasUnsavedChanges={hasUnsavedChanges}
                    />
                  )}
                </Stack>
              </SimpleGrid>
            </Dialog.Body>
            <Dialog.Footer>
              {form.id && (
                <Button variant="outline" size="sm" onClick={() => openForm(emptyForm())}>
                  <LuX /> {t('General.cancel')}
                </Button>
              )}
              <Button
                colorPalette="pink"
                size="sm"
                disabled={!canSave}
                loading={saving}
                onClick={save}
              >
                {form.id ? <LuSave /> : <LuPlus />}{' '}
                {form.id ? t('Lists.contexts-save') : t('Lists.contexts-create')}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

/** A row of the context list; dragged by its handle so the buttons keep their clicks. */
function SortableContextRow({
  id,
  dragLabel,
  dragDisabled,
  bg,
  children,
}: {
  id: number;
  dragLabel: string;
  dragDisabled: boolean;
  bg: string;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <Flex
      ref={setNodeRef}
      alignItems="center"
      gap={2}
      p={2}
      pl={1}
      borderRadius="md"
      bg={bg}
      position="relative"
      zIndex={isDragging ? 1 : undefined}
      boxShadow={isDragging ? 'lg' : undefined}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <IconButton
        ref={setActivatorNodeRef}
        aria-label={dragLabel}
        size="xs"
        variant="ghost"
        color="gray.400"
        cursor={dragDisabled ? 'default' : isDragging ? 'grabbing' : 'grab'}
        disabled={dragDisabled}
        touchAction="none"
        {...attributes}
        {...listeners}
      >
        <LuGripVertical />
      </IconButton>
      {children}
    </Flex>
  );
}
