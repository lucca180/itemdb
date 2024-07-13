import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Text,
  Flex,
  useToast,
  useDisclosure,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';
import ItemSelect from '../Input/ItemSelect';
import axios from 'axios';
import { useAuth } from '../../utils/auth';
import { ItemData, ListItemInfo, UserList } from '../../types';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { DuplicatedItemModalProps } from './DuplicatedItemModal';

const DuplicatedItemModal = dynamic<DuplicatedItemModalProps>(
  () => import('./DuplicatedItemModal')
);
export type AddListItemsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  list: UserList;
};

export default function AddListItemsModal(props: AddListItemsModalProps) {
  const t = useTranslations();
  const { isOpen, onClose, list } = props;
  const { isOpen: isDupOpen, onOpen: onDupOpen, onClose: onDupClose } = useDisclosure();
  const [duplicatedItemInfo, setDuplicatedItemInfo] = useState<ListItemInfo | undefined>();
  const [duplicatedItem, setDuplicatedItem] = useState<ItemData | undefined>();
  const toast = useToast();
  const { user } = useAuth();

  const addItemToList = async (item: ItemData) => {
    if (!user || !item) return;

    const toastId = toast({
      title: t('Layout.adding-item-to-list'),
      status: 'info',
      duration: null,
      isClosable: true,
    });

    try {
      const res = await axios.put(
        `/api/v1/lists/${user.username}/${list.internal_id}?alertDuplicates=true`,
        {
          items: [
            {
              item_iid: item.internal_id,
            },
          ],
        }
      );
      if (res.data.success) {
        toast.update(toastId, {
          title: t('Lists.item-added-to-list'),
          description: t('Lists.need-refresh'),
          status: 'success',
          duration: 5000,
        });
      }
    } catch (err: any) {
      console.error(err);

      if (err.response.data.error === 'Duplicate Items') {
        toast.close(toastId);
        setDuplicatedItemInfo(err.response.data.data[0]);
        setDuplicatedItem(item);
        onDupOpen();
        return;
      }

      toast.update(toastId, {
        title: t('General.an-error-occurred'),
        description: t('Layout.error-adding-item-to-list'),
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <>
      {isDupOpen && !!duplicatedItemInfo && (
        <DuplicatedItemModal
          item={duplicatedItem!}
          isOpen={isDupOpen}
          onClose={onDupClose}
          itemInfo={duplicatedItemInfo}
          list={list}
        />
      )}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('Lists.add-items-to-list')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody fontSize={'sm'} sx={{ a: { color: 'blue.200' } }}>
            <Flex flexFlow="column" justifyContent={'center'} alignItems={'center'} gap={2}>
              <ItemSelect
                placeholder={t('General.search-items')}
                onChange={(a) => addItemToList(a)}
              />
              <Text fontSize="xs" color="whiteAlpha.600">
                {t.rich('Lists.import-modal-cta', {
                  Link: (chunk) => <NextLink href="/import">{chunk}</NextLink>,
                })}
              </Text>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose} size="sm">
              {t('General.close')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
