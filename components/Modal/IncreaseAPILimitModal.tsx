import {
  Button,
  Input,
  Field,
  Textarea,
  Text,
  Flex,
  List,
  Dialog,
  CloseButton,
  Portal,
} from '@chakra-ui/react';
import { useToast } from '@utils/theme/toast';
import axios from 'axios';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export type IncreaseAPIModalProps = {
  isOpen: boolean;
  key_id: number;
  onClose: () => void;
};

export default function IncreaseAPIModal(props: IncreaseAPIModalProps) {
  const { isOpen, onClose, key_id } = props;
  const t = useTranslations();
  const toast = useToast();

  const [newLimit, setNewLimit] = useState(0);
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    window.umami?.track('api-keys-limit-request', { label: 'submit' });
    setLoading(true);
    try {
      await axios.post('/api/auth/apikeys', { key_id, newLimit, justification });
      window.umami?.track('api-keys-limit-request', { label: 'submit-success', newLimit });
      toast({
        id: 'api-limit-increase-success',
        title: 'API Limit Increase Requested',
        description:
          'Your request has been submitted. We will get back to you as soon as possible.',
        status: 'success',
      });
      onClose();
    } catch (e) {
      console.error(e);
      window.umami?.track('api-keys-limit-request', { label: 'submit-error', newLimit });
      toast({
        id: 'api-limit-increase-error',
        title: 'Error requesting API limit increase',
        description: t('General.try-again-later'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (open) return;
        window.umami?.track('api-keys-limit-request', { label: 'dismiss' });
        onClose();
      }}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Request API Limit Increase</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body fontSize={'sm'}>
              <Flex flexFlow={'column'} gap={3} color="whiteAlpha.800">
                <Text>
                  Higher limits are granted to projects that are <b>public</b> and{' '}
                  <b>benefit the whole community</b>, such as open-source tools, public websites,
                  apps that other Neopets players can use, or data analyses and research whose
                  results are shared publicly.
                </Text>
                <Text>
                  The following will <b>not</b> receive a limit increase:
                </Text>
                <List.Root ps={5} gap={1}>
                  <List.Item>Private or closed personal projects</List.Item>
                  <List.Item>
                    Userscripts (they should not use an API Key in the first place, as it would be
                    exposed to anyone using the script)
                  </List.Item>
                </List.Root>
                <Text>
                  We review all requests manually and will get back to you as soon as possible.
                </Text>
              </Flex>
              <Flex bg="blackAlpha.400" flexFlow={'column'} p={4} mt={4} borderRadius="md" gap={3}>
                <Field.Root invalid={newLimit < 0}>
                  <Field.Label color="gray.300">New Limit</Field.Label>
                  <Input
                    variant="subtle"
                    type="number"
                    name="new_limit"
                    size="sm"
                    value={newLimit}
                    disabled={loading}
                    onChange={(e) => setNewLimit(Number(e.target.value))}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label color="gray.300">Justification</Field.Label>
                  <Textarea
                    variant="subtle"
                    name="justification"
                    size="sm"
                    value={justification}
                    disabled={loading}
                    onChange={(e) => setJustification(e.target.value)}
                  />
                  <Field.HelperText>
                    Please explain why you need the increase, how you are using the API and link to
                    the public project (repository or website).
                  </Field.HelperText>
                </Field.Root>
              </Flex>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  window.umami?.track('api-keys-limit-request', { label: 'close' });
                  onClose();
                }}
                disabled={loading}
              >
                {t('General.close')}
              </Button>
              <Button
                ml={3}
                size="sm"
                colorPalette="blue"
                onClick={handleSubmit}
                disabled={!justification || newLimit <= 0}
                loading={loading}
              >
                Submit Request
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
