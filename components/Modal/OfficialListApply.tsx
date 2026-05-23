import {
  Button,
  Text,
  Spinner,
  Center,
  Stack,
  Separator,
  Field,
  Textarea,
  Link,
  Dialog,
  CloseButton,
  Portal,
} from '@chakra-ui/react';
import axios from 'axios';
import { useState } from 'react';
import { useAuth } from '../../utils/auth';
import ListSelect from '../UserLists/ListSelect';
import { useTranslations } from 'next-intl';

export type ApplyListModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ApplyListModal = (props: ApplyListModalProps) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { isOpen, onClose } = props;
  const [list_id, setListId] = useState<number>();
  const [justification, setJustification] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const handleClose = () => {
    onClose();
    setError(false);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!list_id || !justification || !user) return;

    setLoading(true);

    const jsonObj = {
      list_id: list_id,
      username: user.username,
      justification: justification,
    };

    try {
      const res = await axios.post('/api/feedback/send', {
        user_id: user.id,
        subject_id: list_id,
        type: 'officialApply',
        json: JSON.stringify(jsonObj),
      });

      if (res.status === 200) {
        setSuccess(true);
        setLoading(false);
      }
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
        if (!open) handleClose();
      }}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title textTransform="capitalize">{t('Lists.apply-your-list')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              {loading && (
                <Center>
                  <Spinner />
                </Center>
              )}
              {error && (
                <Text fontSize="sm" textAlign="center" color="red.500">
                  {t('General.something-went-wrong-please-try-again-later')}
                </Text>
              )}
              {success && (
                <Text fontSize="sm" textAlign="center" color="green.200">
                  {t.rich('Lists.official-apply-list-success', {
                    br: () => <br />,
                  })}
                </Text>
              )}
              {!loading && !error && !success && (
                <>
                  <Text fontSize="sm" textAlign="center">
                    {t.rich('Lists.official-apply-list-text', {
                      br: () => <br />,
                    })}
                  </Text>
                  <Separator my={3} />
                  <Stack gap={3}>
                    <Field.Root>
                      <Field.Label color="gray.300">{t('Lists.select-your-list')}</Field.Label>
                      <ListSelect onChange={(list) => setListId(list.internal_id)} />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label color="gray.300">
                        {t('Lists.official-what-your-list-is-about')}
                      </Field.Label>
                      <Textarea
                        variant="subtle"
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                      />
                      <Field.HelperText>{t('Lists.official-apply-helper-text')}</Field.HelperText>
                    </Field.Root>
                    <Text fontSize="sm" textAlign="center" color="whiteAlpha.800">
                      {t.rich('Lists.official-agree-terms', {
                        Link: (chunk) => (
                          <Link href="/terms" color="green.200" target="_blank" rel="noreferrer">
                            {chunk}
                          </Link>
                        ),
                      })}
                    </Text>
                  </Stack>
                </>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              {!loading && !error && !success && (
                <>
                  <Button variant="ghost" mr={3} onClick={handleClose}>
                    {t('General.cancel')}
                  </Button>
                  <Button onClick={handleSubmit}>{t('General.submit')}</Button>
                </>
              )}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default ApplyListModal;
