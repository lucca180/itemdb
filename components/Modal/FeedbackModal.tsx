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
  Icon,
} from '@chakra-ui/react';
import axios from 'axios';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ItemData } from '../../types';
import { useAuth } from '../../utils/auth';
import { useTranslations } from 'next-intl';
import { FiSend } from 'react-icons/fi';

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
  const router = useRouter();
  const { isOpen, onClose, item } = props;
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [feedbackInfo, setFeedbackInfo] = useState<FeedbackFormData>({});

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
          scriptInfo: {
            restock: window.itemdb_restock?.version ?? null,
            itemData: window.itemdb_script?.version ?? null,
          },
          userAgent: navigator.userAgent,
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
    <Modal isOpen={isOpen} onClose={handleCancel} isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('Feedback.contact-us')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!isLoading && !isSuccess && !error && (
            <Stack gap={5}>
              <FormControl>
                <FormLabel color="gray.300">
                  {t('General.email-address')} ({t('General.optional')})
                </FormLabel>
                <Input
                  size="sm"
                  variant="filled"
                  name="email"
                  onChange={handleChange}
                  value={feedbackInfo.email ?? ''}
                />
                <FormHelperText fontSize={'xs'}>{t('Feedback.modalHelper')}</FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">
                  {t('General.subject')} ({t('General.optional')})
                </FormLabel>
                <Input
                  size="sm"
                  variant="filled"
                  name="subject"
                  onChange={handleChange}
                  value={feedbackInfo.subject ?? ''}
                />
                <FormHelperText fontSize={'xs'}>{t('Feedback.subject-help-text')}</FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">{t('Feedback.modalLabel')}</FormLabel>
                <Textarea
                  variant="filled"
                  name="message"
                  onChange={handleChange}
                  value={feedbackInfo.message ?? ''}
                />
                <FormHelperText fontSize={'xs'}>{t('Feedback.bug-helper-text')}</FormHelperText>
              </FormControl>
              <Text fontSize="sm" color="gray.400" textAlign={'center'}>
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
              <Button
                onClick={saveChanges}
                disabled={!feedbackInfo.message || feedbackInfo.message.trim() === ''}
              >
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
