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
} from '@chakra-ui/react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { EditItemFeedbackJSON, ItemData, ItemOpenable, ItemTag, PrizePoolData } from '../../types';
import { useAuth } from '../../utils/auth';
import ItemCatSelect from '../Input/ItemCategorySelect';
import ItemStatusSelect from '../Input/ItemStatusSelect';
// import TagSelect from '../Input/TagsSelect';
import { FiTrash } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import ItemSelect from '../Input/ItemSelect';

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
};

const EditItemModal = (props: EditItemModalProps) => {
  const { getIdToken, user } = useAuth();
  const { isOpen, onClose, item: itemProps, tags: tagsProps, itemOpenable } = props;
  const [item, setItem] = useState<ItemData>(itemProps);
  const [tags, setTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
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
      <Modal isOpen={isOpen} onClose={handleCancel} isCentered scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isAdmin ? 'Edit' : 'Suggest Changes'} - {itemProps.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {!isLoading && !isSuccess && !error && (
              <Tabs variant="line" colorScheme="gray" isLazy>
                <TabList>
                  <Tab>Item Info</Tab>
                  {isAdmin && <Tab>Categories</Tab>}
                  {isAdmin && <Tab>Drops</Tab>}
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
                  Thank you!
                  <br />
                  We have received your suggestion and it will be reviewed by our team.
                </Text>
              </Center>
            )}
            {isSuccess && isAdmin && (
              <Center>
                <Text fontSize="sm" textAlign="center">
                  Changes saved!
                  <br />
                  They might take a few minutes to appear due to caching.
                </Text>
              </Center>
            )}
            {error && (
              <Center>
                <Text fontSize="sm" textAlign="center" color="red.400">
                  An error has occurred!
                  <br />
                  Please refresh the page and try again later
                </Text>
              </Center>
            )}
          </ModalBody>
          <ModalFooter>
            {!isLoading && !isSuccess && !error && (
              <>
                <Button
                  variant="outline"
                  colorScheme="red"
                  onClick={onDeleteOpen}
                  display={isAdmin ? 'inherit' : 'none'}
                >
                  <Icon as={FiTrash} mr={1} /> Delete Item
                </Button>
                <Button onClick={handleCancel} variant="ghost" mx={3}>
                  Cancel
                </Button>
                <Button onClick={isAdmin ? saveChanges : sendFeedback}>
                  {isAdmin ? 'Save' : 'Send'}
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
  const { item, itemProps, onChange: handleChange } = props;
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';

  return (
    <Flex flexFlow="column" gap={4}>
      {!isAdmin && (
        <>
          <Text fontSize="sm" sx={{ a: { color: 'blue.300' } }}>
            You can correct most of an item&apos;s information using the{' '}
            <Link href="/contribute" isExternal>
              Item Data Extractor Script
            </Link>
            .
          </Text>
          <Text fontSize="sm">
            If you feel you have already submitted the correct information with the script and too
            much time has passed and the correct information is still not live, let us know using
            the <b>feedback button</b>
          </Text>
        </>
      )}
      {isAdmin && (
        <>
          <Stack>
            <FormControl>
              <FormLabel color="gray.300">Item Name</FormLabel>
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
              <FormLabel color="gray.300">Description</FormLabel>
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
              <FormLabel color="gray.300">Image URL</FormLabel>
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
          </Stack>
          <Divider />
          <HStack>
            <FormControl>
              <FormLabel color="gray.300">Item ID</FormLabel>
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
              <FormLabel color="gray.300">Rarity</FormLabel>
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
              <FormLabel color="gray.300">Est. Val</FormLabel>
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
              <FormLabel color="gray.300">Weight</FormLabel>
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
              <FormLabel color="gray.300">Status</FormLabel>
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
              <FormLabel color="gray.300">Category</FormLabel>
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
        <FormLabel color="gray.300">Notes</FormLabel>
        <Textarea
          color={item.comment === itemProps.comment ? 'gray.400' : '#fff'}
          value={item.comment ?? ''}
          variant="filled"
          name="comment"
          onChange={handleChange}
          size="sm"
        />
        <FormHelperText>Please do not copy information from other fan sites.</FormHelperText>
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
          <FormLabel color="gray.300">Special Tags</FormLabel>
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
                <Badge colorScheme="blue">Wearable</Badge>
              </Checkbox>
              <Checkbox value="neohome">
                <Badge colorScheme="cyan">Neohome</Badge>
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

export const OpenableTab = (props: OpenableTabProps) => {
  const { itemOpenable: itemOpenableProps, item } = props;
  const [itemOpenable, setItemOpenable] = useState<ItemOpenable | null>(itemOpenableProps);
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
