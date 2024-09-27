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
  Spinner,
  Center,
  FormHelperText,
} from '@chakra-ui/react';
import axios from 'axios';
import { useState } from 'react';
import { ListItemInfo, ReducedUserList, UserList } from '../../types';
import { useAuth } from '../../utils/auth';
import ListSelect from '../UserLists/ListSelect';
import { useTranslations } from 'next-intl';

export type ItemActionModalProps = {
  list: UserList | ReducedUserList;
  isOpen: boolean;
  action: 'move' | 'delete' | '';
  selectedItems: ListItemInfo[];
  onClose: () => void;
  refresh: () => void;
};

const ItemActionModal = (props: ItemActionModalProps) => {
  const t = useTranslations();
  const { getIdToken } = useAuth();
  const { isOpen, onClose, action, selectedItems, list, refresh } = props;
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [dest, setDest] = useState<UserList>();

  const saveChanges = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();

      const res = await axios.post(
        `/api/v1/lists/${list.owner.username}/${list.internal_id}`,
        {
          list_id: list.internal_id,
          itemInfo: selectedItems,
          listDestId: action === 'move' ? dest?.internal_id : undefined,
          action,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.status === 200) {
        refresh();
        handleClose();
        setLoading(false);
      } else throw res.data;
    } catch (e) {
      console.error(e);
      setLoading(false);
      setError(true);
    }
  };

  const handleClose = () => {
    onClose();
    setError(false);
    setDest(undefined);
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textTransform="capitalize">
          {action === 'move' && t('Lists.move-n-items', { items: selectedItems.length })}
          {action === 'delete' && t('Lists.delete-items-items', { items: selectedItems.length })}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!isLoading && !error && action === 'move' && (
            <FormControl>
              <FormLabel color="gray.300">{t('Lists.destination')}</FormLabel>
              <ListSelect onChange={setDest} />
              <FormHelperText>{t('Lists.move-text')}</FormHelperText>
            </FormControl>
          )}

          {!isLoading && !error && action === 'delete' && (
            <Text color="gray.300">
              {t.rich('Lists.delete-items-confirmation', {
                b: (chunk) => <b>{chunk}</b>,
                br: () => <br />,
                listName: list.name,
                items: selectedItems.length,
              })}
            </Text>
          )}

          {error && (
            <Text color="red.500">{t('General.an-error-occured-please-try-again-later')}</Text>
          )}
          {isLoading && (
            <Center>
              <Spinner />
            </Center>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            {t('General.cancel')}
          </Button>
          {!isLoading && !error && (
            <Button onClick={saveChanges} isDisabled={action === 'move' && !dest}>
              {t('General.confirm')}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ItemActionModal;
