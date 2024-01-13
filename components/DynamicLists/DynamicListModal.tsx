import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Select,
  FormControl,
  FormLabel,
  List,
  ListIcon,
  ListItem,
  FormHelperText,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { useAtom } from 'jotai';

import Image from 'next/image';
import { useState } from 'react';
import { BsCheckCircleFill, BsExclamationCircleFill, BsXCircleFill } from 'react-icons/bs';
import DynamicIcon from '../../public/icons/dynamic.png';
import { ExtendedSearchQuery, UserList } from '../../types';
import { useAuth, UserLists } from '../../utils/auth';
import { getRandomName } from '../../utils/randomName';
import { useTranslations } from 'next-intl';

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
  const { user, getIdToken } = useAuth();
  const [, setStorageLists] = useAtom(UserLists);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const [dynamicType, setDynamicType] = useState<'addOnly' | 'removeOnly' | 'fullSync'>('addOnly');

  const createDynamic = async () => {
    if (!searchQuery || !user) return;

    setLoading(true);
    try {
      const token = await getIdToken();
      const newList = await createNewList();

      const res = await axios.post(
        `/api/v1/lists/${user.username}/${newList.internal_id}/dynamic`,
        {
          dynamicType,
          queryData: searchQuery,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(res.data);
      toast({
        title: t('Lists.dynamic-list-created'),
        status: 'success',
        duration: 5000,
      });
      onClose();
    } catch (e) {
      console.log(e);
      setError(true);
    }
  };

  const createNewList = async () => {
    if (!user) throw new Error('User not found');
    const token = await getIdToken();

    const res = await axios.post(
      `/api/v1/lists/${user.username}`,
      {
        name: getRandomName(),
        description: '',
        cover_url: '',
        visibility: 'public',
        purpose: 'none',
        colorHex: '#fff',
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.data.success) {
      const list = res.data.message;
      setStorageLists(null);
      return list as UserList;
    } else throw new Error(res.data.message);
  };

  const doClose = () => {
    if (loading) return false;
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={doClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader display={'flex'} alignItems="center">
          Create{' '}
          <Image
            src={DynamicIcon}
            alt="lightning bolt"
            width={16}
            style={{ margin: '0 5px', display: 'inline' }}
          />{' '}
          {t('General.dynamic-list')}
        </ModalHeader>
        <ModalCloseButton />
        {!error && !loading && (
          <ModalBody>
            <Text fontSize="sm" color="gray.400">
              {t('Lists.dynamic-listModalText')}
            </Text>
            <DynamicListInfo
              dynamicType={dynamicType}
              setDynamicType={setDynamicType}
              resultCount={resultCount}
            />
          </ModalBody>
        )}

        {error && (
          <ModalBody>
            <Text color="red.300" textAlign={'center'}>
              {t('General.something-went-wrong')}
              <br />
              {t('General.refreshPage')}.
            </Text>
          </ModalBody>
        )}

        {loading && !error && (
          <ModalBody>
            <Center>
              <Spinner />
            </Center>
          </ModalBody>
        )}

        <ModalFooter>
          {!loading && (
            <Button variant="ghost" mr={3} onClick={doClose}>
              {t('General.close')}
            </Button>
          )}
          {!error && !loading && (
            <Button
              variant="ghost"
              colorScheme={'orange'}
              onClick={createDynamic}
              isDisabled={!!resultCount && resultCount > 4000}
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
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

type DynamicListModalInfoProps = {
  resultCount?: number;
  dynamicType: 'addOnly' | 'removeOnly' | 'fullSync';
  setDynamicType: (type: 'addOnly' | 'removeOnly' | 'fullSync') => void;
};
export const DynamicListInfo = (props: DynamicListModalInfoProps) => {
  const { resultCount, dynamicType, setDynamicType } = props;
  const t = useTranslations();
  return (
    <>
      <Alert size="sm" status="warning" mt={5} borderRadius={'md'}>
        <AlertIcon />
        {t('Lists.dynamic-listsModalLimit')}
      </Alert>

      <FormControl my={5}>
        <FormLabel>{t('Lists.dynamic-type')}</FormLabel>
        <Select
          value={dynamicType}
          variant="solid"
          bg={'blackAlpha.300'}
          onChange={(e) => setDynamicType(e.target.value as 'addOnly' | 'removeOnly' | 'fullSync')}
        >
          <option value="addOnly">{t('Lists.add-only')}</option>
          <option value="removeOnly">{t('Lists.remove-only')}</option>
          <option value="fullSync">{t('Lists.full-sync')}</option>
        </Select>
        <FormHelperText>{t('Lists.dynamic-listModalChange')}</FormHelperText>
      </FormControl>
      <List spacing={2}>
        <ListItem fontSize={'sm'} color="gray.400">
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          {t('Lists.dynamic-listModalCurrentSearch', {
            resultCount: resultCount,
          })}
        </ListItem>
        {dynamicType === 'addOnly' && (
          <>
            <ListItem fontSize={'sm'} color="gray.400" sx={{ b: { color: 'green.200' } }}>
              <ListIcon as={BsCheckCircleFill} color="green.300" />
              {t.rich('DynamicList.addOnly-1', {
                b: (text) => <b>{text}</b>,
              })}
            </ListItem>
            <ListItem fontSize={'sm'} color="gray.400" sx={{ b: { color: 'green.200' } }}>
              <ListIcon as={BsCheckCircleFill} color="green.300" />
              {t.rich('DynamicList.addOnly-2', {
                b: (text) => <b>{text}</b>,
              })}
            </ListItem>
            <ListItem fontSize={'sm'} color="gray.400" sx={{ b: { color: 'orange.200' } }}>
              <ListIcon as={BsExclamationCircleFill} color="orange.300" />
              {t.rich('DynamicList.addOnly-3', {
                b: (text) => <b>{text}</b>,
              })}
            </ListItem>
            <ListItem fontSize={'sm'} color="gray.400" sx={{ b: { color: 'red.200' } }}>
              <ListIcon as={BsXCircleFill} color="red.300" />
              {t.rich('DynamicList.addOnly-4', {
                b: (text) => <b>{text}</b>,
                i: (text) => <i>{text}</i>,
              })}
            </ListItem>
          </>
        )}
        {dynamicType === 'removeOnly' && (
          <>
            <ListItem fontSize={'sm'} color="gray.400" sx={{ b: { color: 'orange.200' } }}>
              <ListIcon as={BsExclamationCircleFill} color="orange.300" />
              {t.rich('DynamicList.removeOnly-1', {
                b: (text) => <b>{text}</b>,
              })}
            </ListItem>
            <ListItem fontSize={'sm'} color="gray.400" sx={{ b: { color: 'red.200' } }}>
              <ListIcon as={BsXCircleFill} color="red.300" />
              {t.rich('DynamicList.removeOnly-2', {
                b: (text) => <b>{text}</b>,
              })}
            </ListItem>
            <ListItem fontSize={'sm'} color="gray.400" sx={{ b: { color: 'green.200' } }}>
              <ListIcon as={BsCheckCircleFill} color="green.300" />
              {t.rich('DynamicList.removeOnly-3', {
                b: (text) => <b>{text}</b>,
              })}
            </ListItem>
            <ListItem fontSize={'sm'} color="gray.400" sx={{ b: { color: 'green.200' } }}>
              <ListIcon as={BsCheckCircleFill} color="green.300" />
              {t.rich('DynamicList.removeOnly-4', {
                b: (text) => <b>{text}</b>,
              })}
            </ListItem>
          </>
        )}
        {dynamicType === 'fullSync' && (
          <>
            <ListItem fontSize={'sm'} color="gray.400" sx={{ b: { color: 'green.200' } }}>
              <ListIcon as={BsCheckCircleFill} color="green.300" />
              {t.rich('DynamicList.fullSync-1', {
                b: (text) => <b>{text}</b>,
              })}
            </ListItem>
            <ListItem fontSize={'sm'} color="gray.400" sx={{ b: { color: 'red.200' } }}>
              <ListIcon as={BsXCircleFill} color="red.300" />
              {t.rich('DynamicList.fullSync-2', {
                b: (text) => <b>{text}</b>,
              })}
            </ListItem>
            <ListItem fontSize={'sm'} color="gray.400">
              <ListIcon
                as={BsCheckCircleFill}
                color="green.300"
                sx={{ b: { color: 'green.200' } }}
              />
              {t.rich('DynamicList.fullSync-3', {
                b: (text) => <b>{text}</b>,
              })}
            </ListItem>
            <ListItem fontSize={'sm'} color="gray.400" sx={{ b: { color: 'red.200' } }}>
              <ListIcon as={BsXCircleFill} color="red.300" />
              {t.rich('DynamicList.fullSync-4', {
                b: (text) => <b>{text}</b>,
                i: (text) => <i>{text}</i>,
              })}
            </ListItem>
          </>
        )}
      </List>
    </>
  );
};

export default DynamicListModal;
