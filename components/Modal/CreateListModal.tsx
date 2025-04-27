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
  Link,
} from '@chakra-ui/react';
import axios from 'axios';
import { useState } from 'react';
import { ColorType, UserList } from '../../types';
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

const defaultColors = [
  '#FF6900',
  '#FCB900',
  '#7BDCB5',
  '#00D084',
  '#8ED1FC',
  '#0693E3',
  '#ABB8C3',
  '#EB144C',
  '#F78DA7',
  '#9900EF',
];

const CreateListModal = (props: CreateListModalProps) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { isOpen, onClose } = props;
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [list, setList] = useState(props.list ?? defaultList);
  const { revalidate } = useLists();
  const [colorPalette, setColorPalette] = useState<string[]>(defaultColors);

  const saveChanges = async () => {
    setLoading(true);
    try {
      if (!user) return;

      const data = {
        list_id: list.internal_id,
        name: list.name,
        description: list.description,
        coverURL: list.coverURL,
        visibility: list.visibility,
        purpose: list.purpose,
        colorHex: list.colorHex,
        official: user.isAdmin ? list.official : undefined,
        officialTag: user.isAdmin ? list.officialTag : undefined,
        sortInfo: {
          sortBy: list.sortBy,
          sortDir: list.sortDir,
        },
        seriesType: list.seriesType,
        seriesStart: list.seriesStart,
        seriesEnd: list.seriesEnd,
      };

      const username = list.owner?.username ?? user.username;

      // if list exists then update, else create
      const res = await (props.list
        ? axios.post(`/api/v1/lists/${username}/${list.internal_id}`, data)
        : axios.post(`/api/v1/lists/${username}`, data));

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

  const loadColorPalette = async () => {
    const url = list.coverURL;

    if (!url || !isValidHttpUrl(url)) {
      setColorPalette(defaultColors);
      return;
    }

    try {
      const res = await axios.post('/api/v1/tools/getColor', { url: url });
      const data = res.data as Record<ColorType, { hex: string }>;
      const colors = Object.values(data).map((color) => color.hex);
      setColorPalette([...defaultColors, ...colors]);
    } catch (err) {
      console.error(err);
      setColorPalette(defaultColors);
    }
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
              {props.list && user?.id !== props.list?.owner.id && user?.isAdmin && (
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
                    <>
                      <FormControl>
                        <FormLabel color="gray.300">{t('Lists.official-tag')}</FormLabel>
                        <Input
                          variant="filled"
                          name="officialTag"
                          onChange={handleChange}
                          value={list.officialTag ?? ''}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel color="gray.300">Series Type</FormLabel>
                        <Select
                          variant="filled"
                          name="seriesType"
                          onChange={handleChange}
                          value={list.seriesType ?? 'none'}
                        >
                          <option value="none">None</option>
                          <option value="listCreation">List Creation</option>
                          <option value="itemAddition">Item Addition</option>
                          <option value="listDates">Series Dates</option>
                        </Select>
                      </FormControl>
                      {list.seriesType === 'listDates' && (
                        <>
                          <FormControl>
                            <FormLabel color="gray.300">Series Start</FormLabel>
                            <Input
                              variant="filled"
                              type="date"
                              name="seriesStart"
                              onChange={handleChange}
                              value={list.seriesStart?.split('T')[0] ?? ''}
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel color="gray.300">Series End</FormLabel>
                            <Input
                              variant="filled"
                              type="date"
                              name="seriesEnd"
                              onChange={handleChange}
                              min={list.seriesStart || undefined}
                              value={list.seriesEnd?.split('T')[0] ?? ''}
                            />
                          </FormControl>
                        </>
                      )}
                    </>
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
                <FormHelperText fontSize={'xs'}>{t('General.required')}</FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">{t('General.description')}</FormLabel>
                <Textarea
                  variant="filled"
                  name="description"
                  onChange={handleChange}
                  value={list.description ?? ''}
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
                <Center flexFlow={'column'} gap={2}>
                  <TwitterPicker
                    styles={colorPickerStyles}
                    triangle="hide"
                    colors={colorPalette}
                    color={list.colorHex ?? '#000000'}
                    onChangeComplete={handleColorChange}
                  />
                  <Button
                    size={'xs'}
                    onClick={loadColorPalette}
                    isDisabled={!isValidHttpUrl(list.coverURL)}
                  >
                    {t('Lists.load-cover-image-palette')}
                  </Button>
                </Center>
                <FormHelperText fontSize={'xs'}>{t('Lists.color-helper')}</FormHelperText>
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
                <FormHelperText fontSize={'xs'}>{t('Lists.seeking-trading-msg')}</FormHelperText>
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

function isValidHttpUrl(string?: string | null) {
  if (!string) return false;

  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
}
