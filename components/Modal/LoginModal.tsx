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
  Flex,
  HStack,
  Stack,
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { BsCheckCircleFill } from 'react-icons/bs';
import { useTranslations } from 'next-intl';
import { trackEventWhenReady } from '@utils/umami';
import type { LoginSource } from '@utils/loginModal';
import { getLoginVariant } from '@components/Modal/loginModalVariants';

export type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Where the modal was opened from: picks the contextual copy and tags the Umami funnel. */
  source: LoginSource;
  /** Page the user returns to after logging in (pathname only), when known. */
  redirectPath?: string;
  /** The UI element that asked for login, for the Umami funnel. */
  trigger?: string;
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
  const { isOpen, onClose, source, redirectPath, trigger } = props;
  const [cred, setCred] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);
  const [sentMode, setSentMode] = useState<'email' | 'username'>('email');
  const [needsConfirmation, setNeedsConfirmation] = useState<boolean>(false);

  const variant = getLoginVariant(source);
  const hasCred = cred.trim().length > 0;

  const title = isSent
    ? t('Login.title-link-sent')
    : needsConfirmation
      ? t('Login.title-create-account')
      : t(`Login.variant-${variant.id}-title`);

  // login funnel: open → (new-account prompt) → link sent; never send the typed credential
  const funnelData: Record<string, string> = { source };
  if (redirectPath) funnelData.redirect = redirectPath;
  if (trigger) funnelData.trigger = trigger;

  // once per opening (effects run twice under StrictMode)
  const trackedOpen = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      trackedOpen.current = false;
      return;
    }

    if (trackedOpen.current) return;
    trackedOpen.current = true;
    trackEventWhenReady('login-open', funnelData);
  }, [isOpen]);

  const doLogin = async (confirmNewAccount = false) => {
    if (isSent) return onClose();

    setIsLoading(true);
    setError('');

    try {
      const data = await sendEmail(cred, confirmNewAccount);

      if (data.needsConfirmation) {
        trackEventWhenReady('login-new-account-prompt', funnelData);
        setNeedsConfirmation(true);
        setIsLoading(false);
        return;
      }

      if (cred.match(mailRegex)) window.localStorage.setItem('emailForSignIn', cred);

      trackEventWhenReady('login-link-sent', {
        ...funnelData,
        mode: data.mode === 'username' ? 'username' : 'email',
        newAccount: confirmNewAccount,
      });

      setSentMode(data.mode === 'username' ? 'username' : 'email');
      setNeedsConfirmation(false);
      setIsSent(true);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as SendLinkResponse | undefined;
        trackEventWhenReady('login-error', {
          ...funnelData,
          code: data?.code ?? String(e.response?.status ?? 'network'),
        });

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
              {!isSent && !needsConfirmation && <LoginVariantContent variant={variant} />}

              <Center flexFlow="column" gap={4}>
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
                      if (e.key === 'Enter' && !isLoading && hasCred) void doLogin(false);
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
                  <Button
                    loading={isLoading}
                    disabled={!hasCred}
                    onClick={() => void doLogin(false)}
                  >
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

/** Contextual description + perks for the sign-in step (copy: loginModalVariants.ts). */
function LoginVariantContent(props: { variant: ReturnType<typeof getLoginVariant> }) {
  const t = useTranslations();
  const { variant } = props;

  return (
    <>
      <Text color="gray.200" fontSize="sm">
        {t(`Login.variant-${variant.id}-description`)}
      </Text>
      <Stack gap={3} mt={4}>
        {variant.perks.map((perk) => (
          <HStack key={perk.id} gap={3} alignItems="flex-start">
            <Flex
              bg="teal.900"
              color="teal.200"
              borderRadius="md"
              boxSize={8}
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Icon as={perk.icon} boxSize={4} />
            </Flex>
            <Box>
              <Text fontSize="sm" fontWeight="medium">
                {t(`Login.perk-${perk.id}-title`)}
              </Text>
              <Text fontSize="xs" color="gray.400">
                {t(`Login.perk-${perk.id}-description`)}
              </Text>
            </Box>
          </HStack>
        ))}
      </Stack>
    </>
  );
}

export default LoginModal;
