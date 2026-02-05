import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  Spinner,
  Text,
  Input,
  useToast,
} from '@chakra-ui/react';
import React from 'react';
import { useTranslations } from 'next-intl';
import axios from 'axios';
import { useAuth } from '@utils/auth';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const DeleteUserModal = (props: Props) => {
  const t = useTranslations();
  const toast = useToast();
  const { isOpen, onClose } = props;
  const cancelRef = React.useRef(null);
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { resetUser } = useAuth();

  const onConfirm = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/delete', {
        confirmMail: email,
      });

      if (res.status === 200) {
        await resetUser();
        window.location.reload();
      }
    } catch (e) {
      setLoading(false);
      toast({
        title: t('General.an-error-has-occurred'),
        description: 'Please contact itemdb team via feedback page if the issue persists.',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    }
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef as any}
      onClose={onClose}
      isCentered
      size="xl"
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Delete Account - Are you sure?
          </AlertDialogHeader>

          <AlertDialogBody>
            <Text>
              All your account data - including lists, restock sessions etc. - will be permanently
              deleted. This <b>CANNOT</b> be undone.
            </Text>

            <Input
              mt={3}
              variant={'filled'}
              placeholder="Type your account email to confirm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose} isDisabled={loading}>
              {t('General.cancel')}
            </Button>
            <Button
              colorScheme="red"
              onClick={onConfirm}
              ml={3}
              isDisabled={!email}
              isLoading={loading}
            >
              {t('General.delete')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default DeleteUserModal;
