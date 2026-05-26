import {
  Button,
  Text,
  Field,
  Spinner,
  Center,
  Dialog,
  CloseButton,
  Portal,
} from '@chakra-ui/react';
import { useToast } from '@utils/theme/toast';
import axios from 'axios';
import { useState } from 'react';
import { ListItemInfo, ObligatoryUserList, UserList } from '../../types';
import ListSelect from '../UserLists/ListSelect';
import { useTranslations } from 'next-intl';

export type ItemActionModalProps = {
  list: UserList | ObligatoryUserList;
  isOpen: boolean;
  action: 'move' | 'delete' | 'copy' | '';
  selectedItems: ListItemInfo[];
  onClose: () => void;
  refresh: () => void;
};

const ItemActionModal = (props: ItemActionModalProps) => {
  const t = useTranslations();
  const toast = useToast();
  const { isOpen, onClose, action, selectedItems, list, refresh } = props;
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [dest, setDest] = useState<UserList>();

  const saveChanges = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`/api/v1/lists/${list.owner.username}/${list.internal_id}`, {
        list_id: list.internal_id,
        itemInfo: selectedItems,
        listDestId: ['copy', 'move'].includes(action) ? dest?.internal_id : undefined,
        action,
      });

      if (res.status === 200) {
        toast({
          id: 'item-action-success',
          title: t('General.success'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
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
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) handleClose();
      }}
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title textTransform="capitalize">
                {action === 'move' && t('Lists.move-n-items', { items: selectedItems.length })}
                {action === 'delete' &&
                  t('Lists.delete-items-items', { items: selectedItems.length })}
                {action === 'copy' &&
                  t('Lists.copying-items-items', { items: selectedItems.length })}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              {!loading && !error && ['copy', 'move'].includes(action) && (
                <Field.Root>
                  <Field.Label color="gray.300">{t('Lists.destination')}</Field.Label>
                  <ListSelect onChange={setDest} />
                  <Field.HelperText>{t('Lists.move-text')}</Field.HelperText>
                </Field.Root>
              )}

              {!loading && !error && action === 'delete' && (
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
              {loading && (
                <Center>
                  <Spinner />
                </Center>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              {!loading && !error && (
                <>
                  <Button variant="ghost" mr={3} onClick={handleClose}>
                    {t('General.cancel')}
                  </Button>
                  <Button onClick={saveChanges} disabled={action === 'move' && !dest}>
                    {t('General.confirm')}
                  </Button>
                </>
              )}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default ItemActionModal;
