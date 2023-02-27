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
import { useAuth } from '../../utils/auth';
import { ColorResult, TwitterPicker } from '@hello-pangea/color-picker';

type Props = {
  list?: UserList;
  isOpen: boolean;
  onClose: () => void;
  refresh?: () => void;
};

const defaultList: Partial<UserList> = {
  name: '',
  description: '',
  cover_url: '',
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

const CreateListModal = (props: Props) => {
  const { user, getIdToken } = useAuth();
  const { isOpen, onClose } = props;
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [list, setList] = useState(props.list ?? defaultList);

  const saveChanges = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await axios.post(
        props.list ? '/api/lists/update' : '/api/lists/create',
        {
          list_id: list.internal_id,
          name: list.name,
          description: list.description,
          cover_url: list.cover_url,
          visibility: list.visibility,
          purpose: list.purpose,
          colorHex: list.colorHex,
          official: list.official,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      setLoading(false);

      if (res.data.success) {
        props.refresh?.();
        onClose();
      } else throw res.data;
    } catch (err) {
      console.log(err);
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
    <Modal isOpen={isOpen} onClose={handleCancel} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{props.list ? 'Edit' : 'Create'} List</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!isLoading && !error && (
            <Stack gap={3}>
              {props.list &&
                user?.id !== props.list?.user_id &&
                user?.isAdmin && (
                  <Text textAlign="center" color="red.300">
                    You are editing another user&apos;s list as admin. Be
                    careful.
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
                <Input
                  variant="filled"
                  name="name"
                  onChange={handleChange}
                  value={list.name}
                />
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
                <FormLabel color="gray.300">
                  Cover Image URL (150x150)
                </FormLabel>
                <Input
                  variant="filled"
                  name="cover_url"
                  onChange={handleChange}
                  value={list.cover_url ?? ''}
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
                <FormLabel color="gray.300">NC Purpose</FormLabel>
                <Select
                  variant="filled"
                  name="purpose"
                  onChange={handleChange}
                  value={list.purpose}
                >
                  <option value="none">Not a NC List</option>
                  <option value="seeking">Seeking these items</option>
                  <option value="trading">Trading these items</option>
                </Select>
                <FormHelperText>
                  If you are seeking or trading these items, we may show your
                  list to other users who may be interested.
                </FormHelperText>
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
              <Button onClick={saveChanges} disabled={!list.name}>
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
