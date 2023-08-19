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
import { useAuth, UserLists } from '../../utils/auth';
import { useAtom } from 'jotai';

export type DeleteListModalProps = {
  isOpen: boolean;
  selectedLists: number[];
  username: string;
  onClose: () => void;
  refresh: () => void;
};

const DeleteListModal = (props: DeleteListModalProps) => {
  const { getIdToken } = useAuth();
  const { isOpen, onClose, selectedLists: listsIds, refresh, username } = props;
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [, setStorageLists] = useAtom(UserLists);

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();

      const res = await axios.delete(`/api/v1/lists/${username}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
        data: {
          listIds: listsIds,
        },
      });

      if (res.data.success) {
        refresh();
        handleClose();
        setStorageLists(null);
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
        <ModalHeader textTransform="capitalize">Delete {listsIds.length} lists?</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!isLoading && !error && (
            <Text color="gray.300">
              Are you sure you want to delete <b>{listsIds.length} lists</b>?
              <br />
              This action CANNOT be undone.
            </Text>
          )}

          {error && <Text color="red.500">An error occured, please try again later</Text>}
          {isLoading && (
            <Center>
              <Spinner />
            </Center>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          {!isLoading && !error && (
            <Button onClick={confirmDelete} colorScheme="red">
              Delete
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteListModal;
