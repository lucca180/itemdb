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

export type ItemActionModalProps = {
  list: UserList | ReducedUserList;
  isOpen: boolean;
  action: string;
  selectedItems: ListItemInfo[];
  onClose: () => void;
  refresh: () => void;
};

const ItemActionModal = (props: ItemActionModalProps) => {
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
        }
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
          {action} {selectedItems.length} items?
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!isLoading && !error && action === 'move' && (
            <FormControl>
              <FormLabel color="gray.300">Destination</FormLabel>
              <ListSelect onChange={setDest} />
              <FormHelperText>
                Items that already exist in the destination list will not be modified and the item
                will be deleted from the current list
              </FormHelperText>
            </FormControl>
          )}

          {!isLoading && !error && action === 'delete' && (
            <Text color="gray.300">
              Are you sure you want to delete <b>{selectedItems.length} items</b> from{' '}
              <b>{list.name}</b>?<br />
              This action cannot be undone.
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
            <Button onClick={saveChanges} isDisabled={action === 'move' && !dest}>
              Confirm
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ItemActionModal;
