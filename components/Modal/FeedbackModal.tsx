'use client';

import {
  Button,
  Text,
  Input,
  Stack,
  Textarea,
  Spinner,
  Center,
  Field,
  Link,
  Icon,
  Dialog,
  CloseButton,
  Portal,
} from '@chakra-ui/react';
import axios from 'axios';
import MainLink from '@components/Utils/MainLink';
import { useEffect, useState } from 'react';
import { ItemData } from '../../types';
import { useAuth } from '../../utils/auth';
import { useTranslations } from 'next-intl';
import { FiSend } from 'react-icons/fi';
import { useScriptStatus } from '@utils/scriptUtils';

export type FeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item?: ItemData;
};

type FeedbackFormData = {
  subject?: string;
  email?: string;
  message?: string;
};

const FeedbackModal = (props: FeedbackModalProps) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { isOpen, onClose, item } = props;
  const [loading, setLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [feedbackInfo, setFeedbackInfo] = useState<FeedbackFormData>({});
  const { scriptStatus } = useScriptStatus();
  useEffect(() => {
    setFeedbackInfo((prev) => ({ ...prev, email: user?.email ?? '' }));
  }, [user]);

  const saveChanges = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/feedback/send', {
        email: feedbackInfo.email ?? undefined,
        subject_id: item?.internal_id ?? undefined,
        json: JSON.stringify({
          message: feedbackInfo.message ?? '',
          subject: feedbackInfo.subject ?? '',
          scriptInfo: scriptStatus
            ? Object.fromEntries(
                Object.entries(scriptStatus).map(([key, value]) => [key, value.version])
              )
            : {},
          userAgent: navigator.userAgent,
        }),
        type: 'feedback',
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

  const handleCancel = () => {
    setFeedbackInfo({});
    setError(false);
    setIsSuccess(false);
    setLoading(false);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedInfo = { ...feedbackInfo, [name]: value };
    setFeedbackInfo(updatedInfo);
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) handleCancel();
      }}
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('Feedback.contact-us')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              {!loading && !isSuccess && !error && (
                <Stack gap={5}>
                  <Field.Root>
                    <Field.Label color="gray.300">
                      {t('General.email-address')} ({t('General.optional')})
                    </Field.Label>
                    <Input
                      size="sm"
                      variant="subtle"
                      name="email"
                      onChange={handleChange}
                      value={feedbackInfo.email ?? ''}
                    />
                    <Field.HelperText fontSize={'xs'}>{t('Feedback.modalHelper')}</Field.HelperText>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label color="gray.300">
                      {t('General.subject')} ({t('General.optional')})
                    </Field.Label>
                    <Input
                      size="sm"
                      variant="subtle"
                      name="subject"
                      onChange={handleChange}
                      value={feedbackInfo.subject ?? ''}
                    />
                    <Field.HelperText fontSize={'xs'}>
                      {t('Feedback.subject-help-text')}
                    </Field.HelperText>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label color="gray.300">{t('Feedback.modalLabel')}</Field.Label>
                    <Textarea
                      variant="subtle"
                      name="message"
                      onChange={handleChange}
                      value={feedbackInfo.message ?? ''}
                    />
                    <Field.HelperText fontSize={'xs'}>
                      {t('Feedback.bug-helper-text')}
                    </Field.HelperText>
                  </Field.Root>
                  <Text fontSize="xs" color="gray.400" textAlign={'center'}>
                    {t.rich('Feedback.script-issues-tool-cta', {
                      Link: (chunks) => (
                        <Link asChild color="gray.200">
                          <MainLink href="/tools/troubleshooting">{chunks}</MainLink>
                        </Link>
                      ),
                    })}
                  </Text>
                </Stack>
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
            </Dialog.Body>
            <Dialog.Footer>
              {!loading && !isSuccess && !error && (
                <>
                  <Button variant="ghost" onClick={handleCancel} mr={3}>
                    {t('General.cancel')}
                  </Button>
                  <Button
                    onClick={saveChanges}
                    disabled={!feedbackInfo.message || feedbackInfo.message.trim() === ''}
                  >
                    {t('General.send')}
                  </Button>
                </>
              )}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default FeedbackModal;

type FeedbackButtonProps = {
  item?: ItemData;
} & React.ComponentProps<typeof Button>;

export const FeedbackButton = (props: FeedbackButtonProps) => {
  const t = useTranslations();
  const { item } = props;
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <>
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} item={item} />
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} {...props}>
        <Icon as={FiSend} mr={1} /> {t('Button.feedback')}
      </Button>
    </>
  );
};
