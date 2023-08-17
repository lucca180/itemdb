import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  Spinner,
} from '@chakra-ui/react';
import axios from 'axios';
import React from 'react';
import { ItemData } from '../../types';
import { useAuth } from '../../utils/auth';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item: ItemData;
};

const ConfirmDeleteItem = (props: Props) => {
  const { isOpen, onClose, item } = props;
  const cancelRef = React.useRef(null);
  const { getIdToken } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState('');

  const onConfirm = async () => {
    setLoading(true);
    const token = await getIdToken();

    if (!token) return setMsg('No token found');
    try {
      const res = await axios.delete(`/api/v1/items/${item.internal_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 200) {
        setMsg('Item deleted successfully. You can close this page now');
        setLoading(false);
      }
    } catch (err) {
      setMsg('Something went wrong. Please try again later');
      setLoading(false);
    }
  };

  if (msg)
    return (
      <AlertDialog isOpen leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete {item.name}?
            </AlertDialogHeader>
            <AlertDialogBody>{msg}</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Close
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    );

  if (loading)
    return (
      <AlertDialog
        isOpen
        leastDestructiveRef={cancelRef}
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onClose={() => {}}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete {item.name}?
            </AlertDialogHeader>
            <AlertDialogBody>
              <Spinner />
            </AlertDialogBody>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    );

  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Delete {item.name}?
          </AlertDialogHeader>

          <AlertDialogBody>
            Are you sure? You can&apos;t undo this action afterwards.
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={onConfirm} ml={3}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default ConfirmDeleteItem;
