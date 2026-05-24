import { Button, Text, Input, Dialog, CloseButton, Portal } from '@chakra-ui/react';
import { useToast } from '@utils/theme/toast';
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
        id: 'delete-user-error',
        title: t('General.an-error-has-occurred'),
        description: 'Please contact itemdb team via feedback page if the issue persists.',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    }
  };

  return (
    <Dialog.Root
      role="alertdialog"
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open && !loading) onClose();
      }}
      placement="center"
      size="xl"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title fontSize="lg" fontWeight="bold">
                Delete Account - Are you sure?
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" disabled={loading} />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              <Text>
                All your account data - including lists, restock sessions etc. - will be permanently
                deleted. This <b>CANNOT</b> be undone.
              </Text>

              <Input
                mt={3}
                variant={'subtle'}
                placeholder="Type your account email to confirm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Dialog.Body>
            <Dialog.Footer>
              <Button onClick={onClose} disabled={loading}>
                {t('General.cancel')}
              </Button>
              <Button
                colorPalette="red"
                onClick={onConfirm}
                ml={3}
                disabled={!email}
                loading={loading}
              >
                {t('General.delete')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default DeleteUserModal;
