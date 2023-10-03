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
  Checkbox,
  Badge,
  Spinner,
  Center,
  FormHelperText,
  Select,
} from '@chakra-ui/react';
import axios from 'axios';
import { useState } from 'react';
import { UserList } from '../../types';
import { useAuth, UserLists } from '../../utils/auth';
import { ColorResult, TwitterPicker } from '@hello-pangea/color-picker';
import { useAtom } from 'jotai';

export type CreateListModalProps = {
  list?: UserList;
  isOpen: boolean;
  onClose: () => void;
  refresh?: () => void;
};

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

const CreateListModal = (props: CreateListModalProps) => {
  const { user, getIdToken } = useAuth();
  const { isOpen, onClose } = props;
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [list, setList] = useState(props.list ?? defaultList);
  const [, setStorageLists] = useAtom(UserLists);

  const saveChanges = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const token = await getIdToken();

      const data = {
        list_id: list.internal_id,
        name: list.name,
        description: list.description,
        coverURL: list.coverURL,
        visibility: list.visibility,
        purpose: list.purpose,
        colorHex: list.colorHex,
        official: list.official,
        sortInfo: {
          sortBy: list.sortBy,
          sortDir: list.sortDir,
        },
      };

      const configs = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      const username = list.user_username ?? user.username;

      // if list exists then update, else create
      const res = await (props.list
        ? axios.post(`/api/v1/lists/${username}/${list.internal_id}`, data, configs)
        : axios.post(`/api/v1/lists/${username}`, data, configs));

      setLoading(false);

      if (res.data.success) {
        props.refresh?.();
        setStorageLists(null);
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

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{props.list ? 'Edit' : 'Create'} List</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!isLoading && !error && (
            <Stack gap={3}>
              {props.list && user?.id !== props.list?.user_id && user?.isAdmin && (
                <Text textAlign="center" color="red.300">
                  You are editing another user&apos;s list as admin. Be careful.
                </Text>
              )}
              <FormControl>
                {user?.isAdmin && (
                  <Checkbox
                    isChecked={list.official}
                    onChange={(value) =>
                      setList({
                        ...list,
                        official: value.target.checked,
                      })
                    }
                  >
                    <Badge colorScheme="blue">✓ Official</Badge>
                  </Checkbox>
                )}
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">List Name</FormLabel>
                <Input variant="filled" name="name" onChange={handleChange} value={list.name} />
                <FormHelperText>Required</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel color="gray.300">Description</FormLabel>
                <Textarea
                  variant="filled"
                  name="description"
                  onChange={handleChange}
                  value={list.description ?? ''}
                />
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">Cover Image URL (150x150)</FormLabel>
                <Input
                  variant="filled"
                  name="coverURL"
                  onChange={handleChange}
                  value={list.coverURL ?? ''}
                />
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">Color</FormLabel>
                <Center>
                  <TwitterPicker
                    styles={colorPickerStyles}
                    triangle="hide"
                    color={list.colorHex ?? undefined}
                    onChangeComplete={handleColorChange}
                  />
                </Center>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">Visibility</FormLabel>
                <Select
                  variant="filled"
                  name="visibility"
                  onChange={handleChange}
                  value={list.visibility}
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">Purpose</FormLabel>
                <Select
                  variant="filled"
                  name="purpose"
                  onChange={handleChange}
                  value={list.purpose}
                >
                  <option value="none">None</option>
                  <option value="seeking">Seeking these items</option>
                  <option value="trading">Trading these items</option>
                </Select>
                <FormHelperText>
                  If you are seeking or trading these items, we may show your list to other users
                  who may be interested.
                </FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">Default Sorting</FormLabel>
                <Select variant="filled" name="sortBy" onChange={handleChange} value={list.sortBy}>
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="rarity">Rarity</option>
                  <option value="color">Color</option>
                  <option value="custom">Custom</option>
                  <option value="addedAt">Added At</option>
                  <option value="item_id">Item ID</option>
                </Select>
                <FormHelperText>
                  {list.sortBy === 'custom' &&
                    'You can change the order of items in your list by dragging and dropping them.'}
                </FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">Sort Direction</FormLabel>
                <Select
                  variant="filled"
                  name="sortDir"
                  onChange={handleChange}
                  value={list.sortDir}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </Select>
              </FormControl>
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
                An error has occurred!
                <br />
                Please refresh the page and try again later
              </Text>
            </Center>
          )}
        </ModalBody>
        <ModalFooter>
          {!isLoading && !error && (
            <>
              <Button variant="ghost" onClick={handleCancel} mr={3}>
                Cancel
              </Button>
              <Button onClick={saveChanges} isDisabled={!list.name}>
                {props.list ? 'Save' : 'Create'}
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateListModal;
