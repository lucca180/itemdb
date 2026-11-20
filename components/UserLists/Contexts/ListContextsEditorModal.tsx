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
  Portal,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import axios from 'axios';
import { useTranslations } from 'next-intl';
import { LuListPlus, LuPencil, LuPlus, LuSave, LuTrash2, LuX } from 'react-icons/lu';
import type { ItemV2For, ListContext, ListItemInfo, UserList } from '@types';
import ItemCardV2 from '@components/Items/v2/ItemCardV2';
import { useToast } from '@utils/theme/toast';
import {
  LIST_CONTEXT_COLOR_PATTERN,
  MAX_LIST_CONTEXT_BADGE_LENGTH,
  MAX_LIST_CONTEXT_DESCRIPTION_LENGTH,
  MAX_LIST_CONTEXT_TITLE_LENGTH,
  type ListContextFields,
} from '@utils/list/listContexts';
import {
  ListContextPanel,
  contextTextColor,
} from '@components/UserLists/Contexts/ListContextPopover';
import { ListContextCorner } from '@components/UserLists/Contexts/ListContextBadges';
import { groupContextsByItem } from '@components/UserLists/Contexts/ListContextsProvider';

const SWATCHES = ['#2f855a', '#b7791f', '#805ad5', '#2b6cb0', '#c53030', '#c05621', '#4a5568'];

type Form = { id: number | null; badgeText: string; title: string; description: string } & Pick<
  ListContextFields,
  'color' | 'itemIids'
>;

const emptyForm = (): Form => ({
  id: null,
  badgeText: '',
  title: '',
  description: '',
  color: SWATCHES[0],
  itemIids: [],
});

const toForm = (context: ListContext): Form => ({
  id: context.internal_id,
  badgeText: context.badgeText,
  title: context.title ?? '',
  description: context.description ?? '',
  color: context.color,
  itemIids: context.itemIids,
});

export type ListContextsEditorModalProps = {
  list: UserList;
  contexts: ListContext[];
  onContextsChange: (contexts: ListContext[]) => void;
  itemInfo: Record<string, ListItemInfo>;
  items: Record<string, ItemV2For<'card'>>;
  onClose: () => void;
};

/** Create, edit and delete the contexts of a list (modelled on /admin/price-markers). */
export default function ListContextsEditorModal({
  list,
  contexts,
  onContextsChange,
  itemInfo,
  items,
  onClose,
}: ListContextsEditorModalProps) {
  const t = useTranslations();
  const toast = useToast();
  const [form, setForm] = useState<Form>(emptyForm);
  const [search, setSearch] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [notFound, setNotFound] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const apiBase = `/api/v1/lists/${list.official ? 'official' : list.owner.username}/${list.internal_id}/contexts`;

  const listItems = useMemo(
    () =>
      Object.values(itemInfo)
        .map((info) => items[info.item_iid])
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [itemInfo, items]
  );

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
    };

    try {
      if (id) {
        const res = await axios.patch<ListContext>(`${apiBase}/${id}`, body);
        onContextsChange(contexts.map((ctx) => (ctx.internal_id === id ? res.data : ctx)));
      } else {
        const res = await axios.post<ListContext>(apiBase, body);
        onContextsChange([...contexts, res.data]);
      }

      toast({ id: 'list-contexts-saved', title: t('Lists.contexts-saved'), status: 'success' });
      setForm(emptyForm());
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
      if (form.id === context.internal_id) setForm(emptyForm());
      toast({ id: 'list-contexts-deleted', title: t('Lists.contexts-deleted'), status: 'success' });
    } catch (err) {
      showError(err);
    } finally {
      setConfirmDelete(null);
      setSaving(false);
    }
  };

  const validColor = LIST_CONTEXT_COLOR_PATTERN.test(form.color.trim());
  const canSave = !!form.badgeText.trim() && validColor && !saving;

  const previewContext: ListContext = {
    internal_id: form.id ?? -1,
    list_id: list.internal_id,
    badgeText: form.badgeText || '…',
    title: form.title || null,
    description: form.description || null,
    color: validColor ? form.color : SWATCHES[0],
    createdAt: '',
    updatedAt: '',
    itemIids: form.itemIids,
  };
  const previewItem = items[form.itemIids[0]];

  return (
    <Dialog.Root
      open
      onOpenChange={(e) => !e.open && onClose()}
      size={{ base: 'full', md: 'cover' }}
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          {/* `full` on mobile sets minH 100dvh and square corners; md+ sizes don't undo them */}
          <Dialog.Content bg="gray.800" minH={{ md: 'auto' }} borderRadius={{ md: 'l3' }}>
            <Dialog.Header>
              <Dialog.Title>{t('Lists.contexts-manage')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <SimpleGrid columns={{ base: 1, lg: 3 }} gap={5} alignItems="start">
                {/* existing contexts */}
                <Stack gap={2} bg="blackAlpha.400" borderRadius="md" p={3}>
                  <Button size="sm" colorPalette="pink" onClick={() => setForm(emptyForm())}>
                    <LuPlus /> {t('Lists.contexts-new')}
                  </Button>
                  {!contexts.length && (
                    <Center minH="80px">
                      <Text color="gray.400">{t('Lists.contexts-empty')}</Text>
                    </Center>
                  )}
                  <Stack gap={2} maxH={{ lg: '560px' }} overflowY="auto" pr={1}>
                    {contexts.map((context) => (
                      <Flex
                        key={context.internal_id}
                        alignItems="center"
                        gap={2}
                        p={2}
                        borderRadius="md"
                        bg={form.id === context.internal_id ? 'whiteAlpha.200' : 'blackAlpha.300'}
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
                        <Text fontSize="xs" color="gray.400" flex="1">
                          {confirmDelete === context.internal_id
                            ? t('Lists.contexts-delete-confirm')
                            : t('Lists.contexts-item-count', { count: context.itemIids.length })}
                        </Text>
                        <IconButton
                          aria-label={t('Lists.contexts-editing', { badge: context.badgeText })}
                          size="xs"
                          variant="ghost"
                          disabled={saving}
                          onClick={() => {
                            setConfirmDelete(null);
                            setForm(toForm(context));
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
                      </Flex>
                    ))}
                  </Stack>
                </Stack>

                {/* form */}
                <Stack gap={4} bg="blackAlpha.400" borderRadius="md" p={3}>
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
                          corner={<ListContextCorner contexts={[previewContext]} />}
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
                <Stack gap={3} bg="blackAlpha.400" borderRadius="md" p={3}>
                  <Heading size="sm">{t('Lists.contexts-items')}</Heading>
                  <Tabs.Root defaultValue="list" variant="line" colorPalette="pink" size="sm">
                    <Tabs.List>
                      <Tabs.Trigger value="list">{t('Lists.contexts-list-items')}</Tabs.Trigger>
                      <Tabs.Trigger value="paste">{t('Lists.contexts-paste')}</Tabs.Trigger>
                    </Tabs.List>
                    <Tabs.Content value="list" pt={3}>
                      <Input
                        size="sm"
                        variant="subtle"
                        placeholder={t('Lists.contexts-search')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        mb={2}
                      />
                      <Stack gap={1} maxH="380px" overflowY="auto" pr={1}>
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
                </Stack>
              </SimpleGrid>
            </Dialog.Body>
            <Dialog.Footer>
              {form.id && (
                <Button variant="outline" size="sm" onClick={() => setForm(emptyForm())}>
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
