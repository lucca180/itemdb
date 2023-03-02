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
} from '@chakra-ui/react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { EditItemFeedbackJSON, ItemData, ItemTag } from '../../types';
import { useAuth } from '../../utils/auth';
import ItemStatusSelect from '../Input/ItemStatusSelect';
import TagSelect from '../Input/TagsSelect';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item: ItemData;
  tags: ItemTag[];
};

const EditItemModal = (props: Props) => {
  const { getIdToken, user } = useAuth();
  const { isOpen, onClose, item: itemProps, tags: tagsProps } = props;
  const [item, setItem] = useState<ItemData>(itemProps);
  const [tags, setTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    setTags(tagsProps.filter((t) => t.type === 'tag').map((t) => t.name));
    setCategories(tagsProps.filter((t) => t.type === 'category').map((t) => t.name));
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
      if (tags.includes('nc')) itemCopy.isNC = true;
      else itemCopy.isNC = false;

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
      };

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
    <Modal isOpen={isOpen} onClose={handleCancel} isCentered>
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
                {isAdmin && <Tab>Item Info</Tab>}
                <Tab>Categories and Tags</Tab>
              </TabList>
              <TabPanels>
                {isAdmin && (
                  <TabPanel>
                    <InfoTab item={item} itemProps={itemProps} onChange={handleChange} />
                  </TabPanel>
                )}
                <TabPanel>
                  <CategoriesTab
                    categories={categories}
                    tags={tags}
                    item={item}
                    itemProps={itemProps}
                    onChange={handleTagsChange}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}

          {isLoading && (
            <Center>
              <Spinner />
            </Center>
          )}
          {isSuccess && (
            <Center>
              <Text fontSize="sm" textAlign="center">
                Thank you!
                <br />
                We have received your suggestion and it will be reviewed by our team.
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
              <Button onClick={handleCancel} variant="ghost" mr={3}>
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
  );
};

export default EditItemModal;

type TabProps = {
  item: ItemData;
  itemProps: ItemData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};

const InfoTab = (props: TabProps) => {
  const { item, itemProps, onChange: handleChange } = props;

  return (
    <Flex flexFlow="column" gap={4}>
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
            name="est_val"
            size="sm"
            value={item.est_val ?? ''}
            onChange={handleChange}
            color={item.est_val == itemProps.est_val ? 'gray.400' : '#fff'}
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
            color={item.status == itemProps.status ? 'gray.400' : '#fff'}
          />
        </FormControl>
      </HStack>
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
      </FormControl>
    </Flex>
  );
};

type TagSelectProps = {
  item: ItemData;
  itemProps: ItemData;
  categories: string[];
  tags: string[];
  onChange: (tags: string[], type: 'categories' | 'tags' | 'special') => void;
};

const CategoriesTab = (props: TagSelectProps) => {
  const { item, categories, tags, onChange: handleChange } = props;
  const [specialTags, setSpecialTags] = useState<string[]>([]);
  const { user } = useAuth();

  const isAdmin = user?.role == 'ADMIN';

  useEffect(() => {
    const tempTags = [];

    if (item.isNC) tempTags.push('nc');
    else tempTags.push('np');

    if (item.isWearable) tempTags.push('wearable');

    if (item.isNeohome) tempTags.push('neohome');

    setSpecialTags(tempTags);
  }, [item]);

  const handleSpecialTags = (newTags: string[]) => {
    let tempTags = [...specialTags];

    if (newTags.includes('nc') && !specialTags.includes('nc')) {
      tempTags.push('nc');
      tempTags = tempTags.filter((tag) => tag !== 'np');
    } else if (newTags.includes('np') && !specialTags.includes('np')) {
      tempTags.push('np');
      tempTags = tempTags.filter((tag) => tag !== 'nc');
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
      <FormControl>
        <FormLabel color="gray.300">Tags (max. 15)</FormLabel>
        <TagSelect
          value={tags}
          onChange={(vals) => handleChange(vals, 'tags')}
          type="tags"
          disabled={categories.length >= 15}
        />
        <FormHelperText>Prefer to use existing tags instead of creating new ones</FormHelperText>
      </FormControl>
    </Stack>
  );
};
