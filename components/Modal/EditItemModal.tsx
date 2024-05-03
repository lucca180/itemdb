import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  Text,
  FormLabel,
  Input,
  Stack,
  Textarea,
  Divider,
  HStack,
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Checkbox,
  CheckboxGroup,
  Badge,
  Spinner,
  Center,
  FormHelperText,
  Link,
  Icon,
  useDisclosure,
  Image,
  Select,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  EditItemFeedbackJSON,
  ItemData,
  ItemEffect,
  ItemOpenable,
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
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
import SpeciesSelect from '../Input/SpeciesSelect';
import { deseaseList_en } from '../../utils/utils';

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
  itemEffects: ItemEffect[];
};

const EditItemModal = (props: EditItemModalProps) => {
  const t = useTranslations();
  const { getIdToken, user } = useAuth();
  const { isOpen, onClose, item: itemProps, tags: tagsProps, itemOpenable, itemEffects } = props;
  const [item, setItem] = useState<ItemData>(itemProps);
  const [tags, setTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [tabIndex, setTabIndex] = useState(0);
  const { onOpen: onDeleteOpen, isOpen: isDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const router = useRouter();

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

      setItem(itemCopy);
    }
  };

  const saveChanges = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await axios.patch(
        '/api/v1/items/' + item.internal_id,
        {
          itemData: item,
          itemCats: categories,
          itemTags: tags,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

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
        pageInfo: router.asPath,
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
      <Modal isOpen={isOpen} onClose={handleCancel} isCentered size="lg" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isAdmin ? t('Button.edit') : t('Feedback.suggest-changes')} - {itemProps.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {!isLoading && !isSuccess && !error && (
              <Tabs
                variant="line"
                colorScheme="gray"
                isLazy
                onChange={(index) => setTabIndex(index)}
              >
                <TabList>
                  <Tab>{t('ItemPage.item-info')}</Tab>
                  {isAdmin && <Tab>{t('ItemPage.categories')}</Tab>}
                  {isAdmin && <Tab>{t('ItemPage.drops')}</Tab>}
                  {isAdmin && <Tab>Item Effects</Tab>}
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <InfoTab item={item} itemProps={itemProps} onChange={handleChange} />
                  </TabPanel>
                  {isAdmin && (
                    <TabPanel>
                      <CategoriesTab
                        categories={categories}
                        tags={tags}
                        item={item}
                        itemProps={itemProps}
                        onChange={handleTagsChange}
                      />
                    </TabPanel>
                  )}
                  {isAdmin && (
                    <TabPanel>
                      <OpenableTab itemOpenable={itemOpenable} item={item} />
                    </TabPanel>
                  )}
                  {isAdmin && (
                    <TabPanel>
                      <EffectsTab item={item} itemEffects={itemEffects} />
                    </TabPanel>
                  )}
                </TabPanels>
              </Tabs>
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
          </ModalBody>
          <ModalFooter>
            {!isLoading && !isSuccess && !error && tabIndex <= 1 && (
              <>
                <Button
                  variant="outline"
                  colorScheme="red"
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
          </ModalFooter>
        </ModalContent>
      </Modal>
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
    <Flex flexFlow="column" gap={4}>
      {!isAdmin && (
        <>
          <Text fontSize="sm" sx={{ a: { color: 'blue.300' } }}>
            {t.rich('Feedback.correctItemInfo', {
              Link: (chunks) => (
                <Link as={NextLink} href="/contribute" color="gray.200">
                  {chunks}
                </Link>
              ),
            })}
          </Text>
          <Text fontSize="sm">
            {t.rich('modalFeedbackCallback', {
              b: (chunks) => <b>{chunks}</b>,
            })}
          </Text>
        </>
      )}
      {isAdmin && (
        <>
          <Stack>
            <FormControl>
              <FormLabel color="gray.300">{t('General.item-name')}</FormLabel>
              <Input
                variant="filled"
                type="text"
                name="name"
                size="sm"
                value={item.name}
                onChange={handleChange}
                isDisabled={!isAdmin}
                color={item.name === itemProps.name ? 'gray.400' : '#fff'}
              />
            </FormControl>
            <FormControl>
              <FormLabel color="gray.300">{t('General.description')}</FormLabel>
              <Textarea
                color={item.description === itemProps.description ? 'gray.400' : '#fff'}
                value={item.description}
                variant="filled"
                name="description"
                onChange={handleChange}
                isDisabled={!isAdmin}
                size="sm"
              />
            </FormControl>
            <FormControl>
              <FormLabel color="gray.300">{t('General.image-url')}</FormLabel>
              <Input
                variant="filled"
                type="text"
                name="image"
                size="sm"
                value={item.image}
                onChange={handleChange}
                isDisabled={!isAdmin}
                color={item.image === itemProps.image ? 'gray.400' : '#fff'}
              />
            </FormControl>
            <FormControl>
              <FormLabel color="gray.300">{t('General.canonical-id')}</FormLabel>
              <Input
                variant="filled"
                type="text"
                name="canonical_id"
                size="sm"
                value={item.canonical_id ?? ''}
                onChange={handleChange}
                isDisabled={!isAdmin}
                color={item.canonical_id == itemProps.canonical_id ? 'gray.400' : '#fff'}
              />
            </FormControl>
          </Stack>
          <Divider />
          <HStack>
            <FormControl>
              <FormLabel color="gray.300">{t('General.item-id')}</FormLabel>
              <Input
                variant="filled"
                type="text"
                name="item_id"
                size="sm"
                value={item.item_id ?? ''}
                onChange={handleChange}
                isDisabled={!isAdmin}
                color={item.item_id == itemProps.item_id ? 'gray.400' : '#fff'}
              />
            </FormControl>
            <FormControl>
              <FormLabel color="gray.300">{t('General.rarity')}</FormLabel>
              <Input
                variant="filled"
                type="text"
                name="rarity"
                size="sm"
                value={item.rarity ?? ''}
                onChange={handleChange}
                isDisabled={!isAdmin}
                color={item.rarity == itemProps.rarity ? 'gray.400' : '#fff'}
              />
            </FormControl>
          </HStack>
          <HStack>
            <FormControl>
              <FormLabel color="gray.300">{t('General.est-val')}</FormLabel>
              <Input
                variant="filled"
                type="text"
                name="estVal"
                size="sm"
                value={item.estVal ?? ''}
                onChange={handleChange}
                isDisabled={!isAdmin}
                color={item.estVal == itemProps.estVal ? 'gray.400' : '#fff'}
              />
            </FormControl>
            <FormControl>
              <FormLabel color="gray.300">{t('General.weight')}</FormLabel>
              <Input
                variant="filled"
                type="text"
                name="weight"
                size="sm"
                value={item.weight ?? ''}
                onChange={handleChange}
                isDisabled={!isAdmin}
                color={item.weight == itemProps.weight ? 'gray.400' : '#fff'}
              />
            </FormControl>
          </HStack>
          <HStack>
            <FormControl>
              <FormLabel color="gray.300">{t('General.status')}</FormLabel>
              <ItemStatusSelect
                name="status"
                value={item.status ?? ''}
                onChange={handleChange}
                isDisabled={!isAdmin}
                color={item.status == itemProps.status ? 'gray.400' : '#fff'}
              />
            </FormControl>
          </HStack>
          <HStack>
            <FormControl>
              <FormLabel color="gray.300">{t('General.category')}</FormLabel>
              <ItemCatSelect
                name="category"
                value={item.category ?? ''}
                onChange={handleChange}
                isDisabled={!isAdmin}
                color={item.category == itemProps.category ? 'gray.400' : '#fff'}
              />
            </FormControl>
          </HStack>
        </>
      )}
      <FormControl>
        <FormLabel color="gray.300">{t('ItemPage.notes')}</FormLabel>
        <Textarea
          color={item.comment === itemProps.comment ? 'gray.400' : '#fff'}
          value={item.comment ?? ''}
          variant="filled"
          name="comment"
          onChange={handleChange}
          size="sm"
        />
        <FormHelperText>
          {t('ItemPage.modalDoNotCopy')}
          <br />
          {t.rich('Feedback.modalContributeCallback', {
            Link: (chunks) => (
              <Link as={NextLink} href="/contribute" color="gray.300">
                {chunks}
              </Link>
            ),
          })}
        </FormHelperText>
      </FormControl>
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
};

export const CategoriesTab = (props: TagSelectProps) => {
  const t = useTranslations();
  const { item, onChange: handleChange } = props;
  const [specialTags, setSpecialTags] = useState<string[]>([]);
  const { user } = useAuth();

  const isAdmin = user?.role == 'ADMIN';

  useEffect(() => {
    const tempTags = [];

    tempTags.push(item.type);

    if (item.isWearable) tempTags.push('wearable');

    if (item.isNeohome) tempTags.push('neohome');

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
        <FormControl>
          <FormLabel color="gray.300">{t('ItemPage.special-tags')}</FormLabel>
          <CheckboxGroup value={specialTags} onChange={handleSpecialTags}>
            <Stack spacing={3} direction="row" wrap="wrap" justifyContent="center">
              <Checkbox value="np">
                <Badge colorScheme="green">NP</Badge>
              </Checkbox>
              <Checkbox value="nc">
                <Badge colorScheme="purple">NC</Badge>
              </Checkbox>
              <Checkbox value="pb">
                <Badge colorScheme="yellow">PB</Badge>
              </Checkbox>
              <Checkbox value="wearable">
                <Badge colorScheme="blue">{t('General.wearable')}</Badge>
              </Checkbox>
              <Checkbox value="neohome">
                <Badge colorScheme="cyan">{t('General.neohome')}</Badge>
              </Checkbox>
            </Stack>
          </CheckboxGroup>
        </FormControl>
      )}
      {/* <FormControl>
                <FormLabel color="gray.300">Categories (max. 5)</FormLabel>
                <TagSelect
                    value={categories}
                    onChange={(vals) => handleChange(vals, 'categories')}
                    type='categories'
                    disabled={categories.length >= 5}
                />
                <FormHelperText>Prefer to use existing categories instead of creating new ones</FormHelperText>
            </FormControl> */}
      {/* <FormControl>
        <FormLabel color="gray.300">Tags (max. 15)</FormLabel>
        <TagSelect
          value={tags}
          onChange={(vals) => handleChange(vals, 'tags')}
          type="tags"
          disabled={categories.length >= 15}
        />
        <FormHelperText>
          Prefer to use existing tags instead of creating new ones.
          <br />
          <br />
          Tags should describe the item itself and not meta information (like how/where to get it){' '}
          <br />
          <br />
          Tags must not contain words that are in the item name
        </FormHelperText>
      </FormControl> */}
    </Stack>
  );
};

// ------- Openable Tab ------- //

type OpenableTabProps = {
  itemOpenable: ItemOpenable | null;
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
  maxDrop: 0,
  minDrop: 0,
};

export const OpenableTab = (props: OpenableTabProps) => {
  const { itemOpenable: itemOpenableProps, item } = props;
  const [itemOpenable, setItemOpenable] = useState<ItemOpenable | null>(
    itemOpenableProps ?? defaultItemOpenable
  );
  const { getIdToken } = useAuth();
  const [dropData, setDropData] = useState<{ [id: number]: ItemData }>({});
  const [isLoading, setLoading] = useState<boolean>(false);
  const [newPoolName, setNewPoolName] = useState<string>('');

  useEffect(() => {
    if (!itemOpenable) return;
    init();
  }, [itemOpenable]);

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
    const token = await getIdToken();
    if (!token) return;
    setLoading(true);

    const res = await axios.patch(
      `/api/v1/items/${item.slug}/drops`,
      {
        drop_id: newItem.internal_id,
        poolName: poolName,
        action: action,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

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

  return (
    <Flex flexFlow="column" gap={3}>
      <Flex flexFlow={'column'} bg="blackAlpha.300" p={2} gap={3}>
        <Input
          size="sm"
          variant="filled"
          placeholder="Pool Name"
          onChange={(e) => setNewPoolName(e.target.value)}
        />
        <Button size="sm" onClick={createPool} isDisabled={!newPoolName}>
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
                        colorScheme="red"
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

const statsType = ['HP', 'Strength', 'Level', 'Defence', 'Movement', 'Intelligence'];

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

      let effect = newEffects[index] ?? { ...defaultEffect };
      if (name === 'type') effect = { ...defaultEffect };

      effect.internal_id = newEffects[index]?.internal_id;

      //@ts-expect-error ts is dumb
      effect[name] = value;

      if (name === 'isChance') effect[name] = value === 'true';
      newEffects[index] = effect;
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
            <Select
              value={effect.type}
              name="type"
              onChange={(e) => handleChange(e, i)}
              variant="filled"
            >
              <option value="cureDisease">Cure Disease</option>
              <option value="disease">Cause Disease</option>
              <option value="heal">Heal HP</option>
              <option value="stats">Stats</option>
              <option value="other">Other</option>
            </Select>
            {['disease', 'cureDisease'].includes(effect.type) && (
              <Select
                name="name"
                variant="filled"
                value={effect.name}
                onChange={(e) => handleChange(e, i)}
              >
                {deseaseList_en
                  .slice()
                  .sort((a, b) => a.localeCompare(b))
                  .map((disease) => (
                    <option key={disease} value={disease}>
                      {disease}
                    </option>
                  ))}
              </Select>
            )}
            {effect.type === 'stats' && (
              <Select
                name="name"
                variant="filled"
                value={effect.name}
                onChange={(e) => handleChange(e, i)}
              >
                {statsType.map((stat) => (
                  <option key={stat} value={stat}>
                    {stat}
                  </option>
                ))}
              </Select>
            )}
          </HStack>
          {['heal', 'stats'].includes(effect.type) && (
            <HStack>
              <Input
                onChange={(e) => handleChange(e, i)}
                value={effect.minVal}
                name="minVal"
                type="number"
                placeholder="Min Value"
                variant="filled"
              />
              <Input
                onChange={(e) => handleChange(e, i)}
                value={effect.maxVal}
                name="maxVal"
                type="number"
                placeholder="Max Value"
                variant="filled"
              />
              <Input
                onChange={(e) => handleChange(e, i)}
                value={effect.strVal}
                name="strVal"
                type="input"
                placeholder="strVal (text)"
                variant="filled"
              />
            </HStack>
          )}
          <SpeciesSelect value={effect.species} placeHolder="Required Species (optional)" />
          <Input
            name="text"
            value={effect.text}
            onChange={(e) => handleChange(e, i)}
            placeholder="Notes (accept markdown - optional)"
            variant="filled"
            autoComplete="off"
          />
          <Select
            name="isChance"
            value={effect.isChance.toString()}
            onChange={(e) => handleChange(e, i)}
            variant="filled"
          >
            <option value="false">Not Random</option>
            <option value="true">Random</option>
          </Select>
          <HStack>
            <Button onClick={() => removeEffect(i)} colorScheme="red" variant={'ghost'}>
              Delete Effect
            </Button>
          </HStack>
        </VStack>
      ))}
      <Button onClick={addEffect}>Add New Effect</Button>
      {unsavedChanges && (
        <Button onClick={saveChanges} colorScheme="green" variant={'outline'} isLoading={isLoading}>
          Save Effects
        </Button>
      )}
    </Stack>
  );
};
