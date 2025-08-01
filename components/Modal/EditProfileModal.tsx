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
  Select,
  Textarea,
  Link,
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { User } from '../../types';
import { useAuth } from '../../utils/auth';
import { ColorResult, TwitterPicker } from '@hello-pangea/color-picker';
import { useTranslations } from 'next-intl';

export type EditProfileModalProps = {
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
  profileMode: 'default',
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

const EditProfileModal = (props: EditProfileModalProps) => {
  const t = useTranslations();
  const { user, setUser } = useAuth();
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
      if (!userProfile.username || !userProfile.neopetsUser) {
        setLoading(false);
        setError(t('Profile.fill-required-fields'));
        return;
      }

      if (
        !userProfile.neopetsUser.match(/^[a-zA-Z0-9_]+$/) ||
        !userProfile.username.match(/^[a-zA-Z0-9_]+$/)
      ) {
        setLoading(false);
        setError(t('Login.only-letters-numbers'));
        return;
      }

      if (userProfile.username !== user?.username && !checkUsername(userProfile.username)) {
        setLoading(false);
        setError(t('Login.username-already-taken'));
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
          setError(t('Profile.enter-a-valid-image-url'));
          return;
        }
      }

      const res = await axios.post(`/api/v1/users/${userProfile.username}`, userProfile);
      setUser(res.data);
      setLoading(false);

      props.refresh?.();
      onClose();
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError(t('General.error-saving-changes'));
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
        <ModalHeader>{t('Lists.edit-profile')}</ModalHeader>
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
                <FormLabel color="gray.300">{t('Login.neopets-username')}</FormLabel>
                <Input
                  variant="filled"
                  name="neopetsUser"
                  onChange={handleChange}
                  value={userProfile.neopetsUser ?? ''}
                />
              </FormControl>

              <FormControl>
                <FormLabel color="gray.300">{t('General.description')}</FormLabel>
                <Textarea
                  variant="filled"
                  name="description"
                  onChange={handleChange}
                  value={userProfile.description ?? ''}
                />
                <FormHelperText fontSize={'xs'}>
                  {t.rich('Lists.markdown-tip', {
                    Link: (children) => (
                      <Link href="https://commonmark.org/help/" color="gray.300" isExternal>
                        {children}
                      </Link>
                    ),
                    Small: (children) => <Text display={'inline'}>{children}</Text>,
                  })}
                </FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">{t('Profile.profile-image-url')} (150x150)</FormLabel>
                <Input
                  variant="filled"
                  name="profileImage"
                  onChange={handleChange}
                  value={userProfile.profileImage ?? ''}
                />
                <FormHelperText fontSize={'xs'}>{t('Profile.allowedDomains')}</FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">Profile Mode</FormLabel>
                <Select
                  onChange={handleChange}
                  value={userProfile.profileMode ?? 'default'}
                  variant={'filled'}
                  name="profileMode"
                >
                  <option value={'default'}>Default</option>
                  <option value={'groups'}>List Groups</option>
                </Select>
                <FormHelperText fontSize={'xs'}>
                  {t.rich('Profile.list-groups-helper', {
                    b: (children) => <b>{children}</b>,
                  })}
                </FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">{t('General.color')}</FormLabel>
                <Center>
                  <TwitterPicker
                    styles={colorPickerStyles}
                    triangle="hide"
                    color={userProfile.profileColor || '#000000'}
                    onChangeComplete={handleColorChange}
                  />
                </Center>
                <FormHelperText fontSize={'xs'}>{t('Profile.color-helper')}</FormHelperText>
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
                {t('General.cancel')}
              </Button>
              <Button onClick={saveChanges}>{t('General.save')}</Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditProfileModal;
