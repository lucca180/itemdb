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
  Divider,
} from '@chakra-ui/react';
import axios from 'axios';
import { useState } from 'react';
import { UserList } from '../../types';
import { useAuth } from '../../utils/auth';
import { ColorResult, TwitterPicker } from '@hello-pangea/color-picker';
import { useTranslations } from 'next-intl';
import { useLists } from '../../utils/useLists';

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
  const t = useTranslations();
  const { user, getIdToken } = useAuth();
  const { isOpen, onClose } = props;
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [list, setList] = useState(props.list ?? defaultList);
  const { revalidate } = useLists();

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
        officialTag: list.officialTag,
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
        revalidate();
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
        <ModalHeader>
          {props.list ? t('Button.edit') : t('General.create')} {t('Lists.List')}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!isLoading && !error && (
            <Stack gap={3}>
              {props.list && user?.id !== props.list?.user_id && user?.isAdmin && (
                <Text textAlign="center" color="red.300">
                  {t('Lists.admin-edit-msg')}
                </Text>
              )}
              {user?.isAdmin && (
                <Stack gap={3} mb={3}>
                  <FormControl>
                    <Checkbox
                      isChecked={list.official}
                      onChange={(value) =>
                        setList({
                          ...list,
                          official: value.target.checked,
                        })
                      }
                    >
                      <Badge colorScheme="blue">✓ {t('General.official')}</Badge>
                    </Checkbox>
                  </FormControl>
                  {list.official && (
                    <FormControl>
                      <FormLabel color="gray.300">{t('Lists.official-tag')}</FormLabel>
                      <Input
                        variant="filled"
                        name="officialTag"
                        onChange={handleChange}
                        value={list.officialTag ?? ''}
                      />
                    </FormControl>
                  )}
                  <Divider />
                </Stack>
              )}

              <FormControl>
                <FormLabel color="gray.300">{t('ItemPage.list-name')}</FormLabel>
                <Input
                  variant="filled"
                  name="name"
                  onChange={handleChange}
                  value={list.name}
                  isInvalid={/^\d+$/.test(list.name ?? '')}
                />
                <FormHelperText>{t('General.required')}</FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">{t('General.description')}</FormLabel>
                <Textarea
                  variant="filled"
                  name="description"
                  onChange={handleChange}
                  value={list.description ?? ''}
                />
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">{t('Lists.cover-image-url')} (150x150)</FormLabel>
                <Input
                  variant="filled"
                  name="coverURL"
                  onChange={handleChange}
                  value={list.coverURL ?? ''}
                />
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">{t('General.color')}</FormLabel>
                <Center>
                  <TwitterPicker
                    styles={colorPickerStyles}
                    triangle="hide"
                    color={list.colorHex ?? '#000000'}
                    onChangeComplete={handleColorChange}
                  />
                </Center>
                <FormHelperText>{t('Lists.color-helper')}</FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">{t('General.visibility')}</FormLabel>
                <Select
                  variant="filled"
                  name="visibility"
                  onChange={handleChange}
                  value={list.visibility}
                >
                  <option value="public">{t('General.public')}</option>
                  <option value="unlisted">{t('General.unlisted')}</option>
                  <option value="private">{t('General.private')}</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">{t('Lists.purpose')}</FormLabel>
                <Select
                  variant="filled"
                  name="purpose"
                  onChange={handleChange}
                  value={list.purpose}
                >
                  <option value="none">{t('Lists.none')}</option>
                  <option value="seeking">{t('Lists.seeking-these-items')}</option>
                  <option value="trading">{t('Lists.trading-these-items')}</option>
                </Select>
                <FormHelperText>{t('Lists.seeking-trading-msg')}</FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">{t('Lists.default-sorting')}</FormLabel>
                <Select variant="filled" name="sortBy" onChange={handleChange} value={list.sortBy}>
                  <option value="name">{t('General.name')}</option>
                  <option value="price">{t('General.price')}</option>
                  <option value="rarity">{t('General.rarity')}</option>
                  <option value="color">{t('General.color')}</option>
                  <option value="custom">{t('General.custom')}</option>
                  <option value="addedAt">{t('General.added-at')}</option>
                  <option value="faerieFest">{t('General.recycling-points')}</option>
                  <option value="item_id">{t('General.item-id')}</option>
                </Select>
                <FormHelperText>
                  {list.sortBy === 'custom' && t('Lists.custom-sort-msg')}
                </FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">{t('General.sort-direction')}</FormLabel>
                <Select
                  variant="filled"
                  name="sortDir"
                  onChange={handleChange}
                  value={list.sortDir}
                >
                  <option value="asc">{t('General.ascending')}</option>
                  <option value="desc">{t('General.descending')}</option>
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
                {t('General.an-error-has-occurred')}!
                <br />
                {t('General.refreshPage')}
              </Text>
            </Center>
          )}
        </ModalBody>
        <ModalFooter>
          {!isLoading && !error && (
            <>
              <Button variant="ghost" onClick={handleCancel} mr={3}>
                {t('General.cancel')}
              </Button>
              <Button onClick={saveChanges} isDisabled={!list.name}>
                {props.list ? t('General.save') : t('General.create')}
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateListModal;
