import {
  Button,
  Text,
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
import MainLink from '@components/Utils/MainLink';
import { useState } from 'react';
import { useAuth } from '@utils/auth';
import ListSelect from '@components/UserLists/ListSelect';
import OfficialListCriteria from '@components/UserLists/OfficialListCriteria';
import { OFFICIAL_APPLY_URL, OFFICIAL_CRITERIA_URL } from '@utils/list/officialListLinks';
import type { UserListLite } from '@types';
import { useTranslations } from 'next-intl';

export type ApplyListModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type Status = 'idle' | 'loading' | 'error' | 'success';

const LOGIN_URL = `/login?redirect=${encodeURIComponent(OFFICIAL_APPLY_URL)}`;

const ApplyListModal = (props: ApplyListModalProps) => {
  const t = useTranslations();
  const { user, authLoading } = useAuth();
  const { isOpen, onClose } = props;
  const [list, setList] = useState<UserListLite>();
  const [justification, setJustification] = useState<string>('');
  const [status, setStatus] = useState<Status>('idle');

  const isAlreadyOfficial = !!list?.official;
  const canSubmit = !!user && !!list && !isAlreadyOfficial && !!justification.trim();

  // reset the form so reopening starts clean
  const handleClose = () => {
    onClose();
    setList(undefined);
    setJustification('');
    setStatus('idle');
  };

  const handleSubmit = async () => {
    if (!canSubmit || !user || !list) return;

    setStatus('loading');

    const jsonObj = {
      list_id: list.internal_id,
      username: user.username,
      justification: justification.trim(),
    };

    try {
      await axios.post('/api/feedback/send', {
        user_id: user.id,
        subject_id: list.internal_id,
        type: 'officialApply',
        json: JSON.stringify(jsonObj),
      });

      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const isLoggedOut = !user && !authLoading;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) handleClose();
      }}
      placement="center"
      scrollBehavior="inside"
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
              {status === 'success' && (
                <Text fontSize="sm" textAlign="center" color="green.200">
                  {t.rich('Lists.official-apply-list-success', {
                    br: () => <br />,
                  })}
                </Text>
              )}
              {status !== 'success' && (
                <Stack gap={3}>
                  <Text fontSize="sm">{t('Lists.official-apply-intro')}</Text>
                  <OfficialListCriteria size="sm" />
                  <Link asChild fontSize="sm" color="green.200" alignSelf="flex-start">
                    <MainLink
                      href={OFFICIAL_CRITERIA_URL}
                      target="_blank"
                      trackEvent="official-criteria-cta"
                      trackEventLabel="apply-modal"
                    >
                      {t('Lists.official-see-criteria')}
                    </MainLink>
                  </Link>
                  <Separator />
                  {isLoggedOut && (
                    <Text fontSize="sm" textAlign="center" color="whiteAlpha.800">
                      {t('Lists.official-login-required')}
                    </Text>
                  )}
                  {!isLoggedOut && (
                    <>
                      <Field.Root invalid={isAlreadyOfficial}>
                        <Field.Label color="gray.300">{t('Lists.select-your-list')}</Field.Label>
                        <ListSelect onChange={setList} />
                        <Field.ErrorText>{t('Lists.official-already-official')}</Field.ErrorText>
                      </Field.Root>
                      <Field.Root>
                        <Field.Label color="gray.300">
                          {t('Lists.official-what-your-list-is-about')}
                        </Field.Label>
                        <Textarea
                          variant="subtle"
                          value={justification}
                          disabled={status === 'loading'}
                          onChange={(e) => setJustification(e.target.value)}
                        />
                        <Field.HelperText>{t('Lists.official-apply-helper-text')}</Field.HelperText>
                      </Field.Root>
                      <Text fontSize="sm" textAlign="center" color="whiteAlpha.800">
                        {t.rich('Lists.official-agree-terms', {
                          Link: (chunk) => (
                            <Link asChild color="green.200">
                              <MainLink href="/terms" target="_blank">
                                {chunk}
                              </MainLink>
                            </Link>
                          ),
                        })}
                      </Text>
                    </>
                  )}
                  {status === 'error' && (
                    <Text fontSize="sm" textAlign="center" color="red.300">
                      {t('General.something-went-wrong-please-try-again-later')}
                    </Text>
                  )}
                </Stack>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              {status === 'success' && (
                <Button variant="ghost" onClick={handleClose}>
                  {t('General.close')}
                </Button>
              )}
              {status !== 'success' && (
                <>
                  <Button
                    variant="ghost"
                    mr={3}
                    onClick={handleClose}
                    disabled={status === 'loading'}
                  >
                    {t('General.cancel')}
                  </Button>
                  {isLoggedOut && (
                    <Button asChild>
                      <MainLink href={LOGIN_URL}>{t('Layout.login')}</MainLink>
                    </Button>
                  )}
                  {!isLoggedOut && (
                    <Button
                      onClick={handleSubmit}
                      loading={status === 'loading'}
                      disabled={!canSubmit}
                      data-umami-event="official-apply-submit"
                    >
                      {t('General.submit')}
                    </Button>
                  )}
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
