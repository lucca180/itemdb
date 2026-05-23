import {
  Text,
  Input,
  Button,
  Center,
  Spinner,
  Field,
  Dialog,
  CloseButton,
  Portal,
} from '@chakra-ui/react';
import axios from 'axios';
import Image from 'next/image';
import { useState } from 'react';
import logoIcon from '../../public/logo_white.svg';
import { useTranslations } from 'next-intl';

export type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const LoginModal = (props: LoginModalProps) => {
  const t = useTranslations();
  const { isOpen, onClose } = props;
  const [cred, setCred] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);

  const mailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const doLogin = async () => {
    if (isSent) return onClose();

    setIsLoading(true);

    try {
      await sendEmail(cred);

      if (cred.match(mailRegex)) window.localStorage.setItem('emailForSignIn', cred);

      setIsSent(true);
    } catch (e: any) {
      setError(e.message);
      console.error(error);
    }

    setIsLoading(false);
  };

  const sendEmail = async (emailOrUsername: string) => {
    const res = await axios.post('/api/auth/sendLink', {
      cred: emailOrUsername,
    });

    return res.data;
  };

  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCred(e.target.value);
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
              <Dialog.Title />
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              <Center flexFlow="column">
                <Image src={logoIcon} alt="itemdb logo" width={225} quality={100} />
                {!isSent && (
                  <Text color="gray.200" mt={4} fontSize="sm">
                    {t.rich('Login.login-modal-text', {
                      b: (children) => <b>{children}</b>,
                    })}
                  </Text>
                )}
              </Center>
              {isLoading && (
                <Center>
                  <Spinner mt={4} size="lg" />
                </Center>
              )}
              {!isLoading && !isSent && (
                <Field.Root invalid={!!error} mt={4}>
                  <Input
                    placeholder={t('Login.email-address-or-username')}
                    type="text"
                    value={cred}
                    onChange={onEmailChange}
                  />
                  <Field.ErrorText>{error}</Field.ErrorText>
                </Field.Root>
              )}
              {isSent && (
                <Text color="gray.200" mt={6} fontSize="sm" textAlign="center">
                  {t('Login.email-sent')}
                </Text>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              {!isSent && !isLoading && (
                <>
                  <Button onClick={onClose} variant="ghost" mr={3}>
                    {t('General.cancel')}
                  </Button>
                  <Button onClick={doLogin}>{t('General.continue')}</Button>
                </>
              )}

              {isSent && !isLoading && <Button onClick={onClose}>{t('General.close')}</Button>}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default LoginModal;
