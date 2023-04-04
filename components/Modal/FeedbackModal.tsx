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
  Input,
  Stack,
  Textarea,
  Spinner,
  Center,
  FormHelperText,
} from '@chakra-ui/react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { ItemData } from '../../types';
import { useAuth } from '../../utils/auth';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item?: ItemData;
};

const FeedbackModal = (props: Props) => {
  const { user } = useAuth();
  const router = useRouter();
  const { isOpen, onClose, item } = props;
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [email, setEmail] = useState<string>(user?.email ?? '');
  const [message, setMessage] = useState<string>('');

  const saveChanges = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/feedback/send', {
        email: email,
        subject_id: item?.internal_id ?? undefined,
        json: JSON.stringify({
          message: message,
        }),
        type: 'feedback',
        pageInfo: router.asPath,
      });

      setLoading(false);

      if (res.data.success) setIsSuccess(true);
      else throw res.data;
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError(true);
    }
  };

  const handleCancel = () => {
    setMessage('');
    setError(false);
    setIsSuccess(false);
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Feedback</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!isLoading && !isSuccess && !error && (
            <Stack gap={3}>
              <FormControl>
                <FormLabel color="gray.300">Email Address (opcional)</FormLabel>
                <Input variant="filled" onChange={(e) => setEmail(e.target.value)} value={email} />
                <FormHelperText>
                  If you want to receive a response, please enter your email address
                </FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">Write your feedback, comments and ideas :)</FormLabel>
                <Textarea
                  variant="filled"
                  onChange={(e) => setMessage(e.target.value)}
                  value={message}
                />
              </FormControl>
            </Stack>
          )}

          {isLoading && (
            <Center>
              <Spinner />
            </Center>
          )}
          {isSuccess && (
            <Center>
              <Text fontSize="sm" textAlign="center">
                Done!
                <br />
                We appreciate your comments and feedback :)
              </Text>
            </Center>
          )}
          {error && (
            <Center>
              <Text fontSize="sm" textAlign="center" color="red.400">
                An error has occurred!
                <br />
                Please refresh the page and try again later
              </Text>
            </Center>
          )}
        </ModalBody>
        <ModalFooter>
          {!isLoading && !isSuccess && !error && (
            <>
              <Button variant="ghost" onClick={handleCancel} mr={3}>
                Cancel
              </Button>
              <Button onClick={saveChanges} disabled={!message}>
                Send
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default FeedbackModal;
