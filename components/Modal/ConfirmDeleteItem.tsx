import { Button, Spinner, Dialog, Portal } from '@chakra-ui/react';
import axios from 'axios';
import React from 'react';
import { ItemData } from '../../types';
import { useTranslations } from 'next-intl';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item: ItemData;
};

const ConfirmDeleteItem = (props: Props) => {
  const t = useTranslations();
  const { isOpen, onClose, item } = props;
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState('');

  const onConfirm = async () => {
    setLoading(true);

    try {
      const res = await axios.delete(`/api/v1/items/${item.internal_id}`);

      if (res.status === 200) {
        setMsg(t('Lists.item-deleted-successfully-you-can-close-this-page-now'));
        setLoading(false);
      }
    } catch (err) {
      setMsg(t('General.something-went-wrong-please-try-again-later'));
      setLoading(false);
    }
  };

  const dialogOpen = msg ? true : loading ? true : isOpen;
  const handleOpenChange = ({ open }: { open: boolean }) => {
    if (!open && !loading) onClose();
  };

  if (msg)
    return (
      <Dialog.Root role="alertdialog" open onOpenChange={handleOpenChange} placement="center">
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title fontSize="lg" fontWeight="bold">
                  {t('Lists.delete-item-name', { x: item.name })}?
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>{msg}</Dialog.Body>
              <Dialog.Footer>
                <Button onClick={onClose}>{t('General.close')}</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    );

  if (loading)
    return (
      <Dialog.Root role="alertdialog" open onOpenChange={() => {}} placement="center">
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title fontSize="lg" fontWeight="bold">
                  {t('Lists.delete-item-name', { x: item.name })}?
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Spinner />
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    );

  return (
    <Dialog.Root
      role="alertdialog"
      open={dialogOpen}
      onOpenChange={handleOpenChange}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title fontSize="lg" fontWeight="bold">
                {t('Lists.delete-item-name', { x: item.name })}??
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {t('General.are-you-sure-you-cant-undo-this-action-afterwards')}
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onClose}>
                {t('General.cancel')}
              </Button>
              <Button colorPalette="red" onClick={onConfirm} ml={3}>
                {t('General.delete')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default ConfirmDeleteItem;
