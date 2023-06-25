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

const ApplyListModal = (props: Props) => {
  const { user } = useAuth();
  const { isOpen, onClose } = props;
  const [list_id, setListId] = useState<number>();
  const [justification, setJustification] = useState<string>('');
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const handleClose = () => {
    onClose();
    setError(false);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!list_id || !justification || !user) return;

    setLoading(true);

    const jsonObj = {
      list_id: list_id,
      username: user.username,
      justification: justification,
    };

    try {
      const res = await axios.post('/api/feedback/send', {
        user_id: user.id,
        subject_id: list_id,
        type: 'officialApply',
        json: JSON.stringify(jsonObj),
      });

      if (res.status === 200) {
        setSuccess(true);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError(true);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textTransform="capitalize">Apply your list</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isLoading && (
            <Center>
              <Spinner />
            </Center>
          )}
          {error && (
            <Text fontSize="sm" textAlign="center" color="red.500">
              Something went wrong, please try again later
            </Text>
          )}
          {success && (
            <Text fontSize="sm" textAlign="center" color="green.200">
              Your list has been submitted. <br />
              <br />
              We will review it and if it&apos;s approved, it will receive the official badge and
              will be available for everyone to use \o/
            </Text>
          )}
          {!isLoading && !error && !success && (
            <>
              <Text fontSize="sm" textAlign="center">
                You think your list is cool and useful for the community? <br />
                <br />
                You can apply it to be an official list filling the form below. <br />
                <br />
                If your list is approved, it will be available for everyone to use and you will be
                listed as list curator!
                <br />
              </Text>
              <Divider my={3} />
              <Stack gap={3}>
                <FormControl>
                  <FormLabel color="gray.300">Select your list</FormLabel>
                  <ListSelect onChange={(list) => setListId(list.internal_id)} />
                </FormControl>
                <FormControl>
                  <FormLabel color="gray.300">What your list is about?</FormLabel>
                  <Textarea
                    variant="filled"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                  />
                  <FormHelperText>
                    A short summary of what your list is about and why the list is useful
                  </FormHelperText>
                </FormControl>
                <Text fontSize="sm" textAlign="center" color="whiteAlpha.800">
                  By applying your list, you agree to the{' '}
                  <Link href="/terms" color="green.200" isExternal>
                    Terms of Service
                  </Link>
                </Text>
              </Stack>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          {!isLoading && !error && !success && (
            <>
              <Button variant="ghost" mr={3} onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Submit</Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ApplyListModal;
