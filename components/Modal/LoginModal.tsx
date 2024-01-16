import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  FormControl,
  Text,
  Input,
  ModalFooter,
  Button,
  Center,
  FormErrorMessage,
  Spinner,
} from '@chakra-ui/react';
import axios from 'axios';
import Image from 'next/image';
import { useState } from 'react';
import logoIcon from '../../public/logo_white.svg';
import { useTranslations } from 'next-intl';
// import { useRouter } from 'next/router';
// import { getAuth, sendSignInLinkToEmail } from 'firebase/auth';

const mailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// const isProd = process.env.NODE_ENV === 'production';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const LoginModal = (props: Props) => {
  const t = useTranslations();
  const { isOpen, onClose } = props;
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);
  // const auth = getAuth();
  // const router = useRouter();

  const doLogin = async () => {
    if (isSent) return onClose();

    if (!email.match(mailRegex)) {
      setError(t('Login.invalid-email-address'));
      return;
    }

    setIsLoading(true);

    try {
      // If you are building locally, comment out `await sendEmail(email);` and uncomment the code below and the respective imports

      // await sendSignInLinkToEmail(auth, email, {
      //   url:
      //     (isProd
      //       ? 'https://itemdb.com.br/login'
      //       : 'http://localhost:3000/login'),
      //   handleCodeInApp: true,
      // });

      await sendEmail(email);

      window.localStorage.setItem('emailForSignIn', email);
      setIsSent(true);
    } catch (e: any) {
      setError(e.message);
      console.error(error);
    }

    setIsLoading(false);
  };

  const sendEmail = async (email: string) => {
    const res = await axios.post('/api/auth/sendLink', {
      email,
    });

    return res.data;
  };

  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader></ModalHeader>
        <ModalCloseButton />
        <ModalBody>
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
            <FormControl isInvalid={!!error} mt={4}>
              <Input
                placeholder={t('General.email-address')}
                type="email"
                value={email}
                onChange={onEmailChange}
              />
              <FormErrorMessage>{error}</FormErrorMessage>
            </FormControl>
          )}
          {isSent && (
            <Text color="gray.200" mt={6} fontSize="sm" textAlign="center">
              {t('Login.email-sent')}
            </Text>
          )}
          {email.includes('yahoo') && (
            <Text color="gray.400" mt={2} fontSize="sm">
              {t('Temp.yahoo-mail-error')}
            </Text>
          )}
        </ModalBody>
        <ModalFooter>
          {!isSent && !isLoading && (
            <>
              <Button onClick={onClose} variant="ghost" mr={3}>
                {t('General.cancel')}
              </Button>
              <Button onClick={doLogin}>{t('General.continue')}</Button>
            </>
          )}

          {isSent && !isLoading && <Button onClick={onClose}>Close</Button>}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default LoginModal;
