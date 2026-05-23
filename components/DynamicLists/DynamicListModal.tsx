import {
  Alert,
  Button,
  Center,
  CloseButton,
  Dialog,
  Field,
  List,
  NativeSelect,
  Portal,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { useToast } from '@utils/toast';
import axios from 'axios';
import Image from 'next/image';
import { useState } from 'react';
import { BsCheckCircleFill, BsExclamationCircleFill, BsXCircleFill } from 'react-icons/bs';
import DynamicIcon from '../../public/icons/dynamic.png';
import { DynamicListTypes, ExtendedSearchQuery, UserList } from '@types';
import { useAuth } from '@utils/auth';
import { useTranslations } from 'next-intl';
import { useLists } from '@utils/useLists';

export type DynamicListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  resultCount?: number;
  searchQuery?: ExtendedSearchQuery;
};

const DynamicListModal = (props: DynamicListModalProps) => {
  const t = useTranslations();
  const toast = useToast();
  const { isOpen, onClose, resultCount, searchQuery } = props;
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const { revalidate } = useLists();

  const [dynamicType, setDynamicType] = useState<DynamicListTypes>('addOnly');

  const createDynamic = async () => {
    if (!searchQuery || !user) return;

    setLoading(true);
    try {
      const newList = await createNewList();

      await axios.post(`/api/v1/lists/${user.username}/${newList.internal_id}/dynamic`, {
        dynamicType,
        queryData: searchQuery,
      });

      toast({
        title: t('Lists.dynamic-list-created'),
        status: 'success',
        duration: 5000,
      });
      onClose();
    } catch (e) {
      console.error(e);
      setError(true);
    }
  };

  const createNewList = async () => {
    if (!user) throw new Error('User not found');
    const getRandomName = (await import('../../utils/randomName')).getRandomName;

    const res = await axios.post(`/api/v1/lists/${user.username}`, {
      name: getRandomName(),
      description: '',
      cover_url: '',
      visibility: 'public',
      purpose: 'none',
      colorHex: '#fff',
    });

    if (res.data.success) {
      const list = res.data.message;
      revalidate();
      return list as UserList;
    } else throw new Error(res.data.message);
  };

  const doClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Dialog.Root
      open={isOpen}
      placement="center"
      closeOnEscape={!loading}
      closeOnInteractOutside={!loading}
      onOpenChange={(details) => {
        if (!details.open) doClose();
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header display="flex" alignItems="center">
              <Dialog.Title>
                Create{' '}
                <Image
                  src={DynamicIcon}
                  alt="lightning bolt"
                  width={16}
                  style={{ margin: '0 5px', display: 'inline' }}
                />{' '}
                {t('General.dynamic-list')}
              </Dialog.Title>
            </Dialog.Header>
            {!loading && (
              <Dialog.CloseTrigger asChild>
                <CloseButton />
              </Dialog.CloseTrigger>
            )}
            {!error && !loading && (
              <Dialog.Body>
                <Text fontSize="sm" color="gray.400">
                  {t('Lists.dynamic-listModalText')}
                </Text>
                <DynamicListInfo
                  dynamicType={dynamicType}
                  setDynamicType={setDynamicType}
                  resultCount={resultCount}
                />
              </Dialog.Body>
            )}

            {error && (
              <Dialog.Body>
                <Text color="red.300" textAlign="center">
                  {t('General.something-went-wrong')}
                  <br />
                  {t('General.refreshPage')}.
                </Text>
              </Dialog.Body>
            )}

            {loading && !error && (
              <Dialog.Body>
                <Center>
                  <Spinner />
                </Center>
              </Dialog.Body>
            )}

            <Dialog.Footer>
              {!loading && (
                <Button variant="ghost" mr={3} onClick={doClose}>
                  {t('General.close')}
                </Button>
              )}
              {!error && !loading && (
                <Button
                  variant="ghost"
                  colorPalette="orange"
                  onClick={createDynamic}
                  disabled={!!resultCount && resultCount > 4000 && dynamicType !== 'search'}
                >
                  <Image
                    src={DynamicIcon}
                    alt="lightning bolt"
                    width={12}
                    style={{ margin: '0 5px', display: 'inline' }}
                  />{' '}
                  {t('General.create')}
                </Button>
              )}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

type DynamicListModalInfoProps = {
  resultCount?: number;
  dynamicType: DynamicListTypes;
  setDynamicType: (type: DynamicListTypes) => void;
};

export const DynamicListInfo = (props: DynamicListModalInfoProps) => {
  const { resultCount, dynamicType, setDynamicType } = props;
  const { user } = useAuth();
  const t = useTranslations();
  return (
    <>
      <Alert.Root size="sm" status="warning" mt={5} borderRadius="md">
        <Alert.Indicator />
        <Alert.Title>{t('Lists.dynamic-listsModalLimit')}</Alert.Title>
      </Alert.Root>

      <Field.Root my={5}>
        <Field.Label>{t('Lists.dynamic-type')}</Field.Label>
        <NativeSelect.Root>
          <NativeSelect.Field
            value={dynamicType}
            bg="blackAlpha.300"
            onChange={(e) => setDynamicType(e.target.value as DynamicListTypes)}
          >
            <option value="addOnly">{t('Lists.add-only')}</option>
            <option value="removeOnly">{t('Lists.remove-only')}</option>
            <option value="fullSync">{t('Lists.full-sync')}</option>
            {user?.isAdmin && <option value="search">Search (Official Lists only)</option>}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <Field.HelperText>{t('Lists.dynamic-listModalChange')}</Field.HelperText>
      </Field.Root>
      <List.Root gap={2} variant="plain">
        <List.Item fontSize="sm" color="gray.400">
          <List.Indicator asChild color="green.300">
            <BsCheckCircleFill />
          </List.Indicator>
          {t('Lists.dynamic-listModalCurrentSearch', {
            resultCount: resultCount ?? 0,
          })}
        </List.Item>
        {dynamicType === 'addOnly' && (
          <>
            <List.Item fontSize="sm" color="gray.400" css={{ b: { color: 'green.200' } }}>
              <List.Indicator asChild color="green.300">
                <BsCheckCircleFill />
              </List.Indicator>
              {t.rich('DynamicList.addOnly-1', {
                b: (text) => <b>{text}</b>,
              })}
            </List.Item>
            <List.Item fontSize="sm" color="gray.400" css={{ b: { color: 'green.200' } }}>
              <List.Indicator asChild color="green.300">
                <BsCheckCircleFill />
              </List.Indicator>
              {t.rich('DynamicList.addOnly-2', {
                b: (text) => <b>{text}</b>,
              })}
            </List.Item>
            <List.Item fontSize="sm" color="gray.400" css={{ b: { color: 'orange.200' } }}>
              <List.Indicator asChild color="orange.300">
                <BsExclamationCircleFill />
              </List.Indicator>
              {t.rich('DynamicList.addOnly-3', {
                b: (text) => <b>{text}</b>,
              })}
            </List.Item>
            <List.Item fontSize="sm" color="gray.400" css={{ b: { color: 'red.200' } }}>
              <List.Indicator asChild color="red.300">
                <BsXCircleFill />
              </List.Indicator>
              {t.rich('DynamicList.addOnly-4', {
                b: (text) => <b>{text}</b>,
                i: (text) => <i>{text}</i>,
              })}
            </List.Item>
          </>
        )}
        {dynamicType === 'removeOnly' && (
          <>
            <List.Item fontSize="sm" color="gray.400" css={{ b: { color: 'orange.200' } }}>
              <List.Indicator asChild color="orange.300">
                <BsExclamationCircleFill />
              </List.Indicator>
              {t.rich('DynamicList.removeOnly-1', {
                b: (text) => <b>{text}</b>,
              })}
            </List.Item>
            <List.Item fontSize="sm" color="gray.400" css={{ b: { color: 'red.200' } }}>
              <List.Indicator asChild color="red.300">
                <BsXCircleFill />
              </List.Indicator>
              {t.rich('DynamicList.removeOnly-2', {
                b: (text) => <b>{text}</b>,
              })}
            </List.Item>
            <List.Item fontSize="sm" color="gray.400" css={{ b: { color: 'green.200' } }}>
              <List.Indicator asChild color="green.300">
                <BsCheckCircleFill />
              </List.Indicator>
              {t.rich('DynamicList.removeOnly-3', {
                b: (text) => <b>{text}</b>,
              })}
            </List.Item>
            <List.Item fontSize="sm" color="gray.400" css={{ b: { color: 'green.200' } }}>
              <List.Indicator asChild color="green.300">
                <BsCheckCircleFill />
              </List.Indicator>
              {t.rich('DynamicList.removeOnly-4', {
                b: (text) => <b>{text}</b>,
              })}
            </List.Item>
          </>
        )}
        {['fullSync', 'search'].includes(dynamicType) && (
          <>
            <List.Item fontSize="sm" color="gray.400" css={{ b: { color: 'green.200' } }}>
              <List.Indicator asChild color="green.300">
                <BsCheckCircleFill />
              </List.Indicator>
              {t.rich('DynamicList.fullSync-1', {
                b: (text) => <b>{text}</b>,
              })}
            </List.Item>
            <List.Item fontSize="sm" color="gray.400" css={{ b: { color: 'red.200' } }}>
              <List.Indicator asChild color="red.300">
                <BsXCircleFill />
              </List.Indicator>
              {t.rich('DynamicList.fullSync-2', {
                b: (text) => <b>{text}</b>,
              })}
            </List.Item>
            <List.Item fontSize="sm" color="gray.400" css={{ b: { color: 'green.200' } }}>
              <List.Indicator asChild color="green.300">
                <BsCheckCircleFill />
              </List.Indicator>
              {t.rich('DynamicList.fullSync-3', {
                b: (text) => <b>{text}</b>,
              })}
            </List.Item>
            <List.Item fontSize="sm" color="gray.400" css={{ b: { color: 'red.200' } }}>
              <List.Indicator asChild color="red.300">
                <BsXCircleFill />
              </List.Indicator>
              {t.rich('DynamicList.fullSync-4', {
                b: (text) => <b>{text}</b>,
                i: (text) => <i>{text}</i>,
              })}
            </List.Item>
          </>
        )}
      </List.Root>
    </>
  );
};

export default DynamicListModal;
