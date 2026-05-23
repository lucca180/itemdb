import {
  Button,
  Text,
  Input,
  Stack,
  Textarea,
  Checkbox,
  Badge,
  Spinner,
  Center,
  Field,
  NativeSelect,
  Separator,
  Link,
  Dialog,
  CloseButton,
  Portal,
} from '@chakra-ui/react';
import axios from 'axios';
import { useState } from 'react';
import { ColorType, UserList } from '../../types';
import { useAuth } from '../../utils/auth';
import { ColorResult, TwitterPicker } from '@hello-pangea/color-picker';
import { useTranslations } from 'next-intl';
import { useLists } from '../../utils/useLists';

export type CreateListModalProps = {
  list?: UserList;
  isOpen: boolean;
  onClose: () => void;
  refresh?: () => void;
};

type EditableList = Partial<Omit<UserList, 'officialTag'> & { officialTag: string | string[] }>;

const defaultList: Partial<UserList> = {
  name: '',
  description: '',
  coverURL: '',
  colorHex: '',
  visibility: 'public',
  purpose: 'none',
  official: false,
};

const colorPickerStyles = {
  card: {
    background: '#4A5568',
  },
  input: {
    background: '#353f4f',
    color: '#fff',
    boxShadow: 'none',
    height: '30px',
  },
};

const defaultColors = [
  '#FF6900',
  '#FCB900',
  '#7BDCB5',
  '#00D084',
  '#8ED1FC',
  '#0693E3',
  '#ABB8C3',
  '#EB144C',
  '#F78DA7',
  '#9900EF',
];

