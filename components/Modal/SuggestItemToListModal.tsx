import {
  Button,
  CloseButton,
  Dialog,
  Field,
  Flex,
  IconButton,
  Image,
  Portal,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { LuX } from 'react-icons/lu';
import OfficialListSelect from '@components/Input/OfficialListSelect';
import type { ItemData, UserList } from '@types';
import { useAuth } from '@utils/auth';
import { suggestMissingListItems } from '@app/[locale]/lists/[username]/[list_id]/actions';
import {
  MAX_SUGGESTION_NOTE_LENGTH,
  type ListSuggestionSource,
} from '@utils/list/listSuggestionsConstants';

/**
 * "Suggest this item to an official list" modal (item page). The item is fixed and the user picks
 * the official list it belongs to, plus an optional note. Submits through the same
 * `suggestMissingListItems` server action as the list page modal (SuggestListItemModal).
 */
export type SuggestItemToListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: ItemData;
  /** Lists that already hold `item`, left out of the picker. */
  excludeListIds?: number[];
  /** Where the modal was opened from (item page card or "add to list" menu). */
  source: ListSuggestionSource;
};

/** idle = form visible; success/error = result of the last submission. */
type Status = { type: 'idle' } | { type: 'success' } | { type: 'error'; message: string };

export default function SuggestItemToListModal(props: SuggestItemToListModalProps) {
  const t = useTranslations();
  const { isOpen, onClose, item, excludeListIds, source } = props;
  const { user, authLoading, openLogin } = useAuth();
  const [pickedList, setPickedList] = useState<UserList | null>(null);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<Status>({ type: 'idle' });
  const [isPending, startTransition] = useTransition();

  // reset the form so reopening starts clean
  const handleClose = () => {
    onClose();
    setPickedList(null);
    setNote('');
    setStatus({ type: 'idle' });
  };

  /** Maps server error codes (ListSuggestionErrorCode) to translated messages. */
  const getErrorMessage = (error: string) => {
    if (error === 'already-in-list') return t('Lists.suggest-missing-error-already-in-list');
    if (error === 'already-suggested') return t('Lists.suggest-missing-error-already-suggested');
    if (error === 'note-too-long')
      return t('Lists.suggest-missing-error-note-too-long', { max: MAX_SUGGESTION_NOTE_LENGTH });

    return t('General.something-went-wrong-please-try-again-later');
  };

  const handleSubmit = () => {
    if (!pickedList) return;

    const listSlug = pickedList.slug ?? String(pickedList.internal_id);
    window.umami?.track('suggest-missing-submit', { list: listSlug, count: 1, source });

    startTransition(async () => {
      const res = await suggestMissingListItems(
        pickedList.internal_id,
        [item.internal_id],
        note,
        source
      );

      if (!res.success) {
        window.umami?.track('suggest-missing-error', {
          list: listSlug,
          code: res.error,
          source,
        });
        setStatus({ type: 'error', message: getErrorMessage(res.error) });
        return;
      }

      window.umami?.track('suggest-missing-success', {
        list: listSlug,
        count: 1,
        skipped: res.skipped.length,
        source,
      });

      setStatus({ type: 'success' });
    });
  };

  const isLoggedOut = !user && !authLoading;

  // stay on the item page and use the login modal instead of a redirect (`trigger` = card or menu)
  const handleLogin = () => {
    handleClose();
    openLogin('suggest-official-list', { trigger: source });
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
              <Dialog.Title>{t('Lists.suggest-to-list-title')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              {status.type === 'success' && (
                <Text fontSize="sm" textAlign="center" color="green.200">
                  {t('Lists.suggest-missing-success')}
                </Text>
              )}
              {status.type !== 'success' && (
                <Stack gap={4}>
                  <Text fontSize="sm">
                    {t.rich('Lists.suggest-to-list-description', {
                      item: item.name,
                      b: (chunk) => <b>{chunk}</b>,
                    })}
                  </Text>
                  {isLoggedOut && (
                    <Text fontSize="sm" textAlign="center" color="whiteAlpha.800">
                      {t('Lists.suggest-missing-login-required')}
                    </Text>
                  )}
                  {!isLoggedOut && (
                    <>
                      <Field.Root>
                        <Field.Label color="gray.300">
                          {t('Lists.suggest-to-list-select')}
                        </Field.Label>
                        {pickedList ? (
                          <Flex
                            alignItems="center"
                            gap={2}
                            bg="blackAlpha.300"
                            p={2}
                            borderRadius="md"
                            w="100%"
                          >
                            <Text fontSize="sm" flex={1}>
                              {pickedList.name}
                            </Text>
                            <IconButton
                              aria-label={t('General.delete')}
                              size="xs"
                              variant="ghost"
                              disabled={isPending}
                              onClick={() => setPickedList(null)}
                            >
                              <LuX />
                            </IconButton>
                          </Flex>
                        ) : (
                          <OfficialListSelect
                            isDisabled={isPending}
                            placeholder={t('Lists.suggest-to-list-placeholder')}
                            onChange={setPickedList}
                            excludeListIds={excludeListIds}
                            excludeDynamic
                          />
                        )}
                      </Field.Root>
                      <Flex alignItems="center" gap={2} bg="blackAlpha.300" p={1} borderRadius="md">
                        <Image src={item.image} alt={item.name} boxSize="32px" />
                        <Text fontSize="sm" flex={1}>
                          {item.name}
                        </Text>
                      </Flex>
                      <Field.Root>
                        <Field.Label color="gray.300">
                          {t('Lists.suggest-missing-note')}{' '}
                          <Text as="span" fontSize="xs" color="gray.400">
                            ({t('General.optional')})
                          </Text>
                        </Field.Label>
                        <Textarea
                          variant="subtle"
                          value={note}
                          maxLength={MAX_SUGGESTION_NOTE_LENGTH}
                          placeholder={t('Lists.suggest-to-list-note-placeholder')}
                          disabled={isPending}
                          onChange={(e) => setNote(e.target.value)}
                        />
                      </Field.Root>
                      {status.type === 'error' && (
                        <Text fontSize="sm" textAlign="center" color="red.300">
                          {status.message}
                        </Text>
                      )}
                    </>
                  )}
                </Stack>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              {status.type === 'success' && (
                <Button variant="ghost" onClick={handleClose}>
                  {t('General.close')}
                </Button>
              )}
              {status.type !== 'success' && (
                <>
                  <Button variant="ghost" mr={3} onClick={handleClose} disabled={isPending}>
                    {t('General.cancel')}
                  </Button>
                  {isLoggedOut && (
                    <Button
                      onClick={handleLogin}
                      data-umami-event="suggest-missing-login"
                      data-umami-event-source={source}
                    >
                      {t('Layout.login')}
                    </Button>
                  )}
                  {!isLoggedOut && (
                    <Button
                      onClick={handleSubmit}
                      loading={isPending || authLoading}
                      disabled={!pickedList}
                    >
                      {t('General.send')}
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
}
