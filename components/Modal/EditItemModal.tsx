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
                          item={item}
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
                onCheckedChange={({ checked }) => {
                  const next = checked
                    ? [...specialTags, value]
                    : specialTags.filter((tag) => tag !== value);
                  handleSpecialTags(next);
                }}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>{label}</Checkbox.Label>
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
  item: ItemData;
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

export const OpenableTab = (props: OpenableTabProps) => {
  const { itemOpenable: itemOpenableProps, isItemOpenableLoading, item } = props;
  const [itemOpenable, setItemOpenable] = useState<ItemOpenable | null>(
    itemOpenableProps ?? defaultItemOpenable
  );
  const [dropData, setDropData] = useState<{ [id: number]: ItemData }>({});
  const [isLoading, setLoading] = useState<boolean>(false);
  const [newPoolName, setNewPoolName] = useState<string>('');

  useEffect(() => {
    if (isItemOpenableLoading) return;
    if (itemOpenableProps) {
      setItemOpenable(itemOpenableProps);
    } else if (itemOpenableProps === null) {
      setItemOpenable(defaultItemOpenable);
    }
  }, [itemOpenableProps, isItemOpenableLoading]);

  useEffect(() => {
    if (!itemOpenable || isItemOpenableLoading) return;
    init();
  }, [itemOpenable, isItemOpenableLoading]);

  const init = async () => {
    if (!itemOpenable) return;
    setLoading(true);
    const itemRes = await axios.post(`/api/v1/items/many`, {
      id: Object.keys(itemOpenable.drops),
    });

    setDropData(itemRes.data);
    setLoading(false);
  };

  const updatePool = async (poolName: string, newItem: ItemData, action: 'add' | 'remove') => {
    setLoading(true);

    const res = await axios.patch(`/api/v1/items/${item.slug}/drops`, {
      drop_id: newItem.internal_id,
      poolName: poolName,
      action: action,
    });

    setItemOpenable(res.data.dropUpdate);
  };

  const onSelect = (newItem: ItemData, poolName: string) => {
    updatePool(poolName, newItem, 'add');
  };

  const createPool = () => {
    if (!itemOpenable || !newPoolName) return;
    const newPool: PrizePoolData = {
      name: newPoolName,
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
        [newPoolName]: newPool,
        ...itemOpenable.pools,
      },
    };

    setItemOpenable(newOpenable);
  };

  if (isItemOpenableLoading) {
    return (
      <Center py={8}>
        <Spinner />
      </Center>
    );
  }

  return (
    <Flex flexFlow="column" gap={3}>
      <Flex flexFlow={'column'} bg="blackAlpha.300" p={2} gap={3}>
        <Input
          size="sm"
          variant="subtle"
          placeholder="Pool Name"
          onChange={(e) => setNewPoolName(e.target.value)}
        />
        <Button size="sm" onClick={createPool} disabled={!newPoolName}>
          Create New Pool
        </Button>
      </Flex>
      {itemOpenable &&
        Object.values(itemOpenable.pools).map((pool) => (
          <Flex flexFlow={'column'} key={pool.name} bg="blackAlpha.300" p={2}>
            <Text fontSize={'sm'} textTransform="capitalize" textAlign={'center'} fontWeight="bold">
              Prize Pool - {pool.name}
            </Text>
            {!isLoading && (
              <Flex flexFlow={'column'} gap={3} mt={3}>
                {pool.items.map((item) => {
                  const itemData = dropData[item];
                  if (!itemData) return null;
                  return (
                    <Flex key={itemData.internal_id} alignItems="center" gap={2}>
                      <Image
                        src={itemData.image}
                        width="30px"
                        height="30px"
                        alt={itemData.description}
                      />
                      <Text fontSize={'sm'}>{itemData.name}</Text>
                      <Button
                        size="xs"
                        colorPalette="red"
                        onClick={() => updatePool(pool.name, itemData, 'remove')}
                        variant="ghost"
                      >
                        X
                      </Button>
                    </Flex>
                  );
                })}
                <ItemSelect onChange={(item) => onSelect(item, pool.name)} />
              </Flex>
            )}
            {isLoading && (
              <Center>
                <Spinner />
              </Center>
            )}
          </Flex>
        ))}
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
    try {
      setLoading(true);
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
        'An error occurred while saving the effects. Please REFRESH the page and try later.'
      );
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
    try {
      setLoading(true);
      await axios.post(`/api/v1/items/${item.internal_id}/petpet`, {
        ...petpetInfo,
        item_iid: item.internal_id,
      });
      setLoading(false);
      setUnsavedChanges(false);
    } catch (e: any) {
      console.error(e);
      setError(
        'An error occurred while saving the petpet info. Please REFRESH the page and try later.'
      );
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
        <Button onClick={saveChanges} colorPalette="green" variant={'outline'} loading={isLoading}>
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
