import { Button, Center, CloseButton, Dialog, Portal, Spinner, Text } from '@chakra-ui/react';
import { useToast } from '@utils/theme/toast';
import axios from 'axios';
import Image from 'next/image';
import { useState } from 'react';
import DynamicIcon from '../../public/icons/dynamic.png';
import { DynamicListTypes, UserList } from '@types';
import { useAuth } from '@utils/auth';
import { useTranslations } from 'next-intl';
import { DynamicListInfo } from './DynamicListModal';
import { useLists } from '@utils/useLists';

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

  const [dynamicType, setDynamicType] = useState<DynamicListTypes>('fullSync');

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
        id: 'linked-list-created',
        title: t('Lists.linked-list-created'),
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

    const res = await axios.post(`/api/v1/lists/${user.username}`, {
      name: list.name + ' (Checklist)',
      description: list.description,
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
                Linked List
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
                  {t('DynamicList.linkedLists-desc')}
                </Text>
                <DynamicListInfo
                  resultCount={list.itemCount ?? -1}
                  dynamicType={dynamicType}
                  setDynamicType={setDynamicType}
                />
              </Dialog.Body>
            )}

            {error && (
              <Dialog.Body>
                <Text color="red.300" textAlign="center">
                  {t('General.something-went-wrong')}
                  <br />
                  {t('General.refreshPage')}
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
                  disabled={(list.itemCount ?? -1) > 4000}
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

export default LinkedListModal;
