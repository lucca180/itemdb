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
import ItemSelect from '@components/Input/ItemSelect';
import type { ItemData, UserList } from '@types';
import { suggestMissingListItems } from '@app/[locale]/lists/[username]/[list_id]/actions';
import {
  MAX_SUGGESTION_ITEMS,
  MAX_SUGGESTION_NOTE_LENGTH,
} from '@utils/list/listSuggestionsConstants';

/**
 * "Suggest missing item" modal for official lists (opened from the list page toolbar).
 * The user picks up to MAX_SUGGESTION_ITEMS items + an optional note; submission goes
 * through the `suggestMissingListItems` server action.
 */
export type SuggestListItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  list: UserList;
};

/** idle = form visible; success/error = result of the last submission. */
type Status =
  | { type: 'idle' }
  | { type: 'success'; skipped: number }
  | { type: 'error'; message: string };

export default function SuggestListItemModal(props: SuggestListItemModalProps) {
  const t = useTranslations();
  const { isOpen, onClose, list } = props;
  const [items, setItems] = useState<ItemData[]>([]);
  const [note, setNote] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ type: 'idle' });
  const [isPending, startTransition] = useTransition();

  // reset the form so reopening starts clean
  const handleClose = () => {
    onClose();
    setItems([]);
    setNote('');
    setWarning(null);
    setStatus({ type: 'idle' });
  };

  /**
   * Adds an item picked in ItemSelect (warns when over the limit). Items already in the list
   * are checked server-side on submit.
   */
  const addItem = (item: ItemData) => {
    if (items.some((i) => i.internal_id === item.internal_id)) return;

    if (items.length >= MAX_SUGGESTION_ITEMS) {
      setWarning(t('Lists.suggest-missing-limit', { max: MAX_SUGGESTION_ITEMS }));
      return;
    }

    setWarning(null);
    setItems((prev) => [...prev, item]);
  };

  const removeItem = (internal_id: number) => {
    setItems((prev) => prev.filter((i) => i.internal_id !== internal_id));
  };

  /** Maps server error codes (ListSuggestionErrorCode) to translated messages. */
  const getErrorMessage = (error: string) => {
    if (error === 'already-in-list') return t('Lists.suggest-missing-error-already-in-list');
    if (error === 'already-suggested') return t('Lists.suggest-missing-error-already-suggested');
    if (error === 'note-too-long')
      return t('Lists.suggest-missing-error-note-too-long', { max: MAX_SUGGESTION_NOTE_LENGTH });
    if (error === 'too-many-items')
      return t('Lists.suggest-missing-limit', { max: MAX_SUGGESTION_ITEMS });

    return t('General.something-went-wrong-please-try-again-later');
  };

  const handleSubmit = () => {
    if (!items.length) return;

    startTransition(async () => {
      const res = await suggestMissingListItems(
        list.internal_id,
        items.map((i) => i.internal_id),
        note
      );

      if (!res.success) {
        setStatus({ type: 'error', message: getErrorMessage(res.error) });
        return;
      }

      // some items may have been skipped server-side (already in list / already suggested)
      setStatus({ type: 'success', skipped: res.skipped.length });
    });
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
              <Dialog.Title>{t('Lists.suggest-missing-title')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              {status.type === 'success' && (
                <Stack gap={2} textAlign="center">
                  <Text fontSize="sm" color="green.200">
                    {t('Lists.suggest-missing-success')}
                  </Text>
                  {status.skipped > 0 && (
                    <Text fontSize="xs" color="gray.400">
                      {t('Lists.suggest-missing-partial', { count: status.skipped })}
                    </Text>
                  )}
                </Stack>
              )}
              {status.type !== 'success' && (
                <Stack gap={4}>
                  <Text fontSize="sm">
                    {t.rich('Lists.suggest-missing-description', {
                      list: list.name,
                      b: (chunk) => <b>{chunk}</b>,
                    })}
                  </Text>
                  <Stack gap={2}>
                    <ItemSelect onChange={addItem} isDisabled={isPending} />
                    {warning && (
                      <Text fontSize="xs" color="orange.300">
                        {warning}
                      </Text>
                    )}
                    {items.map((item) => (
                      <Flex
                        key={item.internal_id}
                        alignItems="center"
                        gap={2}
                        bg="blackAlpha.300"
                        p={1}
                        borderRadius="md"
                      >
                        <Image src={item.image} alt={item.name} boxSize="32px" />
                        <Text fontSize="sm" flex={1}>
                          {item.name}
                        </Text>
                        <IconButton
                          aria-label={t('General.delete')}
                          size="xs"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => removeItem(item.internal_id)}
                        >
                          <LuX />
                        </IconButton>
                      </Flex>
                    ))}
                  </Stack>
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
                      placeholder={t('Lists.suggest-missing-note-placeholder')}
                      disabled={isPending}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </Field.Root>
                  {status.type === 'error' && (
                    <Text fontSize="sm" textAlign="center" color="red.300">
                      {status.message}
                    </Text>
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
                  <Button onClick={handleSubmit} loading={isPending} disabled={!items.length}>
                    {t('General.send')}
                  </Button>
                </>
              )}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
