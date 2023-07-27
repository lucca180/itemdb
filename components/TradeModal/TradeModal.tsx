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
  Stack,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  Textarea,
  Link,
} from '@chakra-ui/react';
import axios from 'axios';
import { useState } from 'react';
import { useAuth } from '../../utils/auth';
import ListSelect from '../UserLists/ListSelect';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const TradeModal = (props: Props) => {
  const { isOpen, onClose } = props;
  const [isLoading, setLoading] = useState<boolean>(false);

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textTransform="capitalize">Restock History</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isLoading && (
            <Center>
              <Spinner />
            </Center>
          )}
          {!isLoading && <></>}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TradeModal;
