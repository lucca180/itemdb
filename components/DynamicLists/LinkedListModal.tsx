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
  Spinner,
  Center,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import Image from 'next/image';
import { useState } from 'react';
import DynamicIcon from '../../public/icons/dynamic.png';
import { UserList } from '../../types';
import { useAuth } from '../../utils/auth';
import { useTranslations } from 'next-intl';
import { DynamicListInfo } from './DynamicListModal';
import { useLists } from '../../utils/useLists';

export type LinkedListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  list: UserList;
  onCreate?: (newList: UserList) => void;
};

const LinkedListModal = (props: LinkedListModalProps) => {
  const t = useTranslations();
  const toast = useToast();
  const { isOpen, onClose, list, onCreate } = props;
  const { user } = useAuth();
  const { revalidate } = useLists();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const [dynamicType, setDynamicType] = useState<'addOnly' | 'removeOnly' | 'fullSync'>('fullSync');

  const createDynamic = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const newList = await createNewList();

      await axios.post(`/api/v1/lists/${user.username}/${newList.internal_id}/dynamic`, {
        dynamicType,
        linked_id: list.internal_id,
      });

      onCreate?.({ ...newList, dynamicType: dynamicType, linkedListId: list.internal_id });
      toast({
        title: t('Lists.linked-list-created'),
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

    const res = await axios.post(`/api/v1/lists/${user.username}`, {
      name: list.name + ' (Checklist)',
      description: '',
      coverURL: list.coverURL,
      visibility: 'public',
      purpose: 'none',
      colorHex: list.colorHex,
    });

    if (res.data.success) {
      const list = res.data.message;
      revalidate();
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
          Linked List
        </ModalHeader>
        <ModalCloseButton />
        {!error && !loading && (
          <ModalBody>
            <Text fontSize="sm" color="gray.400">
              {t('DynamicList.linkedLists-desc')}
            </Text>
            <DynamicListInfo
              resultCount={list.itemCount}
              dynamicType={dynamicType}
              setDynamicType={setDynamicType}
            />
          </ModalBody>
        )}

        {error && (
          <ModalBody>
            <Text color="red.300" textAlign={'center'}>
              {t('General.something-went-wrong')}
              <br />
              {t('General.refreshPage')}
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
              isDisabled={list.itemCount > 4000}
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

export default LinkedListModal;
