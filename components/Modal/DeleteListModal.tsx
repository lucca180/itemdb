import { Button, Text, Spinner, Center, Dialog, CloseButton, Portal } from '@chakra-ui/react';
import axios from 'axios';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLists } from '../../utils/useLists';

export type DeleteListModalProps = {
  isOpen: boolean;
  selectedLists: number[];
  username: string;
  onClose: () => void;
  refresh: () => void;
};

const DeleteListModal = (props: DeleteListModalProps) => {
  const t = useTranslations();
  const { isOpen, onClose, selectedLists: listsIds, refresh, username } = props;
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const { revalidate } = useLists();

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const res = await axios.delete(`/api/v1/lists/${username}`, {
        data: {
          listIds: listsIds,
        },
      });

      if (res.data.success) {
        refresh();
        handleClose();
        revalidate();
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
                {t('Lists.delete-length-lists', { lists: listsIds.length })}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              {!loading && !error && (
                <Text color="gray.300">
                  {t.rich('Lists.delete-lists-confirmation', {
                    b: (chunk) => <b>{chunk}</b>,
                    br: () => <br />,
                    lists: listsIds.length,
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
              <Button variant="ghost" mr={3} onClick={handleClose}>
                {t('General.cancel')}
              </Button>
              {!loading && !error && (
                <Button onClick={confirmDelete} colorPalette="red">
                  {t('General.delete')}
                </Button>
              )}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default DeleteListModal;
