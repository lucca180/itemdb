/* eslint-disable  */
import {
  Button,
  Text,
  Input,
  Stack,
  Textarea,
  Separator,
  HStack,
  Flex,
  Tabs,
  Checkbox,
  Badge,
  Spinner,
  Center,
  Field,
  Link,
  Icon,
  useDisclosure,
  Image,
  NativeSelect,
  VStack,
  Dialog,
  CloseButton,
  Portal,
  Box,
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import {
  EditItemFeedbackJSON,
  ItemData,
  ItemEffect,
  ItemOpenable,
  ItemPetpetData,
  ItemTag,
  PrizePoolData,
} from '../../types';
import { useAuth } from '../../utils/auth';
import ItemCatSelect from '../Input/ItemCategorySelect';
import ItemStatusSelect from '../Input/ItemStatusSelect';
// import TagSelect from '../Input/TagsSelect';
import { FiTrash } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import ItemSelect from '../Input/ItemSelect';
import { CreatePrizePoolForm } from '@components/Input/CreatePrizePoolForm';
import { PrizePoolBadges } from '@components/Items/PrizePoolBadges';
import type { ItemDropSources } from '@utils/item/itemDropSources';
import type {
  CapsuleSyncPreview,
  CapsuleSyncPreviewItem,
  CapsuleSyncResult,
} from '@utils/item/capsuleContentsSync';
import MainLink from '@components/Utils/MainLink';
import { usePathname } from '@i18n/navigation';
import { useTranslations } from 'next-intl';
import SpeciesSelect from '../Input/SpeciesSelect';
import { deseaseList_en } from '../../utils/utils';
import NeoColorSelect from '../Input/NeoColorSelect';
import { UTCDate } from '@date-fns/utc';

const ConfirmDeleteItem = dynamic<{
  isOpen: boolean;
  onClose: () => void;
  item: ItemData;
}>(() => import('./ConfirmDeleteItem'), {
  loading: () => <Spinner />,
});

export type EditItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: ItemData;
  tags: ItemTag[];
  itemOpenable: ItemOpenable | null;
  isItemOpenableLoading?: boolean;
  itemOpenableLoadError?: boolean;
  onRetryItemOpenable?: () => void;
  itemEffects: ItemEffect[];
  petpetData: ItemPetpetData | null;
};

