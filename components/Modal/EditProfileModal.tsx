import {
  Button,
  Text,
  Input,
  Stack,
  Spinner,
  Center,
  Field,
  NativeSelect,
  Textarea,
  Link,
  useDisclosure,
  Dialog,
  CloseButton,
  Portal,
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { User } from '../../types';
import { useAuth } from '../../utils/auth';
import { ColorResult, TwitterPicker } from '@hello-pangea/color-picker';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

const DeleteUserModal = dynamic(() => import('./DeleteUserModal'), { ssr: false });

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
  const {
    open: isDeleteUserModalOpen,
    onOpen: onOpenDeleteUserModal,
    onClose: onCloseDeleteUserModal,
  } = useDisclosure();

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
    <>
      {isDeleteUserModalOpen && (
        <DeleteUserModal isOpen={isDeleteUserModalOpen} onClose={onCloseDeleteUserModal} />
      )}
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
                <Dialog.Title>{t('Lists.edit-profile')}</Dialog.Title>
              </Dialog.Header>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
              <Dialog.Body>
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
                    {/* <Field.Root>
                <Field.Label color="gray.300">Username</Field.Label>
                <Input
                  variant="subtle"
                  name="username"
                  onChange={handleChange}
                  value={userProfile.username ?? ''}
                />
                <Field.HelperText>Required</Field.HelperText>
              </Field.Root> */}
                    <Field.Root>
                      <Field.Label color="gray.300">{t('General.email-address')}</Field.Label>
                      <Input variant="subtle" disabled value={userProfile.email ?? ''} />
                      <Field.HelperText fontSize={'xs'}>
                        {t('Profile.email-helper')}
                      </Field.HelperText>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label color="gray.300">{t('Login.neopets-username')}</Field.Label>
                      <Input
                        variant="subtle"
                        name="neopetsUser"
                        onChange={handleChange}
                        value={userProfile.neopetsUser ?? ''}
                      />
                    </Field.Root>

                    <Field.Root>
                      <Field.Label color="gray.300">{t('General.description')}</Field.Label>
                      <Textarea
                        variant="subtle"
                        name="description"
                        onChange={handleChange}
                        value={userProfile.description ?? ''}
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
                        {t('Profile.profile-image-url')} (150x150)
                      </Field.Label>
                      <Input
                        variant="subtle"
                        name="profileImage"
                        onChange={handleChange}
                        value={userProfile.profileImage ?? ''}
                      />
                      <Field.HelperText fontSize={'xs'}>
                        {t('Profile.allowedDomains')}
                      </Field.HelperText>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label color="gray.300">Profile Mode</Field.Label>
                      <NativeSelect.Root variant="subtle">
                        <NativeSelect.Field
                          onChange={handleChange}
                          value={userProfile.profileMode ?? 'default'}
                          name="profileMode"
                        >
                          <option value={'default'}>Default</option>
                          <option value={'groups'}>List Groups</option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                      <Field.HelperText fontSize={'xs'}>
                        {t.rich('Profile.list-groups-helper', {
                          b: (children) => <b>{children}</b>,
                        })}
                      </Field.HelperText>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label color="gray.300">{t('General.color')}</Field.Label>
                      <Center w="100%">
                        <TwitterPicker
                          styles={colorPickerStyles}
                          triangle="hide"
                          color={userProfile.profileColor || '#000000'}
                          onChangeComplete={handleColorChange}
                        />
                      </Center>
                      <Field.HelperText fontSize={'xs'}>
                        {t('Profile.color-helper')}
                      </Field.HelperText>
                    </Field.Root>
                    <Field.Root mt={3}>
                      <Center>
                        <Button
                          size="xs"
                          variant={'outline'}
                          colorPalette="red"
                          onClick={onOpenDeleteUserModal}
                        >
                          Delete Account
                        </Button>
                      </Center>
                    </Field.Root>
                  </Stack>
                )}

                {isLoading && (
                  <Center>
                    <Spinner />
                  </Center>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                {!isLoading && (
                  <>
                    <Button variant="ghost" onClick={handleCancel} mr={3}>
                      {t('General.cancel')}
                    </Button>
                    <Button onClick={saveChanges}>{t('General.save')}</Button>
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

export default EditProfileModal;
