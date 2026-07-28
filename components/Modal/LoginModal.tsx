import {
  Text,
  Input,
  Button,
  Center,
  Field,
  Dialog,
  CloseButton,
  Portal,
  Icon,
  Alert,
  Box,
} from '@chakra-ui/react';
import axios from 'axios';
import Image from 'next/image';
import { useState } from 'react';
import { BsCheckCircleFill } from 'react-icons/bs';
import logoIcon from '../../public/logo_white.svg';
import { useTranslations } from 'next-intl';

export type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type SendLinkResponse = {
  success: boolean;
  mode?: 'email' | 'username';
  accountExists?: boolean;
  needsConfirmation?: boolean;
  remaining?: number;
  retryAfterSeconds?: number;
  code?: string;
  message?: string;
};

const mailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginModal = (props: LoginModalProps) => {
  const t = useTranslations();
  const { isOpen, onClose } = props;
  const [cred, setCred] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);
  const [sentMode, setSentMode] = useState<'email' | 'username'>('email');
  const [needsConfirmation, setNeedsConfirmation] = useState<boolean>(false);

  const title = isSent
    ? t('Login.title-link-sent')
    : needsConfirmation
      ? t('Login.title-create-account')
      : t('Login.title-sign-in');

  const doLogin = async (confirmNewAccount = false) => {
    if (isSent) return onClose();

    setIsLoading(true);
    setError('');

    try {
      const data = await sendEmail(cred, confirmNewAccount);

      if (data.needsConfirmation) {
        setNeedsConfirmation(true);
        setIsLoading(false);
        return;
      }

      if (cred.match(mailRegex)) window.localStorage.setItem('emailForSignIn', cred);

      setSentMode(data.mode === 'username' ? 'username' : 'email');
      setNeedsConfirmation(false);
      setIsSent(true);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as SendLinkResponse | undefined;
        if (e.response?.status === 429 || data?.code === 'rate-limited') {
          setError(t('Login.rate-limited'));
        } else {
          setError(data?.message || e.message);
        }
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(t('General.an-error-occured-please-try-again-later'));
      }
      console.error(e);
    }

    setIsLoading(false);
  };

  const sendEmail = async (emailOrUsername: string, confirmNewAccount: boolean) => {
    const res = await axios.post<SendLinkResponse>('/api/auth/sendLink', {
      cred: emailOrUsername,
      confirmNewAccount: confirmNewAccount || undefined,
    });

    return res.data;
  };

  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCred(e.target.value);
    setError('');
    setNeedsConfirmation(false);
  };

  const cancelConfirmation = () => {
    setNeedsConfirmation(false);
    setError('');
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
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              <Center flexFlow="column" gap={4}>
                {!isSent && <Image src={logoIcon} alt="itemdb logo" width={140} quality={100} />}

                {isSent && (
                  <>
                    <Icon as={BsCheckCircleFill} boxSize="48px" color="green.400" />
                    <Text color="gray.200" fontSize="sm" textAlign="center">
                      {sentMode === 'username'
                        ? t('Login.email-sent-username')
                        : t('Login.email-sent')}
                    </Text>
                  </>
                )}

                {!isSent && !needsConfirmation && (
                  <Text color="gray.200" fontSize="sm" textAlign="center">
                    {t('Login.login-modal-text')}
                  </Text>
                )}

                {!isSent && needsConfirmation && (
                  <Alert.Root status="warning" variant="subtle" borderRadius="md" size="sm">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>
                        <Box as="span" fontFamily="mono" wordBreak="break-all">
                          {cred.trim()}
                        </Box>
                      </Alert.Title>
                      <Alert.Description>{t('Login.new-account-confirm')}</Alert.Description>
                    </Alert.Content>
                  </Alert.Root>
                )}
              </Center>

              {!isSent && !needsConfirmation && (
                <Field.Root invalid={!!error} mt={4}>
                  <Input
                    placeholder={t('Login.email-address-or-username')}
                    type="text"
                    value={cred}
                    onChange={onEmailChange}
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isLoading) void doLogin(false);
                    }}
                  />
                  <Field.ErrorText>{error}</Field.ErrorText>
                  <Field.HelperText>{t('Login.login-modal-new-account-hint')}</Field.HelperText>
                </Field.Root>
              )}

              {!isSent && needsConfirmation && !!error && (
                <Text color="red.300" mt={4} fontSize="sm" textAlign="center">
                  {error}
                </Text>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              {!isSent && !needsConfirmation && (
                <>
                  <Button onClick={onClose} variant="ghost" mr={3} disabled={isLoading}>
                    {t('General.cancel')}
                  </Button>
                  <Button loading={isLoading} onClick={() => void doLogin(false)}>
                    {t('Login.send-link')}
                  </Button>
                </>
              )}

              {!isSent && needsConfirmation && (
                <>
                  <Button onClick={cancelConfirmation} variant="ghost" mr={3} disabled={isLoading}>
                    {t('Login.go-back')}
                  </Button>
                  <Button
                    loading={isLoading}
                    colorPalette="orange"
                    variant="outline"
                    onClick={() => void doLogin(true)}
                  >
                    {t('Login.confirm-create-and-send')}
                  </Button>
                </>
              )}

              {isSent && <Button onClick={onClose}>{t('General.close')}</Button>}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default LoginModal;