const EditItemModal = (props: EditItemModalProps) => {
  const t = useTranslations();
  const { user } = useAuth();
  const {
    isOpen,
    onClose,
    item: itemProps,
    tags: tagsProps,
    itemOpenable,
    isItemOpenableLoading,
    itemOpenableLoadError,
    onRetryItemOpenable,
    itemEffects,
    petpetData,
  } = props;
  const [item, setItem] = useState<ItemData>(itemProps);
  const [tags, setTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState('info');
  const { onOpen: onDeleteOpen, open: isDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const pathname = usePathname();

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    setItem(itemProps);
  }, [itemProps]);

  useEffect(() => {
    setTags(tagsProps.filter((t) => t.type === 'tag').map((t) => t.name));
    // setCategories(tagsProps.filter((t) => t.type === 'category').map((t) => t.name));
  }, [tagsProps]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (tags: string[], type: 'tags' | 'categories' | 'special') => {
    if (type === 'tags') setTags(tags);
    else if (type === 'categories') setCategories(tags);
    else if (type === 'special') {
      const itemCopy = { ...item };

      if (tags.includes('nc')) {
        itemCopy.isNC = true;
        itemCopy.type = 'nc';
      } else if (tags.includes('np')) {
        itemCopy.isNC = false;
        itemCopy.type = 'np';
      } else if (tags.includes('pb')) {
        itemCopy.isNC = false;
        itemCopy.type = 'pb';
      }

      if (tags.includes('wearable')) itemCopy.isWearable = true;
      else itemCopy.isWearable = false;

      if (tags.includes('neohome')) itemCopy.isNeohome = true;
      else itemCopy.isNeohome = false;

      if (tags.includes('battledome')) itemCopy.isBD = true;
      else itemCopy.isBD = false;

      setItem(itemCopy);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;

    setItem((prev) => {
      const itemCopy = { ...prev };
      //@ts-expect-error ts is dumb
      itemCopy.useTypes[name] = value;
      return itemCopy;
    });
  };

  const saveChanges = async () => {
    setLoading(true);
    try {
      const res = await axios.patch('/api/v1/items/' + item.internal_id, {
        itemData: item,
        itemCats: categories,
        itemTags: tags,
      });

      setLoading(false);

      if (res.data.success) setIsSuccess(true);
      else throw res.data;
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError(true);
    }
  };

  const sendFeedback = async () => {
    setLoading(true);
    try {
      const feedbackJSON: EditItemFeedbackJSON = {
        itemTags: tags,
        itemNotes: item.comment ?? undefined,
      };

      let hasChanges = false;
      hasChanges = !tags.every((t) => tagsProps.map((t) => t.name).includes(t));
      hasChanges = hasChanges || item.comment !== itemProps.comment;

      if (!hasChanges) throw 'No changes made';

      const res = await axios.post('/api/feedback/send', {
        pageInfo: pathname,
        subject_id: item.internal_id,
        user_id: user?.id,
        email: user?.email,
        type: 'itemChange',
        json: JSON.stringify(feedbackJSON),
      });

      setLoading(false);

      if (res.data.success) setIsSuccess(true);
      else throw res.data;
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError(true);
    }
  };

  const handleCancel = () => {
    setItem(itemProps);
    setTags([]);
    setCategories([]);
    setIsSuccess(false);
    setError(false);
    onClose();
  };

  return (
    <>
      <ConfirmDeleteItem isOpen={isDeleteOpen} onClose={onDeleteClose} item={item} />
      <Dialog.Root
        open={isOpen}
        onOpenChange={({ open }) => {
          if (!open) handleCancel();
        }}
        placement="center"
        size="lg"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>
                  {isAdmin ? t('Button.edit') : t('Feedback.suggest-changes')} - {itemProps.name}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
              <Dialog.Body>
                {!isLoading && !isSuccess && !error && (
                  <Tabs.Root
                    variant="line"
                    colorPalette="gray"
                    lazyMount
                    unmountOnExit
                    value={tabValue}
                    onValueChange={(e) => setTabValue(e.value)}
                  >
                    <Tabs.List>
                      <Tabs.Trigger value="info">{t('ItemPage.item-info')}</Tabs.Trigger>
                      {isAdmin && (
                        <Tabs.Trigger value="categories">{t('ItemPage.categories')}</Tabs.Trigger>
                      )}
                      {isAdmin && <Tabs.Trigger value="drops">{t('ItemPage.drops')}</Tabs.Trigger>}
                      {isAdmin && <Tabs.Trigger value="effects">Item Effects</Tabs.Trigger>}
                      {isAdmin && <Tabs.Trigger value="petpet">Petpet</Tabs.Trigger>}
                    </Tabs.List>
                    <Tabs.Content value="info">
                      <InfoTab item={item} itemProps={itemProps} onChange={handleChange} />
                    </Tabs.Content>
                    {isAdmin && (
                      <Tabs.Content value="categories">
                        <CategoriesTab
                          categories={categories}
                          tags={tags}
                          item={item}
                          itemProps={itemProps}
                          onSelectChange={handleSelectChange}
                          onChange={handleTagsChange}
                        />
                      </Tabs.Content>
                    )}
                    {isAdmin && (
                      <Tabs.Content value="drops">
                        <OpenableTab
                          itemOpenable={itemOpenable}
                          isItemOpenableLoading={isItemOpenableLoading}
                          itemOpenableLoadError={itemOpenableLoadError}
                          onRetryItemOpenable={onRetryItemOpenable}
                          item={item}
                          savedCanOpen={itemProps.useTypes.canOpen}
                        />
                      </Tabs.Content>
                    )}
                    {isAdmin && (
                      <Tabs.Content value="effects">
                        <EffectsTab item={item} itemEffects={itemEffects} />
                      </Tabs.Content>
                    )}
                    {isAdmin && (
                      <Tabs.Content value="petpet">
                        <PetpetTab item={item} petpetData={petpetData} />
                      </Tabs.Content>
                    )}
                  </Tabs.Root>
                )}
                {isLoading && (
                  <Center>
                    <Spinner />
                  </Center>
                )}
                {isSuccess && !isAdmin && (
                  <Center>
                    <Text fontSize="sm" textAlign="center">
                      {t('Feedback.thank-you')}!
                      <br />
                      {t('Feedback.receivedSuggestion')}
                    </Text>
                  </Center>
                )}
                {isSuccess && isAdmin && (
                  <Center>
                    <Text fontSize="sm" textAlign="center">
                      {t('Feedback.changes-saved')}!
                      <br />
                      {t('Feedback.caching')}
                    </Text>
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
                {!isLoading &&
                  !isSuccess &&
                  !error &&
                  (tabValue === 'info' || tabValue === 'categories') && (
                    <>
                      <Button
                        variant="outline"
                        colorPalette="red"
                        onClick={onDeleteOpen}
                        display={isAdmin ? 'inherit' : 'none'}
                      >
                        <Icon as={FiTrash} mr={1} /> {t('ItemPage.delete-item')}
                      </Button>
                      <Button onClick={handleCancel} variant="ghost" mx={3}>
                        {t('General.cancel')}
                      </Button>
                      <Button onClick={isAdmin ? saveChanges : sendFeedback}>
                        {isAdmin ? t('General.save') : t('General.send')}
                      </Button>
                    </>
                  )}
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
};

export default EditItemModal;

// ------- Info Tab ------- //

type infoTabProps = {
  item: ItemData;
  itemProps: ItemData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};

export const InfoTab = (props: infoTabProps) => {
  const t = useTranslations();
  const { item, itemProps, onChange: handleChange } = props;
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';

  return (
    <Flex flexFlow="column" gap={4} maxH="500px" px={3} overflow={'auto'}>
      {!isAdmin && (
        <>
          <Text fontSize="sm" css={{ '& a': { color: 'blue.300' } }}>
            {t.rich('Feedback.correctItemInfo', {
              Link: (chunks) => (
                <Link asChild color="gray.200">
                  <MainLink href="/contribute">{chunks}</MainLink>
                </Link>
              ),
            })}
          </Text>
          <Text fontSize="sm">
            {t.rich('ItemPage.modalFeedbackCallback', {
              b: (chunks) => <b>{chunks}</b>,
            })}
          </Text>
        </>
      )}
      {isAdmin && (
        <>
          <Stack>
            <Field.Root>
              <Field.Label color="gray.300">{t('General.item-name')}</Field.Label>
              <Input
                variant="subtle"
                type="text"
                name="name"
                size="sm"
                value={item.name}
                onChange={handleChange}
                disabled={!isAdmin}
                color={item.name === itemProps.name ? 'gray.400' : '#fff'}
              />
            </Field.Root>
            <Field.Root>
              <Field.Label color="gray.300">{t('General.description')}</Field.Label>
              <Textarea
                color={item.description === itemProps.description ? 'gray.400' : '#fff'}
                value={item.description}
                variant="subtle"
                name="description"
                onChange={handleChange}
                disabled={!isAdmin}
                size="sm"
              />
            </Field.Root>
            <Field.Root>
              <Field.Label color="gray.300">{t('General.image-url')}</Field.Label>
              <Input
                variant="subtle"
                type="text"
                name="image"
                size="sm"
                value={item.image}
                onChange={handleChange}
                disabled={!isAdmin}
                color={item.image === itemProps.image ? 'gray.400' : '#fff'}
              />
            </Field.Root>
            <HStack>
              <Field.Root>
                <Field.Label color="gray.300">{t('General.canonical-id')}</Field.Label>
                <Input
                  variant="subtle"
                  type="text"
                  name="canonical_id"
                  size="sm"
                  value={item.canonical_id ?? ''}
                  onChange={handleChange}
                  disabled={!isAdmin}
                  color={item.canonical_id == itemProps.canonical_id ? 'gray.400' : '#fff'}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label color="gray.300">{t('ItemPage.first-seen')}</Field.Label>
                <Input
                  variant="subtle"
                  type="date"
                  name="firstSeen"
                  size="sm"
                  value={item.firstSeen ? toDateInput(item.firstSeen) : undefined}
                  onChange={handleChange}
                  disabled={!isAdmin}
                  color={item.firstSeen == itemProps.firstSeen ? 'gray.400' : '#fff'}
                />
              </Field.Root>
            </HStack>
          </Stack>
          <Separator />
          <HStack>
            <Field.Root>
              <Field.Label color="gray.300">{t('General.item-id')}</Field.Label>
              <Input
                variant="subtle"
                type="text"
                name="item_id"
                size="sm"
                value={item.item_id ?? ''}
                onChange={handleChange}
                disabled={!isAdmin}
                color={item.item_id == itemProps.item_id ? 'gray.400' : '#fff'}
              />
            </Field.Root>
            <Field.Root>
              <Field.Label color="gray.300">{t('General.rarity')}</Field.Label>
              <Input
                variant="subtle"
                type="text"
                name="rarity"
                size="sm"
                value={item.rarity ?? ''}
                onChange={handleChange}
                disabled={!isAdmin}
                color={item.rarity == itemProps.rarity ? 'gray.400' : '#fff'}
              />
            </Field.Root>
          </HStack>
          <HStack>
            <Field.Root>
              <Field.Label color="gray.300">{t('General.est-val')}</Field.Label>
              <Input
                variant="subtle"
                type="text"
                name="estVal"
                size="sm"
                value={item.estVal ?? ''}
                onChange={handleChange}
                disabled={!isAdmin}
                color={item.estVal == itemProps.estVal ? 'gray.400' : '#fff'}
              />
            </Field.Root>
            <Field.Root>
              <Field.Label color="gray.300">{t('General.weight')}</Field.Label>
              <Input
                variant="subtle"
                type="text"
                name="weight"
                size="sm"
                value={item.weight ?? ''}
                onChange={handleChange}
                disabled={!isAdmin}
                color={item.weight == itemProps.weight ? 'gray.400' : '#fff'}
              />
            </Field.Root>
          </HStack>
          <HStack>
            <Field.Root>
              <Field.Label color="gray.300">{t('General.category')}</Field.Label>
              <ItemCatSelect
                name="category"
                value={item.category ?? ''}
                onChange={handleChange}
                isDisabled={!isAdmin}
                color={item.category == itemProps.category ? 'gray.400' : '#fff'}
              />
            </Field.Root>
          </HStack>
          <HStack>
            <Field.Root>
              <Field.Label color="gray.300">{t('General.status')}</Field.Label>
              <ItemStatusSelect
                name="status"
                value={item.status ?? ''}
                onChange={handleChange}
                isDisabled={!isAdmin}
                color={item.status == itemProps.status ? 'gray.400' : '#fff'}
              />
            </Field.Root>
          </HStack>
          <Field.Root>
            <Field.Label color="gray.300">Item Flags</Field.Label>
            <Input
              variant="subtle"
              type="text"
              name="itemFlags"
              size="sm"
              value={item.itemFlags ?? ''}
              onChange={handleChange}
              color={item.itemFlags == itemProps.itemFlags ? 'gray.400' : '#fff'}
              disabled={!isAdmin}
            />
            <Field.HelperText fontSize={'xs'}>Use comma for multiple flags</Field.HelperText>
          </Field.Root>
        </>
      )}
      <Field.Root>
        <Field.Label color="gray.300">{t('ItemPage.notes')}</Field.Label>
        <Textarea
          color={item.comment === itemProps.comment ? 'gray.400' : '#fff'}
          value={item.comment ?? ''}
          variant="subtle"
          name="comment"
          onChange={handleChange}
          size="sm"
        />
        <Field.HelperText>
          {t('ItemPage.modalDoNotCopy')}
          <br />
          {t.rich('Feedback.modalContributeCallback', {
            Link: (chunks) => (
              <Link asChild color="gray.300">
                <MainLink href="/contribute">{chunks}</MainLink>
              </Link>
            ),
          })}
        </Field.HelperText>
      </Field.Root>
    </Flex>
  );
};

// ------- Categories and Tags Tab ------- //

type TagSelectProps = {
  item: ItemData;
  itemProps: ItemData;
  categories: string[];
  tags: string[];
  onChange: (tags: string[], type: 'categories' | 'tags' | 'special') => void;
  onSelectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

export const CategoriesTab = (props: TagSelectProps) => {
  const t = useTranslations();
  const { item, onChange: handleChange, onSelectChange } = props;
  const [specialTags, setSpecialTags] = useState<string[]>([]);
  const { user } = useAuth();

  const isAdmin = user?.role == 'ADMIN';

  useEffect(() => {
    const tempTags = [];

    tempTags.push(item.type);

    if (item.isWearable) tempTags.push('wearable');

    if (item.isNeohome) tempTags.push('neohome');

    if (item.isBD) tempTags.push('battledome');

    setSpecialTags(tempTags);
  }, [item]);

  const handleSpecialTags = (newTags: string[]) => {
    let tempTags = [...specialTags];

    if (newTags.includes('nc') && !specialTags.includes('nc')) {
      tempTags.push('nc');
      tempTags = tempTags.filter((tag) => !['np', 'pb'].includes(tag));
    } else if (newTags.includes('np') && !specialTags.includes('np')) {
      tempTags.push('np');
      tempTags = tempTags.filter((tag) => !['nc', 'pb'].includes(tag));
    } else if (newTags.includes('pb') && !specialTags.includes('pb')) {
      tempTags.push('pb');
      tempTags = tempTags.filter((tag) => !['np', 'nc'].includes(tag));
    } else tempTags = newTags;

    handleChange(tempTags, 'special');
    setSpecialTags(tempTags);
  };

  const handleSpecialTagToggle = (tag: string) => {
    const next = specialTags.includes(tag)
      ? specialTags.filter((specialTag) => specialTag !== tag)
      : [...specialTags, tag];

    handleSpecialTags(next);
  };

  return (
    <Stack flexFlow="column" gap={4}>
      {isAdmin && (
        <Field.Root>
          <Field.Label color="gray.300">{t('ItemPage.special-tags')}</Field.Label>
          <Stack gap={3} direction="row" wrap="wrap" justifyContent="center">
            {(
              [
                { value: 'np', label: <Badge colorPalette="green">NP</Badge> },
                { value: 'nc', label: <Badge colorPalette="purple">NC</Badge> },
                { value: 'pb', label: <Badge colorPalette="yellow">PB</Badge> },
                {
                  value: 'wearable',
                  label: <Badge colorPalette="blue">{t('General.wearable')}</Badge>,
                },
                {
                  value: 'neohome',
                  label: <Badge colorPalette="cyan">{t('General.neohome')}</Badge>,
                },
                {
                  value: 'battledome',
                  label: <Badge colorPalette="red">{t('General.battledome')}</Badge>,
                },
              ] as const
            ).map(({ value, label }) => (
              <Checkbox.Root
                key={value}
                checked={specialTags.includes(value)}
                cursor="pointer"
                userSelect="none"
                onClick={(event) => {
                  event.preventDefault();
                  handleSpecialTagToggle(value);
                }}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control cursor="pointer">
                  <Checkbox.Indicator cursor="pointer" />
                </Checkbox.Control>
                <Checkbox.Label cursor="pointer">{label}</Checkbox.Label>
              </Checkbox.Root>
            ))}
          </Stack>
        </Field.Root>
      )}
      <Field.Root>
        <Field.Label color="gray.300">{t('ItemPage.usage-type')}</Field.Label>
        <Stack>
          <Stack direction="row" alignItems={'center'}>
            <Badge colorPalette="orange">{t('General.readable')}</Badge>
            <NativeSelect.Root size="sm" variant="subtle">
              <NativeSelect.Field
                value={item.useTypes.canRead}
                onChange={onSelectChange}
                name="canRead"
              >
                <option value="unknown">Unknown</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Stack>

          <Stack direction="row" alignItems={'center'}>
            <Badge colorPalette="orange">{t('General.edible')}</Badge>
            <NativeSelect.Root size="sm" variant="subtle">
              <NativeSelect.Field
                value={item.useTypes.canEat}
                onChange={onSelectChange}
                name="canEat"
              >
                <option value="unknown">Unknown</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Stack>

          <Stack direction="row" alignItems={'center'}>
            <Badge colorPalette="orange">{t('General.playable')}</Badge>
            <NativeSelect.Root size="sm" variant="subtle">
              <NativeSelect.Field
                value={item.useTypes.canPlay}
                onChange={onSelectChange}
                name="canPlay"
              >
                <option value="unknown">Unknown</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Stack>

          <Stack direction="row" alignItems={'center'}>
            <Badge colorPalette="orange">{t('General.openable')}</Badge>
            <NativeSelect.Root size="sm" variant="subtle">
              <NativeSelect.Field
                value={item.useTypes.canOpen}
                onChange={onSelectChange}
                name="canOpen"
              >
                <option value="unknown">Unknown</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Stack>
        </Stack>
      </Field.Root>
      {/* <Field.Root>
        <Field.Label color="gray.300">Tags (max. 15)</Field.Label>
        <TagSelect
          value={tags}
          onChange={(vals) => handleChange(vals, 'tags')}
          type="tags"
          disabled={categories.length >= 15}
        />
        <Field.HelperText>
          Prefer to use existing tags instead of creating new ones.
          <br />
          <br />
          Tags should describe the item itself and not meta information (like how/where to get it){' '}
          <br />
          <br />
          Tags must not contain words that are in the item name
        </Field.HelperText>
      </Field.Root> */}
    </Stack>
  );
};

// ------- Openable Tab ------- //

type OpenableTabProps = {
  itemOpenable: ItemOpenable | null;
  isItemOpenableLoading?: boolean;
  itemOpenableLoadError?: boolean;
  onRetryItemOpenable?: () => void;
  item: ItemData;
  /** canOpen as persisted — drops are neither loaded nor shown while it is 'false'. */
  savedCanOpen: ItemData['useTypes']['canOpen'];
};

const defaultItemOpenable: ItemOpenable = {
  openings: 0,
  pools: {},
  drops: {},
  notes: null,
  hasLE: false,
  isGBC: false,
  isChoice: false,
  isGram: false,
  maxDrop: 0,
  minDrop: 0,
};

type DropAction =
  | { action: 'add'; poolName: string; drop_id: number; isLE: boolean }
  | { action: 'remove'; poolName: string; drop_id: number }
  | { action: 'set-le'; poolName: string; drop_id: number; isLE: boolean }
  | { action: 'rename-pool'; poolName: string; newPoolName: string }
  | { action: 'delete-pool'; poolName: string };

export const OpenableTab = (props: OpenableTabProps) => {
  const {
    itemOpenable: itemOpenableProps,
    isItemOpenableLoading,
    itemOpenableLoadError,
    onRetryItemOpenable,
    item,
    savedCanOpen,
  } = props;
  const [itemOpenable, setItemOpenable] = useState<ItemOpenable | null>(
    itemOpenableProps ?? defaultItemOpenable
  );
  const [dropData, setDropData] = useState<{ [id: number]: ItemData }>({});
  /** null = not loaded (or failed): origins are hidden and the X stays enabled. */
  const [sources, setSources] = useState<Record<number, ItemDropSources> | null>(null);
  const [sourcesError, setSourcesError] = useState(false);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isItemOpenableLoading) return;
    if (itemOpenableLoadError) {
      setItemOpenable(null);
      return;
    }
    if (itemOpenableProps) {
      setItemOpenable(itemOpenableProps);
    } else if (itemOpenableProps === null) {
      setItemOpenable(defaultItemOpenable);
    }
  }, [itemOpenableProps, isItemOpenableLoading, itemOpenableLoadError]);

  useEffect(() => {
    if (!itemOpenable || isItemOpenableLoading || itemOpenableLoadError) return;
    init();
  }, [itemOpenable, isItemOpenableLoading, itemOpenableLoadError]);

  const loadSources = () => {
    setSourcesError(false);
    axios
      .get<{ sources: Record<number, ItemDropSources> }>(
        `/api/admin/item-drops/${item.internal_id}`
      )
      .then((res) => setSources(res.data.sources))
      .catch(() => setSourcesError(true));
  };

  useEffect(() => {
    if (savedCanOpen === 'false') return;
    loadSources();
  }, [item.internal_id, savedCanOpen]);

  const onCapsuleSynced = (result: CapsuleSyncResult) => {
    setSyncMessage(`Synced ${result.dropsSynced} drops from ${result.capsuleName}.`);
    loadSources();
    onRetryItemOpenable?.();
  };

  const init = async () => {
    if (!itemOpenable) return;
    setLoading(true);
    try {
      const itemRes = await axios.post(`/api/v1/items/many`, {
        id: Object.keys(itemOpenable.drops),
      });

      setDropData(itemRes.data);
    } catch (err) {
      console.error(err);
      setActionError('Failed to load the drop items.');
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (body: DropAction) => {
    setLoading(true);
    setActionError(null);

    try {
      const res = await axios.patch(`/api/v1/items/${item.slug}/drops`, body);

      setSources(res.data.sources ?? null);
      // new object so init() always runs and clears the loading state
      setItemOpenable(res.data.dropUpdate ?? { ...defaultItemOpenable });
    } catch (err) {
      console.error(err);
      setActionError('Something went wrong. Try again.');
      setLoading(false);
    }
  };

  const createPool = (poolName: string) => {
    if (!itemOpenable) return;
    const newPool: PrizePoolData = {
      name: poolName,
      items: [],
      openings: 0,
      maxDrop: 0,
      minDrop: 0,
      isChance: false,
      isLE: false,
      totalDrops: 0,
    };

    const newOpenable: ItemOpenable = {
      ...itemOpenable,
      pools: {
        [poolName]: newPool,
        ...itemOpenable.pools,
      },
    };

    setItemOpenable(newOpenable);
  };

  /** Pools without items only exist in this tab until the first drop is added. */
  const updateLocalPool = (poolName: string, newPoolName: string | null) => {
    if (!itemOpenable) return;
    const pools = { ...itemOpenable.pools };
    const pool = pools[poolName];
    delete pools[poolName];
    if (newPoolName && pool) pools[newPoolName] = { ...pool, name: newPoolName };

    setItemOpenable({ ...itemOpenable, pools });
  };

  if (savedCanOpen === 'false') {
    return (
      <Center py={8} flexDirection="column" gap={2} textAlign="center">
        <Text fontWeight="bold">This item is marked as not openable.</Text>
        <Text fontSize="sm" color="gray.300">
          Drops are hidden while Openable is False. Set Openable to True in the Item Info tab and
          save to manage this item&apos;s drops.
        </Text>
      </Center>
    );
  }

  if (isItemOpenableLoading) {
    return (
      <Center py={8}>
        <Spinner />
      </Center>
    );
  }

  if (itemOpenableLoadError) {
    return (
      <Center py={8} flexDirection="column" gap={3}>
        <Text color="red.400">Failed to load openable data.</Text>
        {onRetryItemOpenable && (
          <Button size="sm" onClick={onRetryItemOpenable}>
            Retry
          </Button>
        )}
      </Center>
    );
  }

  return (
    <Flex flexFlow="column" gap={3}>
      {item.isNC && item.item_id && (
        <CapsuleSyncPanel itemId={item.item_id} sources={sources} onApplied={onCapsuleSynced} />
      )}
      {syncMessage && (
        <Text fontSize="sm" color="green.300" textAlign="center">
          {syncMessage}
        </Text>
      )}
      <Flex flexFlow={'column'} bg="blackAlpha.300" p={2} gap={3}>
        <CreatePrizePoolForm onSubmit={createPool} />
      </Flex>
      {actionError && (
        <Text fontSize="sm" color="red.300" textAlign="center">
          {actionError}
        </Text>
      )}
      {sourcesError && (
        <Text fontSize="xs" color="orange.300" textAlign="center">
          Failed to load drop origins. LE toggles are disabled.
        </Text>
      )}
      {itemOpenable &&
        Object.values(itemOpenable.pools).map((pool) => (
          <PoolEditor
            key={pool.name}
            pool={pool}
            drops={itemOpenable.drops}
            dropData={dropData}
            sources={sources}
            isLoading={isLoading}
            onAction={runAction}
            onLocalChange={updateLocalPool}
          />
        ))}
    </Flex>
  );
};

type PoolEditorProps = {
  pool: PrizePoolData;
  drops: ItemOpenable['drops'];
  dropData: { [id: number]: ItemData };
  sources: Record<number, ItemDropSources> | null;
  isLoading: boolean;
  onAction: (body: DropAction) => void;
  onLocalChange: (poolName: string, newPoolName: string | null) => void;
};

const PoolEditor = (props: PoolEditorProps) => {
  const { pool, drops, dropData, sources, isLoading, onAction, onLocalChange } = props;
  const [mode, setMode] = useState<'view' | 'rename' | 'delete'>('view');
  const [addAsLE, setAddAsLE] = useState(false);

  const poolItems = Array.from(new Set(pool.items));
  const isLocal = poolItems.length === 0;
  const manualCount = poolItems.filter((id) =>
    sources?.[id]?.manualPools.includes(pool.name)
  ).length;
  const otherCount = poolItems.length - manualCount;
  const canEditPool = isLocal || manualCount > 0;

  const rename = (newPoolName: string) => {
    setMode('view');
    if (newPoolName === pool.name) return;
    if (isLocal) onLocalChange(pool.name, newPoolName);
    else onAction({ action: 'rename-pool', poolName: pool.name, newPoolName });
  };

  const remove = () => {
    setMode('view');
    if (isLocal) onLocalChange(pool.name, null);
    else onAction({ action: 'delete-pool', poolName: pool.name });
  };

  return (
    <Flex flexFlow={'column'} bg="blackAlpha.300" p={2} gap={2}>
      <Flex justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
        <VStack gap={1} alignItems="flex-start">
          <Text fontSize={'sm'} textTransform="capitalize" fontWeight="bold">
            Prize Pool - {pool.name}
          </Text>
          <HStack gap={1} flexWrap="wrap">
            <PrizePoolBadges name={pool.name} isChance={pool.isChance} />
            {pool.openings > 0 && (
              <Badge size="sm" variant="outline">
                {pool.openings} openings
              </Badge>
            )}
          </HStack>
        </VStack>
        {canEditPool && mode === 'view' && (
          <HStack gap={1}>
            <Button size="xs" variant="ghost" onClick={() => setMode('rename')}>
              Rename
            </Button>
            <Button size="xs" variant="ghost" colorPalette="red" onClick={() => setMode('delete')}>
              Delete
            </Button>
          </HStack>
        )}
      </Flex>

      {mode === 'rename' && (
        <Flex flexFlow="column" gap={2} bg="blackAlpha.300" p={2} borderRadius="md">
          <CreatePrizePoolForm
            initialName={pool.name}
            submitLabel="Rename"
            onSubmit={rename}
            onCancel={() => setMode('view')}
          />
          {otherCount > 0 && (
            <Text fontSize="xs" color="orange.300">
              Only the {manualCount} manual drop(s) move to the new name. Sync and community drops
              stay in &quot;{pool.name}&quot;.
            </Text>
          )}
        </Flex>
      )}

      {mode === 'delete' && (
        <Flex flexFlow="column" gap={2} bg="blackAlpha.300" p={2} borderRadius="md">
          <Text fontSize="sm">
            {isLocal
              ? 'Delete this empty pool?'
              : `Delete the ${manualCount} manual drop(s) of this pool?`}
          </Text>
          {otherCount > 0 && (
            <Text fontSize="xs" color="orange.300">
              {otherCount} sync/community drop(s) will stay in this pool.
            </Text>
          )}
          <HStack>
            <Button size="xs" colorPalette="red" onClick={remove}>
              Delete
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setMode('view')}>
              Cancel
            </Button>
          </HStack>
        </Flex>
      )}

      {!isLoading && (
        <Flex flexFlow={'column'} gap={3} mt={1}>
          {poolItems.map((itemId) => {
            const itemData = dropData[itemId];
            if (!itemData) return null;

            const source = sources?.[itemId];
            const isManual = !!source?.manualPools.includes(pool.name);
            const isManualLE = !!source?.manualLEPools.includes(pool.name);
            const otherLE = !!(source?.syncLE || source?.communityLE);
            const isLE = isManualLE || otherLE || (!source && !!drops[itemId]?.isLE);

            let leHint = isManualLE ? 'Unmark as LE' : 'Mark as LE in this pool';
            if (!sources) leHint = 'Drop origins not loaded';
            else if (source?.hasSync) leHint = 'Controlled by the sync';
            else if (otherLE && !isManualLE) leHint = 'LE from community reports';

            const canToggleLE = !!sources && !source?.hasSync && !(otherLE && !isManualLE);
            const canRemove = !sources || isManual;

            return (
              <Flex key={itemData.internal_id} alignItems="center" gap={2} flexWrap="wrap">
                <Image src={itemData.image} width="30px" height="30px" alt={itemData.description} />
                <Text fontSize={'sm'} flex={1}>
                  {itemData.name}
                </Text>
                <DropSourceBadges source={source} isManual={isManual} />
                {!pool.isLE && (
                  <span title={leHint}>
                    <Button
                      size="xs"
                      variant={isLE ? 'solid' : 'outline'}
                      colorPalette={isLE ? 'green' : 'gray'}
                      disabled={!canToggleLE}
                      onClick={() =>
                        onAction({
                          action: 'set-le',
                          poolName: pool.name,
                          drop_id: itemData.internal_id,
                          isLE: !isManualLE,
                        })
                      }
                    >
                      LE
                    </Button>
                  </span>
                )}
                <span title={canRemove ? 'Remove' : 'Only manual drops can be removed'}>
                  <Button
                    size="xs"
                    colorPalette="red"
                    variant="ghost"
                    disabled={!canRemove}
                    onClick={() =>
                      onAction({
                        action: 'remove',
                        poolName: pool.name,
                        drop_id: itemData.internal_id,
                      })
                    }
                  >
                    X
                  </Button>
                </span>
              </Flex>
            );
          })}
          <HStack>
            <Box flex={1}>
              <ItemSelect
                onChange={(newItem) =>
                  onAction({
                    action: 'add',
                    poolName: pool.name,
                    drop_id: newItem.internal_id,
                    isLE: addAsLE && !pool.isLE,
                  })
                }
              />
            </Box>
            {!pool.isLE && (
              <Checkbox.Root
                size="sm"
                checked={addAsLE}
                onCheckedChange={(e) => setAddAsLE(!!e.checked)}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>LE</Checkbox.Label>
              </Checkbox.Root>
            )}
          </HStack>
        </Flex>
      )}
      {isLoading && (
        <Center>
          <Spinner />
        </Center>
      )}
    </Flex>
  );
};

const DropSourceBadges = ({
  source,
  isManual,
}: {
  source: ItemDropSources | undefined;
  isManual: boolean;
}) => {
  if (!source) return null;

  return (
    <HStack gap={1}>
      {isManual && (
        <Badge size="sm" colorPalette="blue">
          Manual
        </Badge>
      )}
      {source.hasSync && (
        <Badge size="sm" colorPalette="purple">
          Sync
        </Badge>
      )}
      {source.communityOpenings > 0 && (
        <Badge size="sm" variant="outline">
          {source.communityOpenings} reports
        </Badge>
      )}
    </HStack>
  );
};

const SYNC_STATUS_COLORS: Record<CapsuleSyncPreviewItem['status'], string> = {
  added: 'green',
  changed: 'orange',
  removed: 'red',
  unchanged: 'gray',
};

const SYNC_STATUS_LABELS: Record<CapsuleSyncPreviewItem['status'], string> = {
  added: 'added',
  changed: 'changed',
  removed: 'sync row removed',
  unchanged: 'unchanged',
};

const formatSyncRow = (row: { isLE: boolean; pool: string | null }) =>
  [row.isLE ? 'LE' : null, row.pool].filter(Boolean).join(' · ') || 'no pool';

type CapsuleSyncPanelProps = {
  itemId: number;
  /** Used to tell whether an item that leaves the sync still has other drop rows. */
  sources: Record<number, ItemDropSources> | null;
  onApplied: (result: CapsuleSyncResult) => void;
};

/** Dry run of the capsule contents sync, applied only after the admin accepts it. */
const CapsuleSyncPanel = ({ itemId, sources, onApplied }: CapsuleSyncPanelProps) => {
  const [preview, setPreview] = useState<CapsuleSyncPreview | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = async (dryRun: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/admin/capsule-sync', { itemId, dryRun });
      if (dryRun) setPreview(res.data);
      else {
        setPreview(null);
        onApplied(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(dryRun ? 'Failed to fetch the capsule contents.' : 'Failed to apply the sync.');
    } finally {
      setLoading(false);
    }
  };

  const changes = preview?.items.filter((row) => row.status !== 'unchanged') ?? [];
  const countBy = (status: CapsuleSyncPreviewItem['status']) =>
    preview?.items.filter((row) => row.status === status).length ?? 0;
  const newItems = preview?.items.filter((row) => row.item_iid === null).length ?? 0;

  /** Whether an item losing its sync row keeps manual or community rows in this capsule. */
  const staysInDrops = (row: CapsuleSyncPreviewItem) => {
    const source = row.item_iid !== null ? sources?.[row.item_iid] : undefined;
    return !!source && (source.manualPools.length > 0 || source.communityOpenings > 0);
  };

  return (
    <Flex flexFlow="column" bg="blackAlpha.300" p={2} gap={2}>
      {!preview && (
        <Button size="xs" variant="outline" loading={isLoading} onClick={() => request(true)}>
          Preview capsule sync
        </Button>
      )}
      {error && (
        <Text fontSize="xs" color="red.300" textAlign="center">
          {error}
        </Text>
      )}
      {preview && (
        <>
          <Text fontSize="sm" fontWeight="bold">
            {preview.capsuleName} · {preview.itemsFound} items on the NC Mall
          </Text>
          <HStack gap={1} flexWrap="wrap">
            {(['added', 'changed', 'removed', 'unchanged'] as const).map((status) => (
              <Badge key={status} size="sm" colorPalette={SYNC_STATUS_COLORS[status]}>
                {countBy(status)} {SYNC_STATUS_LABELS[status]}
              </Badge>
            ))}
            {newItems > 0 && (
              <Badge size="sm" colorPalette="purple">
                {newItems} new to itemdb
              </Badge>
            )}
          </HStack>
          {preview.itemsFound === 0 && (
            <Text fontSize="xs" color="orange.300">
              API returned no items. Nothing would change.
            </Text>
          )}
          {preview.itemsFound > 0 && !changes.length && (
            <Text fontSize="xs" color="gray.400">
              Nothing would change.
            </Text>
          )}
          {changes.map((row) => (
            <Flex key={`${row.status}-${row.item_id ?? row.item_iid}`} alignItems="center" gap={2}>
              {row.img && <Image src={row.img} width="30px" height="30px" alt={row.name} />}
              <Text fontSize="sm" flex={1}>
                {row.name}
              </Text>
              <Text fontSize="xs" color="gray.400">
                {row.status === 'changed' && row.previous && `${formatSyncRow(row.previous)} → `}
                {formatSyncRow(row)}
                {row.status === 'removed' &&
                  (staysInDrops(row)
                    ? ' · stays via manual/community rows'
                    : ' · leaves the drops')}
              </Text>
              <Badge size="sm" colorPalette={SYNC_STATUS_COLORS[row.status]}>
                {row.item_iid === null ? 'new item' : SYNC_STATUS_LABELS[row.status]}
              </Badge>
            </Flex>
          ))}
          <HStack>
            {changes.length > 0 && (
              <Button
                size="xs"
                colorPalette="green"
                flex={1}
                loading={isLoading}
                onClick={() => request(false)}
              >
                Apply sync
              </Button>
            )}
            <Button size="xs" variant="ghost" disabled={isLoading} onClick={() => setPreview(null)}>
              {changes.length > 0 ? 'Ignore' : 'Close'}
            </Button>
          </HStack>
        </>
      )}
    </Flex>
  );
};

// ------- Item Effects Tab ------- //

type EffectsTabProps = {
  item: ItemData;
  itemEffects: ItemEffect[];
};

const statsType = [
  'Max HP',
  'Strength',
  'Level',
  'Defence',
  'Movement',
  'Intelligence',
  'Weight',
  'Height',
];

const defaultEffect: ItemEffect = {
  type: 'other',
  name: '',
  isChance: false,
};

export const EffectsTab = (props: EffectsTabProps) => {
  const { item } = props;
  const [effects, setEffects] = useState<ItemEffect[]>(props.itemEffects);
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setLoading] = useState<boolean>(false);

  const saveChanges = async () => {
    const missingPetpetColor = effects.some(
      (effect) => effect.type === 'petpetColor' && !effect.colorTarget?.trim()
    );
    if (missingPetpetColor) {
      setError('Petpet color is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const create = effects.filter((effect) => !effect.internal_id);
      const update = effects.filter((effect) => effect.internal_id && effect.internal_id > 0);

      const createProm = create.map((effect) => {
        return axios.post(`/api/v1/items/${item.internal_id}/effects`, {
          effect,
        });
      });

      const updateProm = update.map((effect) => {
        return axios.patch(`/api/v1/items/${item.internal_id}/effects`, {
          effect,
          effect_id: effect.internal_id,
        });
      });

      const res = await Promise.all([...createProm, ...updateProm]);
      const newEffects = res.map((r) => r.data);
      setEffects(newEffects);

      setUnsavedChanges(false);
      setLoading(false);
    } catch (e: any) {
      console.error(e);
      setError(
        e?.response?.data?.error ||
          'An error occurred while saving the effects. Please REFRESH the page and try later.'
      );
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    index: number
  ) => {
    const name = e.target.name as keyof ItemEffect;
    const value = e.target.value;

    setEffects((prev) => {
      const newEffects = [...prev];
      const defaultCpy = JSON.parse(JSON.stringify(defaultEffect));

      let effect = newEffects[index] ?? defaultCpy;
      if (name === 'type') effect = defaultCpy;

      effect.internal_id = newEffects[index]?.internal_id;

      //@ts-expect-error ts is dumb
      effect[name] = value;

      if (name === 'isChance') effect[name] = value === 'true';
      newEffects[index] = JSON.parse(JSON.stringify(effect));
      return newEffects;
    });

    setUnsavedChanges(true);
  };

  const handleSpeciesChange = (species: string[], index: number) => {
    setEffects((prev) => {
      const newEffects = [...prev];
      newEffects[index].species = species;
      return newEffects;
    });

    setUnsavedChanges(true);
  };

  const handleColorSpeciesChange = (
    newVal: string,
    name: 'colorTarget' | 'speciesTarget',
    index: number
  ) => {
    setEffects((prev) => {
      const newEffects = [...prev];
      newEffects[index][name] = newVal;
      return newEffects;
    });

    setUnsavedChanges(true);
  };

  const addEffect = () => {
    setUnsavedChanges(true);
    setEffects((prev) => [...prev, defaultEffect]);
  };

  const removeEffect = async (index: number) => {
    const deleteId = effects[index].internal_id;

    if (deleteId)
      await axios.delete(`/api/v1/items/${item.internal_id}/effects?effect_id=${deleteId}`);

    setEffects((prev) => prev.filter((_, i) => i !== index));
  };
  return (
    <Stack flexFlow="column" gap={4}>
      {error && (
        <Text color="red.400" textAlign={'center'}>
          {error}
        </Text>
      )}
      {effects.map((effect, i) => (
        <VStack key={i} bg="blackAlpha.300" p={2} borderRadius={'sm'}>
          <HStack>
            <NativeSelect.Root variant="subtle">
              <NativeSelect.Field
                value={effect.type}
                name="type"
                onChange={(e) => handleChange(e, i)}
              >
                <option value="cureDisease">Cure Disease</option>
                <option value="disease">Cause Disease</option>
                <option value="heal">Heal HP</option>
                <option value="stats">Stats</option>
                <option value="colorSpecies">Color/Species Change</option>
                <option value="petpetColor">Petpet Color Change</option>
                <option value="other">Other</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            {['disease', 'cureDisease'].includes(effect.type) && (
              <NativeSelect.Root variant="subtle">
                <NativeSelect.Field
                  name="name"
                  value={effect.name}
                  onChange={(e) => handleChange(e, i)}
                >
                  <option>Select Disease</option>
                  {deseaseList_en
                    .slice()
                    .sort((a, b) => a.localeCompare(b))
                    .map((disease) => (
                      <option key={disease} value={disease}>
                        {disease}
                      </option>
                    ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            )}
            {effect.type === 'stats' && (
              <NativeSelect.Root variant="subtle">
                <NativeSelect.Field
                  name="name"
                  value={effect.name}
                  onChange={(e) => handleChange(e, i)}
                >
                  <option>Select Stats</option>
                  {statsType.map((stat) => (
                    <option key={stat} value={stat}>
                      {stat}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            )}
          </HStack>

          {['heal', 'stats'].includes(effect.type) && (
            <HStack>
              <Input
                onChange={(e) => handleChange(e, i)}
                value={effect.minVal ?? undefined}
                name="minVal"
                type="number"
                placeholder="Min Value"
                variant="subtle"
              />
              <Input
                onChange={(e) => handleChange(e, i)}
                value={effect.maxVal ?? undefined}
                name="maxVal"
                type="number"
                placeholder="Max Value"
                variant="subtle"
              />
              <Input
                onChange={(e) => handleChange(e, i)}
                value={effect.strVal ?? undefined}
                name="strVal"
                type="input"
                placeholder="strVal (text)"
                variant="subtle"
              />
            </HStack>
          )}

          {effect.type === 'colorSpecies' && (
            <HStack>
              <NeoColorSelect
                onChange={(v) => handleColorSpeciesChange(v, 'colorTarget', i)}
                value={effect.colorTarget ?? undefined}
                placeHolder="Target Color"
              />
              <SpeciesSelect
                onChange={(v) => handleColorSpeciesChange(v as string, 'speciesTarget', i)}
                value={effect.speciesTarget ?? undefined}
                placeHolder="Target Species"
              />
            </HStack>
          )}
          {effect.type === 'petpetColor' && (
            <NeoColorSelect
              isPetpet
              onChange={(v) => handleColorSpeciesChange(v, 'colorTarget', i)}
              value={effect.colorTarget ?? undefined}
              placeHolder="Target Color"
            />
          )}
          <SpeciesSelect
            onChange={(v) => handleSpeciesChange(v as string[], i)}
            value={effect.species || undefined}
            isMultiple
            placeHolder="Required Species (optional)"
          />
          <Input
            name="text"
            value={effect.text ?? undefined}
            onChange={(e) => handleChange(e, i)}
            placeholder="Notes (accept markdown - optional)"
            variant="subtle"
            autoComplete="off"
          />
          <NativeSelect.Root variant="subtle">
            <NativeSelect.Field
              name="isChance"
              value={effect.isChance.toString()}
              onChange={(e) => handleChange(e, i)}
            >
              <option value="false">Not Random</option>
              <option value="true">Random</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <HStack>
            <Button onClick={() => removeEffect(i)} colorPalette="red" variant={'ghost'}>
              Delete Effect
            </Button>
          </HStack>
        </VStack>
      ))}
      <Button onClick={addEffect}>Add New Effect</Button>
      {unsavedChanges && (
        <Button onClick={saveChanges} colorPalette="green" variant={'outline'} loading={isLoading}>
          Save Effects
        </Button>
      )}
    </Stack>
  );
};

// ------- Petpet Tab ------- //

type PetpetInfo = {
  species: string;
  color: string;
  isCanonical: boolean;
  isUnpaintable: boolean;
};

type PetpetTabProps = {
  item: ItemData;
  petpetData?: ItemPetpetData | null;
};

const defaultPetpetInfo: PetpetInfo = {
  species: '',
  color: '',
  isCanonical: false,
  isUnpaintable: false,
};

export const PetpetTab = (props: PetpetTabProps) => {
  const { item, petpetData } = props;
  const [petpetInfo, setPetpetInfo] = useState<PetpetInfo>(defaultPetpetInfo);
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!petpetData) return;
    setPetpetInfo({
      species: petpetData.species.name,
      color: petpetData.color.name,
      isCanonical: !!petpetData.isCanonical,
      isUnpaintable: !!petpetData.isUnpaintable,
    });
  }, [petpetData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    inputName?: string
  ) => {
    const name = inputName ?? (e.target.name as keyof PetpetInfo);
    const value = e.target.value;

    const newPetpetInfo: PetpetInfo = {
      ...petpetInfo,
      [name]: value,
    };

    setPetpetInfo(newPetpetInfo);

    setUnsavedChanges(true);
  };

  const saveChanges = async () => {
    if (!petpetInfo.species.trim() || !petpetInfo.color.trim()) {
      setError('Species and color are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await axios.post(`/api/v1/items/${item.internal_id}/petpet`, {
        ...petpetInfo,
        item_iid: item.internal_id,
      });
      setLoading(false);
      setUnsavedChanges(false);
    } catch (e: any) {
      console.error(e);
      setError(
        e?.response?.data?.error ||
          'An error occurred while saving the petpet info. Please REFRESH the page and try later.'
      );
      setLoading(false);
    }
  };

  const deleteData = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/v1/items/${item.internal_id}/petpet`);
      setLoading(false);
      setPetpetInfo(defaultPetpetInfo);
      setUnsavedChanges(false);
    } catch (e: any) {
      console.error(e);
      setError(
        'An error occurred while deleting the petpet info. Please REFRESH the page and try later.'
      );
    }
  };

  const handleSelectChange = (newData: string, type: 'species' | 'color') => {
    setPetpetInfo((prev) => {
      const newPetpetInfo = { ...prev };
      if (type === 'color') newPetpetInfo.color = newData;
      if (type === 'species') newPetpetInfo.species = newData;
      return newPetpetInfo;
    });

    setUnsavedChanges(true);
  };

  return (
    <Stack flexFlow="column" gap={4}>
      {error && (
        <Text color="red.400" textAlign={'center'}>
          {error}
        </Text>
      )}
      <VStack bg="blackAlpha.300" p={2} borderRadius={'sm'}>
        <HStack>
          <NeoColorSelect
            isPetpet
            onChange={(v) => handleSelectChange(v, 'color')}
            value={petpetInfo.color}
            placeHolder="Color"
          />
          <SpeciesSelect
            isPetpet
            onChange={(v) => handleSelectChange(v as string, 'species')}
            value={petpetInfo.species}
            placeHolder="Species"
          />
        </HStack>
        <NativeSelect.Root variant="subtle">
          <NativeSelect.Field
            name="isCanonical"
            value={petpetInfo.isCanonical.toString()}
            onChange={(e) => handleChange(e)}
          >
            <option value="false">Not Canonical</option>
            <option value="true">Canonical</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <NativeSelect.Root variant="subtle">
          <NativeSelect.Field
            name="isUnpaintable"
            value={petpetInfo.isUnpaintable.toString()}
            onChange={(e) => handleChange(e)}
          >
            <option value="false">Paintable</option>
            <option value="true">Unpaintable</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </VStack>
      {unsavedChanges && (
        <Button
          onClick={saveChanges}
          colorPalette="green"
          variant={'outline'}
          loading={isLoading}
          disabled={!petpetInfo.species.trim() || !petpetInfo.color.trim()}
        >
          Save Petpet
        </Button>
      )}
      {!!petpetData && (
        <Button onClick={deleteData} colorPalette="red" variant={'outline'} loading={isLoading}>
          Delete Petpet Data
        </Button>
      )}
    </Stack>
  );
};

function toDateInput(date: Date | string | number) {
  date = new UTCDate(date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