const CreateListModal = (props: CreateListModalProps) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { isOpen, onClose } = props;
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [list, setList] = useState<EditableList>(props.list ?? defaultList);
  const { revalidate } = useLists();
  const [colorPalette, setColorPalette] = useState<string[]>(defaultColors);

  const saveChanges = async () => {
    setLoading(true);
    try {
      if (!user) return;

      const data = {
        list_id: list.internal_id,
        name: list.name,
        description: list.description,
        coverURL: list.coverURL,
        visibility: list.visibility,
        purpose: list.purpose,
        colorHex: list.colorHex,
        official: user.isAdmin ? list.official : undefined,
        officialTag: user.isAdmin
          ? Array.isArray(list.officialTag)
            ? list.officialTag.join(',')
            : list.officialTag
          : undefined,
        sortInfo: {
          sortBy: list.sortBy,
          sortDir: list.sortDir,
        },
        seriesType: list.seriesType,
        seriesStart: list.seriesStart,
        seriesEnd: list.seriesEnd,
        listUserTag: list.userTag || undefined,
        canBeLinked: (list.canBeLinked as boolean | string) == 'true',

        highlight: list.highlight,
        highlightText: list.highlightText,
      };

      const username = list.owner?.username ?? user.username;

      // if list exists then update, else create
      const res = await (props.list
        ? axios.post(`/api/v1/lists/${username}/${list.internal_id}`, data)
        : axios.post(`/api/v1/lists/${username}`, data));

      setLoading(false);

      if (res.data.success) {
        props.refresh?.();
        revalidate();
        onClose();
      } else throw res.data;
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError(true);
    }
  };

  const handleCancel = () => {
    setList(props.list ?? defaultList);
    setError(false);
    setLoading(false);
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setList({
      ...list,
      [e.target.name]: e.target.value,
    });
  };

  const handleColorChange = (color: ColorResult) => {
    setList({
      ...list,
      colorHex: color.hex,
    });
  };

  const loadColorPalette = async () => {
    const url = list.coverURL;

    if (!url || !isValidHttpUrl(url)) {
      setColorPalette(defaultColors);
      return;
    }

    try {
      const res = await axios.post('/api/v1/tools/getColor', { url: url });
      const data = res.data as Record<ColorType, { hex: string }>;
      const colors = Object.values(data).map((color) => color.hex);
      setColorPalette([...defaultColors, ...colors]);
    } catch (err) {
      console.error(err);
      setColorPalette(defaultColors);
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) handleCancel();
      }}
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                {props.list ? t('Button.edit') : t('General.create')} {t('Lists.List')}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              {!isLoading && !error && (
                <Stack gap={3}>
                  {props.list && user?.id !== props.list?.owner.id && user?.isAdmin && (
                    <Text textAlign="center" color="red.300">
                      {t('Lists.admin-edit-msg')}
                    </Text>
                  )}
                  {user?.isAdmin && (
                    <Stack gap={3} mb={3}>
                      <Field.Root>
                        <Checkbox.Root
                          checked={!!list.official}
                          onCheckedChange={({ checked }) =>
                            setList({
                              ...list,
                              official: !!checked,
                            })
                          }
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>
                            <Badge colorPalette="blue">✓ {t('General.official')}</Badge>
                          </Checkbox.Label>
                        </Checkbox.Root>
                      </Field.Root>
                      {list.official && (
                        <>
                          <Field.Root>
                            <Field.Label color="gray.300">{t('Lists.official-tag')}</Field.Label>
                            <Input
                              variant="subtle"
                              name="officialTag"
                              onChange={handleChange}
                              value={
                                Array.isArray(list.officialTag)
                                  ? list.officialTag.join(', ')
                                  : (list.officialTag ?? '')
                              }
                            />
                          </Field.Root>
                          <Field.Root>
                            <Field.Label color="gray.300">Series Type</Field.Label>
                            <NativeSelect.Root variant="subtle">
                              <NativeSelect.Field
                                name="seriesType"
                                onChange={handleChange}
                                value={list.seriesType ?? 'none'}
                              >
                                <option value="none">None</option>
                                <option value="listCreation">List Creation</option>
                                <option value="itemAddition">Item Addition</option>
                                <option value="listDates">Series Dates</option>
                              </NativeSelect.Field>
                              <NativeSelect.Indicator />
                            </NativeSelect.Root>
                          </Field.Root>
                          {list.seriesType === 'listDates' && (
                            <>
                              <Field.Root>
                                <Field.Label color="gray.300">Series Start</Field.Label>
                                <Input
                                  variant="subtle"
                                  type="date"
                                  name="seriesStart"
                                  onChange={handleChange}
                                  value={list.seriesStart?.split('T')[0] ?? ''}
                                />
                              </Field.Root>
                              <Field.Root>
                                <Field.Label color="gray.300">Series End</Field.Label>
                                <Input
                                  variant="subtle"
                                  type="date"
                                  name="seriesEnd"
                                  onChange={handleChange}
                                  min={list.seriesStart || undefined}
                                  value={list.seriesEnd?.split('T')[0] ?? ''}
                                />
                              </Field.Root>
                            </>
                          )}
                        </>
                      )}
                      <Separator />
                    </Stack>
                  )}

                  <Field.Root invalid={/^\d+$/.test(list.name ?? '')}>
                    <Field.Label color="gray.300">{t('ItemPage.list-name')}</Field.Label>
                    <Input variant="subtle" name="name" onChange={handleChange} value={list.name} />
                    <Field.HelperText fontSize={'xs'}>{t('General.required')}</Field.HelperText>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label color="gray.300">{t('General.description')}</Field.Label>
                    <Textarea
                      variant="subtle"
                      name="description"
                      onChange={handleChange}
                      value={list.description ?? ''}
                    />
                    <Field.HelperText fontSize={'xs'}>
                      {t.rich('Lists.markdown-tip', {
                        Link: (children) => (
                          <Link
                            href="https://commonmark.org/help/"
                            color="gray.300"
                            target="_blank"
                          >
                            {children}
                          </Link>
                        ),
                        Small: (children) => <Text display={'inline'}>{children}</Text>,
                      })}
                    </Field.HelperText>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label color="gray.300">
                      {t('Lists.cover-image-url')} (150x150)
                    </Field.Label>
                    <Input
                      variant="subtle"
                      name="coverURL"
                      onChange={handleChange}
                      value={list.coverURL ?? ''}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label color="gray.300">{t('General.color')}</Field.Label>
                    <Center flexFlow={'column'} gap={2}>
                      <TwitterPicker
                        styles={colorPickerStyles}
                        triangle="hide"
                        colors={colorPalette}
                        color={list.colorHex ?? '#000000'}
                        onChangeComplete={handleColorChange}
                      />
                      <Button
                        size={'xs'}
                        onClick={loadColorPalette}
                        disabled={!isValidHttpUrl(list.coverURL)}
                      >
                        {t('Lists.load-cover-image-palette')}
                      </Button>
                    </Center>
                    <Field.HelperText fontSize={'xs'}>{t('Lists.color-helper')}</Field.HelperText>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label color="gray.300">{t('General.visibility')}</Field.Label>
                    <NativeSelect.Root variant="subtle">
                      <NativeSelect.Field
                        name="visibility"
                        onChange={handleChange}
                        value={list.visibility}
                      >
                        <option value="public">{t('General.public')}</option>
                        <option value="unlisted">{t('General.unlisted')}</option>
                        <option value="private">{t('General.private')}</option>
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label color="gray.300">{t('Lists.purpose')}</Field.Label>
                    <NativeSelect.Root variant="subtle">
                      <NativeSelect.Field
                        name="purpose"
                        onChange={handleChange}
                        value={list.purpose}
                      >
                        <option value="none">{t('Lists.none')}</option>
                        <option value="seeking">{t('Lists.seeking-these-items')}</option>
                        <option value="trading">{t('Lists.trading-these-items')}</option>
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                    <Field.HelperText fontSize={'xs'}>
                      {t('Lists.seeking-trading-msg')}
                    </Field.HelperText>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label color="gray.300">{t('Lists.default-sorting')}</Field.Label>
                    <NativeSelect.Root variant="subtle">
                      <NativeSelect.Field name="sortBy" onChange={handleChange} value={list.sortBy}>
                        <option value="name">{t('General.name')}</option>
                        <option value="price">{t('General.price')}</option>
                        <option value="rarity">{t('General.rarity')}</option>
                        <option value="color">{t('General.color')}</option>
                        <option value="custom">{t('General.custom')}</option>
                        <option value="addedAt">{t('General.added-at')}</option>
                        <option value="faerieFest">{t('General.recycling-points')}</option>
                        <option value="item_id">{t('General.item-id')}</option>
                        <option value="quantity">{t('General.quantity')}</option>
                        <option value="price_qty">{t('SortTypes.price-quantity')}</option>
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                    <Field.HelperText>
                      {list.sortBy === 'custom' && t('Lists.custom-sort-msg')}
                    </Field.HelperText>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label color="gray.300">{t('General.sort-direction')}</Field.Label>
                    <NativeSelect.Root variant="subtle">
                      <NativeSelect.Field
                        name="sortDir"
                        onChange={handleChange}
                        value={list.sortDir}
                      >
                        <option value="asc">{t('General.ascending')}</option>
                        <option value="desc">{t('General.descending')}</option>
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label color="gray.300">{t('Lists.can-be-linked')}</Field.Label>
                    <NativeSelect.Root variant="subtle">
                      <NativeSelect.Field
                        name="canBeLinked"
                        onChange={handleChange}
                        value={list.canBeLinked?.toString() ?? 'true'}
                      >
                        <option value="true">{t('General.yes')}</option>
                        <option value="false">{t('General.no')}</option>
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                    <Field.HelperText fontSize={'xs'}>
                      {t.rich('Lists.can-be-linked-help', {
                        Link: (children) => (
                          <Link
                            href="/articles/checklists-and-dynamic-lists"
                            target="_blank"
                            color={'whiteAlpha.800'}
                          >
                            {children}
                          </Link>
                        ),
                      })}
                    </Field.HelperText>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label color="gray.300">{t('Lists.group-tag')}</Field.Label>
                    <Input
                      variant="subtle"
                      name="userTag"
                      onChange={handleChange}
                      value={list.userTag ?? ''}
                    />
                    <Field.HelperText fontSize={'xs'}>{t('Lists.group-tag-help')}</Field.HelperText>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label color="gray.300">{t('Lists.highlights-title')}</Field.Label>
                    <Input
                      variant="subtle"
                      name="highlight"
                      onChange={handleChange}
                      value={list.highlight ?? ''}
                    />
                    <Field.HelperText fontSize={'xs'}>
                      {t('Lists.highlights-title-help')}
                    </Field.HelperText>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label color="gray.300">{t('Lists.highlights-description')}</Field.Label>
                    <Textarea
                      variant="subtle"
                      name="highlightText"
                      onChange={handleChange}
                      value={list.highlightText ?? ''}
                    />
                    <Field.HelperText fontSize={'xs'}>
                      {t.rich('Lists.markdown-tip', {
                        Link: (children) => (
                          <Link
                            href="https://commonmark.org/help/"
                            color="gray.300"
                            target="_blank"
                          >
                            {children}
                          </Link>
                        ),
                        Small: (children) => <Text display={'inline'}>{children}</Text>,
                      })}
                    </Field.HelperText>
                  </Field.Root>
                  {props.list && (
                    <Text fontSize={'xs'} color="gray.400">
                      list_id: {props.list.internal_id}
                    </Text>
                  )}
                </Stack>
              )}

              {isLoading && (
                <Center>
                  <Spinner />
                </Center>
              )}
              {error && (
                <Center>
                  <Text fontSize="sm" textAlign="center" color="red.400">
                    {t('General.an-error-has-occurred')}!
                    <br />
                    {t('General.refreshPage')}
                  </Text>
                </Center>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              {!isLoading && !error && (
                <>
                  <Button variant="ghost" onClick={handleCancel} mr={3}>
                    {t('General.cancel')}
                  </Button>
                  <Button onClick={saveChanges} disabled={!list.name}>
                    {props.list ? t('General.save') : t('General.create')}
                  </Button>
                </>
              )}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default CreateListModal;

function isValidHttpUrl(string?: string | null) {
  if (!string) return false;

  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
}
