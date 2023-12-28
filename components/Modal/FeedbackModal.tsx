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
  Link,
} from '@chakra-ui/react';
import axios from 'axios';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { ItemData } from '../../types';
import { useAuth } from '../../utils/auth';
import { useTranslations } from 'next-intl';

export type FeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item?: ItemData;
};

const FeedbackModal = (props: FeedbackModalProps) => {
  const t = useTranslations();
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
                <FormLabel color="gray.300">
                  {t('General.email-address')} ({t('General.optional')})
                </FormLabel>
                <Input variant="filled" onChange={(e) => setEmail(e.target.value)} value={email} />
                <FormHelperText>{t('Feedback.modalHelper')}</FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">{t('Feedback.modalLabel')} :)</FormLabel>
                <Textarea
                  variant="filled"
                  onChange={(e) => setMessage(e.target.value)}
                  value={message}
                />
              </FormControl>
              <Text fontSize="sm" color="gray.400">
                {t.rich('Feedback.modalContributeCallback', {
                  Link: (chunks) => (
                    <Link as={NextLink} href="/contribute" color="gray.200">
                      {chunks}
                    </Link>
                  ),
                })}
              </Text>
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
                {t('Feedback.done')}
                <br />
                {t('Feedback.thanks')} :)
              </Text>
            </Center>
          )}
          {error && (
            <Center>
              <Text fontSize="sm" textAlign="center" color="red.400">
                {t('General.an-error-has-occurred')}!
                <br />
                {t('General.refreshPage')}
              </Text>
            </Center>
          )}
        </ModalBody>
        <ModalFooter>
          {!isLoading && !isSuccess && !error && (
            <>
              <Button variant="ghost" onClick={handleCancel} mr={3}>
                {t('General.cancel')}
              </Button>
              <Button onClick={saveChanges} disabled={!message}>
                {t('General.send')}
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default FeedbackModal;
