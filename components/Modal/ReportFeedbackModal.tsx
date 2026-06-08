import {
  Button,
  Text,
  Flex,
  Textarea,
  Field,
  Center,
  Spinner,
  Dialog,
  CloseButton,
  Portal,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import axios from 'axios';
import { useAuth } from '../../utils/auth';
import { Feedback } from '../../types';
import { useState } from 'react';
export type ReportFeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
  feedback: Feedback;
};

export default function ReportFeedbackModal(props: ReportFeedbackModalProps) {
  const t = useTranslations();

  const { isOpen, onClose, feedback } = props;
  const [loading, setLoading] = useState(false);
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
        pageInfo: `${window.location.pathname}${window.location.search}`,
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
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) onClose();
      }}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('Feedback.report-feedback')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body fontSize={'sm'} css={{ b: { color: 'red.300' } }}>
              {!loading && !isSuccess && !error && (
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
                    <Field.Root>
                      <Field.Label color="gray.400" fontSize={'xs'}>
                        {t('Feedback.report-form-label')}
                      </Field.Label>
                      <Textarea
                        variant="subtle"
                        name="description"
                        size="sm"
                        onChange={(e) => setReason(e.target.value)}
                        value={reason}
                      />
                    </Field.Root>
                  </Flex>
                  <Text textAlign={'center'} fontSize="xs">
                    {t.rich('Feedback.report-text2', {
                      b: (children) => <b>{children}</b>,
                    })}
                  </Text>
                </>
              )}
              {loading && (
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
            </Dialog.Body>
            <Dialog.Footer>
              <Flex gap={3}>
                <Button variant="ghost" colorPalette="red" onClick={onClose} size="sm">
                  {t('General.close')}
                </Button>
                {!loading && !isSuccess && !error && (
                  <Button
                    variant="ghost"
                    onClick={saveChnages}
                    size="sm"
                    disabled={reason.length < 20}
                  >
                    {t('General.submit')}
                  </Button>
                )}
              </Flex>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
