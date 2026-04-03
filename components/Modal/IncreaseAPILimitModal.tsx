import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
  Textarea,
  Text,
  Flex,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export type IncreaseAPIModalProps = {
  isOpen: boolean;
  key_id: number;
  onClose: () => void;
};

export default function IncreaseAPIModal(props: IncreaseAPIModalProps) {
  const { isOpen, onClose, key_id } = props;
  const t = useTranslations();
  const toast = useToast();

  const [newLimit, setNewLimit] = useState(0);
  const [justification, setJustification] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await axios.post('/api/auth/apikeys', { key_id, newLimit, justification });
      toast({
        title: 'API Limit Increase Requested',
        description:
          'Your request has been submitted. We will get back to you as soon as possible.',
        status: 'success',
      });
      onClose();
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error requesting API limit increase',
        description: t('General.try-again-later'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Request API Limit Increase</ModalHeader>
          <ModalCloseButton />
          <ModalBody fontSize={'sm'}>
            <Text color="whiteAlpha.800">
              If your application is already tested you can request an API Limit increase.
              <br />
              <br />
              We review all requests manually and will get back to you as soon as possible.
            </Text>
            <Flex bg="blackAlpha.400" flexFlow={'column'} p={4} mt={4} borderRadius="md" gap={3}>
              <FormControl>
                <FormLabel color="gray.300">New Limit</FormLabel>
                <Input
                  variant="filled"
                  type="number"
                  name="new_limit"
                  size="sm"
                  value={newLimit}
                  isDisabled={isLoading}
                  isInvalid={newLimit < 0}
                  onChange={(e) => setNewLimit(Number(e.target.value))}
                />
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">Justification</FormLabel>
                <Textarea
                  variant="filled"
                  name="justification"
                  size="sm"
                  value={justification}
                  isDisabled={isLoading}
                  onChange={(e) => setJustification(e.target.value)}
                />
                <FormHelperText>
                  Please explain why you need the increase and how you are using the API.
                </FormHelperText>
              </FormControl>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="ghost" onClick={onClose} isDisabled={isLoading}>
              {t('General.close')}
            </Button>
            <Button
              ml={3}
              size="sm"
              colorScheme="blue"
              onClick={handleSubmit}
              isDisabled={!justification || newLimit <= 0}
              isLoading={isLoading}
            >
              Submit Request
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
