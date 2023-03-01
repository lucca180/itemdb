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
import { getAuth, sendSignInLinkToEmail } from 'firebase/auth';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState } from 'react';
import logoIcon from '../../public/logo_white.svg';

const mailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isProd = process.env.NODE_ENV === 'production';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const LoginModal = (props: Props) => {
  const { isOpen, onClose } = props;
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);
  const auth = getAuth();
  const router = useRouter();

  const doLogin = async () => {
    if (isSent) return onClose();

    if (!email.match(mailRegex)) {
      setError('Invalid email address');
      return;
    }

    setIsLoading(true);

    try {
      await sendSignInLinkToEmail(auth, email, {
        url:
          (isProd
            ? 'https://itemdb.com.br/login?redirect='
            : 'http://localhost:3000/login?redirect=') +
          encodeURIComponent(router.pathname),
        handleCodeInApp: true,
      });

      window.localStorage.setItem('emailForSignIn', email);
      setIsSent(true);
    } catch (e: any) {
      setError(e.message);
      console.error(error);
    }

    setIsLoading(false);
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
            {/* <Heading my={2} color="gray.200"  size='lg'>Welcome</Heading> */}
            {!isSent && (
              <Text color="gray.200" mt={4} fontSize="sm">
                Use your email to <b>sign in</b> or to{' '}
                <b>create a new account</b>
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
                placeholder="Email Address"
                type="email"
                value={email}
                onChange={onEmailChange}
              />
              <FormErrorMessage>{error}</FormErrorMessage>
            </FormControl>
          )}
          {isSent && (
            <Text color="gray.200" mt={6} fontSize="sm" textAlign="center">
              We&apos;ve sent you an email with a link to sign in. Please check
              your inbox.
            </Text>
          )}
        </ModalBody>
        <ModalFooter>
          {!isSent && (
            <>
              <Button onClick={onClose} variant="ghost" mr={3}>
                Cancel
              </Button>
              <Button onClick={doLogin}>Continue</Button>
            </>
          )}

          {isSent && <Button onClick={onClose}>Close</Button>}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default LoginModal;
