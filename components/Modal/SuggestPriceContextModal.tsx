import {
  Box,
  Button,
  CloseButton,
  Dialog,
  Field,
  Flex,
  Image,
  Link,
  Portal,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import Markdown from '@components/Utils/Markdown';
import type { ItemData, PriceData } from '@types';
import { suggestPriceContext } from '@app/[locale]/item/[slug]/actions';
import { MAX_PRICE_CONTEXT_SUGGESTION_LENGTH } from '@utils/prices/priceContextSuggestionConstants';

/**
 * "Suggest price context" modal (item page price table). The price entry is fixed; the user
 * writes the context (or a correction of the current one). Logged-out users can send too.
 * Reviewed by admins in the "Price context" tab of /admin/list-suggestions.
 */
export type SuggestPriceContextModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: ItemData;
  price: PriceData;
};

/** idle = form visible; success/error = result of the last submission. */
type Status = { type: 'idle' } | { type: 'success' } | { type: 'error'; message: string };

export default function SuggestPriceContextModal(props: SuggestPriceContextModalProps) {
  const t = useTranslations();
  const format = useFormatter();
  const { isOpen, onClose, item, price } = props;
  const [context, setContext] = useState('');
  const [status, setStatus] = useState<Status>({ type: 'idle' });
  const [isPending, startTransition] = useTransition();
  const hasContext = !!price.context;
  // Umami: new context vs correction, latest price vs older entry
  const trackProps = { hasContext, isLatest: price.isLatest };

  /** Maps server error codes (PriceContextSuggestionErrorCode) to translated messages. */
  const getErrorMessage = (error: string) => {
    if (error === 'already-suggested') return t('ItemPage.suggest-price-context-error-pending');
    if (error === 'same-as-current') return t('ItemPage.suggest-price-context-error-same');
    if (error === 'too-many-requests') return t('ItemPage.suggest-price-context-error-limit');
    if (error === 'context-too-long')
      return t('ItemPage.suggest-price-context-error-too-long', {
        max: MAX_PRICE_CONTEXT_SUGGESTION_LENGTH,
      });

    return t('General.something-went-wrong-please-try-again-later');
  };

  const handleSubmit = () => {
    if (!context.trim()) return;

    window.umami?.track('suggest-price-context-submit', trackProps);

    startTransition(async () => {
      const res = await suggestPriceContext(price.price_id, context);

      if (!res.success) {
        window.umami?.track('suggest-price-context-error', { ...trackProps, code: res.error });
        setStatus({ type: 'error', message: getErrorMessage(res.error) });
        return;
      }

      window.umami?.track('suggest-price-context-success', trackProps);
      setStatus({ type: 'success' });
    });
  };

  const priceLabel = price.value
    ? `${format.number(price.value)} NP`
    : t('ItemPage.suggest-price-context-unknown-price');

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
              <Dialog.Title>{t('ItemPage.suggest-price-context')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              {status.type === 'success' && (
                <Text fontSize="sm" textAlign="center" color="green.200">
                  {t('ItemPage.suggest-price-context-success')}
                </Text>
              )}
              {status.type !== 'success' && (
                <Stack gap={4}>
                  <Text fontSize="sm">
                    {hasContext
                      ? t('ItemPage.suggest-price-context-correction-description')
                      : t('ItemPage.suggest-price-context-description')}
                  </Text>
                  <Text
                    fontSize="xs"
                    color="orange.100"
                    bg="orange.900/40"
                    borderLeft="3px solid"
                    borderColor="orange.400"
                    p={2}
                    borderRadius="md"
                  >
                    {t.rich('ItemPage.suggest-price-context-guideline', {
                      b: (chunk) => <b>{chunk}</b>,
                    })}
                  </Text>
                  <Flex alignItems="center" gap={2} bg="blackAlpha.300" p={1} borderRadius="md">
                    <Image src={item.image} alt={item.name} boxSize="32px" />
                    <Box flex={1} minW={0}>
                      <Text fontSize="sm">{item.name}</Text>
                      <Text fontSize="xs" color="gray.400">
                        {priceLabel} ·{' '}
                        {format.dateTime(new Date(price.addedAt), {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Text>
                    </Box>
                  </Flex>
                  {hasContext && (
                    <Box
                      fontSize="xs"
                      color="whiteAlpha.700"
                      bg="blackAlpha.300"
                      p={2}
                      borderRadius="md"
                      whiteSpace="normal"
                      css={{ '& a': { color: 'blue.200' } }}
                    >
                      <Text fontWeight="bold" mb={1}>
                        {t('ItemPage.suggest-price-context-current')}
                      </Text>
                      <Markdown>{price.context!}</Markdown>
                    </Box>
                  )}
                  <Field.Root>
                    <Field.Label color="gray.300">{t('ItemPage.price-context')}</Field.Label>
                    <Textarea
                      variant="subtle"
                      value={context}
                      maxLength={MAX_PRICE_CONTEXT_SUGGESTION_LENGTH}
                      placeholder={t('ItemPage.suggest-price-context-placeholder')}
                      disabled={isPending}
                      onChange={(e) => setContext(e.target.value)}
                    />
                    <Field.HelperText
                      as="div"
                      display="flex"
                      justifyContent="space-between"
                      gap={2}
                      w="100%"
                      fontSize="xs"
                    >
                      <span>
                        {t.rich('Lists.markdown-tip', {
                          Link: (children) => (
                            <Link
                              href="https://commonmark.org/help/"
                              color="gray.300"
                              target="_blank"
                            >
                              {children}
                            </Link>
                          ),
                          Small: (children) => <Text display="inline">{children}</Text>,
                        })}
                      </span>
                      <Text as="span" flexShrink={0}>
                        {context.length}/{MAX_PRICE_CONTEXT_SUGGESTION_LENGTH}
                      </Text>
                    </Field.HelperText>
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
                <Button variant="ghost" onClick={onClose}>
                  {t('General.close')}
                </Button>
              )}
              {status.type !== 'success' && (
                <>
                  <Button variant="ghost" mr={3} onClick={onClose} disabled={isPending}>
                    {t('General.cancel')}
                  </Button>
                  <Button onClick={handleSubmit} loading={isPending} disabled={!context.trim()}>
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
