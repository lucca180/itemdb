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
} from '@chakra-ui/react';
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
  const [isLoading, setLoading] = useState<boolean>(false);
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
    <Modal isOpen={isOpen} onClose={handleClose} isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textTransform="capitalize">
          {t('Lists.delete-length-lists', { lists: listsIds.length })}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!isLoading && !error && (
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
            <Button onClick={confirmDelete} colorScheme="red">
              {t('General.delete')}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteListModal;
