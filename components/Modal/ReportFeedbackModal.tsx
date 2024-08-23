import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Text,
  Flex,
  Textarea,
  FormControl,
  FormLabel,
  Center,
  Spinner,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import axios from 'axios';
import { useAuth } from '../../utils/auth';
import { Feedback } from '../../types';
import { useState } from 'react';
import { useRouter } from 'next/router';

export type ReportFeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
  feedback: Feedback;
};

export default function ReportFeedbackModal(props: ReportFeedbackModalProps) {
  const t = useTranslations();
  const router = useRouter();

  const { isOpen, onClose, feedback } = props;
  const [isLoading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [reason, setReason] = useState('');
  const { user } = useAuth();

  const saveChnages = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/feedback/send', {
        subject_id: feedback.subject_id,
        json: JSON.stringify({
          message: reason,
          reportAuthor: user.id,
          feedbackAuthor: feedback.user_id,
          feedbackId: feedback.feedback_id,
        }),
        type: 'reportFeedback',
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

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('Feedback.report-feedback')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody fontSize={'sm'} sx={{ b: { color: 'red.300' } }}>
            {!isLoading && !isSuccess && !error && (
              <>
                <Text textAlign={'center'}>
                  {t.rich('Feedback.report-text1', {
                    b: (children) => <b>{children}</b>,
                  })}
                </Text>
                <Flex
                  flexFlow="column"
                  justifyContent={'center'}
                  alignItems={'center'}
                  gap={2}
                  my={4}
                >
                  <FormControl>
                    <FormLabel color="gray.400" fontSize={'xs'}>
                      {t('Feedback.report-form-label')}
                    </FormLabel>
                    <Textarea
                      variant="filled"
                      name="description"
                      size="sm"
                      onChange={(e) => setReason(e.target.value)}
                      value={reason}
                    />
                  </FormControl>
                </Flex>
                <Text textAlign={'center'} fontSize="xs">
                  {t.rich('Feedback.report-text2', {
                    b: (children) => <b>{children}</b>,
                  })}
                </Text>
              </>
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
                  {t('Feedback.will-investigate')}
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
            <Flex gap={3}>
              <Button variant="ghost" colorScheme="red" onClick={onClose} size="sm">
                {t('General.close')}
              </Button>
              {!isLoading && !isSuccess && !error && (
                <Button
                  variant="ghost"
                  onClick={saveChnages}
                  size="sm"
                  isDisabled={reason.length < 20}
                >
                  {t('General.submit')}
                </Button>
              )}
            </Flex>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
