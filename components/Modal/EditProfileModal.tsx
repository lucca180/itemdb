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
  Spinner,
  Center,
  FormHelperText,
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { User } from '../../types';
import { useAuth } from '../../utils/auth';
import { ColorResult, TwitterPicker } from '@hello-pangea/color-picker';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  refresh?: () => void;
};

const defaultUser: Partial<User> = {
  username: '',
  neopetsUser: '',
  profileColor: '',
  profileImage: '',
  description: '',
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

const EditProfileModal = (props: Props) => {
  const { user, setUser, getIdToken } = useAuth();
  const [userProfile, setUserProfile] = useState(user ?? defaultUser);
  const { isOpen, onClose } = props;
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  // const [list, setList] = useState(props.list ?? defaultUser);

  useEffect(() => {
    setUserProfile(user ?? defaultUser);
  }, [user]);

  const saveChanges = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getIdToken();

      if (!userProfile.username || !userProfile.neopetsUser) {
        setLoading(false);
        setError('Fill out all required fields');
        return;
      }

      if (
        !userProfile.neopetsUser.match(/^[a-zA-Z0-9_]+$/) ||
        !userProfile.username.match(/^[a-zA-Z0-9_]+$/)
      ) {
        setLoading(false);
        setError('Only letters, numbers and underlines are allowed');
        return;
      }

      if (userProfile.username !== user?.username && !checkUsername(userProfile.username)) {
        setLoading(false);
        setError('Username already taken');
        return;
      }

      if (userProfile.profileImage) {
        try {
          const domain = new URL(userProfile.profileImage);
          const hostname = domain.hostname;
          if (
            ![
              'itemdb.com.br',
              'magnetismotimes.com',
              'images.neopets.com',
              'pets.neopets.com',
              'neopets.com',
              'www.neopets.com',
              'uploads.neopets.com',
            ].includes(hostname)
          )
            throw 'Invalid domain';

          if (!userProfile.profileImage.match(/\.(jpeg|jpg|gif|png)$/))
            throw 'Invalid image format';
        } catch (e) {
          setLoading(false);
          setError('Enter a valid image url');
          return;
        }
      }

      const configs = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      const res = await axios.post(`/api/v1/users/${userProfile.username}`, userProfile, configs);
      setUser(res.data);
      setLoading(false);

      props.refresh?.();
      onClose();
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError('Error saving changes');
    }
  };

  const handleCancel = () => {
    setError('');
    setLoading(false);
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setUserProfile({
      ...userProfile,
      [e.target.name]: e.target.value,
    });
  };

  const handleColorChange = (color: ColorResult) => {
    setUserProfile({
      ...userProfile,
      profileColor: color.hex,
    });
  };

  const checkUsername = async (username: string): Promise<boolean> => {
    if (!username) return false;
    if (!username.match(/^[a-zA-Z0-9_]+$/)) return false;

    try {
      const res = await axios.get(`/api/v1/users/${username}`);
      if (res.data) return false;
      else return true;
    } catch (e: any) {
      setError(e.message);
      console.error(error);
      return false;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Profile</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {error && (
            <Center>
              <Text fontSize="sm" textAlign="center" color="red.400">
                {error}
                <br />
              </Text>
            </Center>
          )}
          {!isLoading && (
            <Stack gap={3}>
              {/* <FormControl>
                <FormLabel color="gray.300">Username</FormLabel>
                <Input
                  variant="filled"
                  name="username"
                  onChange={handleChange}
                  value={userProfile.username ?? ''}
                />
                <FormHelperText>Required</FormHelperText>
              </FormControl> */}

              <FormControl>
                <FormLabel color="gray.300">Neopets Username</FormLabel>
                <Input
                  variant="filled"
                  name="neopetsUser"
                  onChange={handleChange}
                  value={userProfile.neopetsUser ?? ''}
                />
              </FormControl>

              {/* <FormControl>
                <FormLabel color="gray.300">Description</FormLabel>
                <Textarea
                  variant="filled"
                  name="description"
                  onChange={handleChange}
                  value={userProfile.description ?? ''}
                />
              </FormControl> */}
              <FormControl>
                <FormLabel color="gray.300">Profile Image URL (150x150)</FormLabel>
                <Input
                  variant="filled"
                  name="profileImage"
                  onChange={handleChange}
                  value={userProfile.profileImage ?? ''}
                />
                <FormHelperText>
                  Only images from neopets.com, magnetismotimes.com and itemdb.com.br are allowed
                </FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">Color</FormLabel>
                <Center>
                  <TwitterPicker
                    styles={colorPickerStyles}
                    triangle="hide"
                    color={userProfile.profileColor ?? undefined}
                    onChangeComplete={handleColorChange}
                  />
                </Center>
              </FormControl>
            </Stack>
          )}

          {isLoading && (
            <Center>
              <Spinner />
            </Center>
          )}
        </ModalBody>
        <ModalFooter>
          {!isLoading && (
            <>
              <Button variant="ghost" onClick={handleCancel} mr={3}>
                Cancel
              </Button>
              <Button onClick={saveChanges}>Save</Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditProfileModal;
