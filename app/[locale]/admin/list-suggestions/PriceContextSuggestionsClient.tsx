'use client';

import { useState } from 'react';
import { Badge, Box, Button, Flex, HStack, Image, Text, Textarea, VStack } from '@chakra-ui/react';
import axios from 'axios';
import { Link, useRouter } from '@i18n/navigation';
import { useToast } from '@utils/theme/toast';
import Markdown from '@components/Utils/Markdown';
import type { PriceContextSuggestionGroup } from '@services/PriceContextSuggestionService';
import { MAX_PRICE_CONTEXT_SUGGESTION_LENGTH } from '@utils/prices/priceContextSuggestionConstants';

/**
 * "Price context" tab of /admin/list-suggestions: one row per price entry with its pending
 * suggestions. Approve writes the (editable) text to the price; reject dismisses every
 * suggestion for that price. Every action refreshes the server data.
 */
type Props = {
  groups: PriceContextSuggestionGroup[];
};

type ResolveAction = 'approve' | 'reject';

const intl = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });
const priceDate = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });
const npFormat = new Intl.NumberFormat('en');

/** Calls the admin resolve route with toast feedback, then refreshes the page data. */
function useResolvePriceContext() {
  const router = useRouter();
  const toast = useToast();

  return (priceId: number, action: ResolveAction, context?: string) => {
    const promise = axios
      .post('/api/admin/price-context/suggestions', { priceId, action, context })
      .then(() => router.refresh());

    toast.promise(promise, {
      success: {
        id: 'price-context-suggestions-success',
        title: action === 'approve' ? 'Context saved' : 'Rejected',
      },
      error: {
        id: 'price-context-suggestions-error',
        title: 'Something wrong',
        description: 'Please try again later',
      },
      loading: { id: 'price-context-suggestions-loading', title: 'Please wait' },
    });

    return promise;
  };
}

export function PriceContextSuggestionsClient({ groups }: Props) {
  if (groups.length === 0) {
    return (
      <Box textAlign="center" py={16}>
        <Text fontSize="lg" color="gray.400">
          Nothing pending 🎉
        </Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={3} mt={6}>
      {groups.map((group) => (
        <PriceContextSuggestionRow key={group.price.price_id} group={group} />
      ))}
    </VStack>
  );
}

/** One price entry: item, price, current context, suggestions and the text to approve. */
function PriceContextSuggestionRow({ group }: { group: PriceContextSuggestionGroup }) {
  const { item, price, requests } = group;
  // starts with the newest suggestion; admins can pick another one or edit it
  const [context, setContext] = useState(requests[0]?.context ?? '');
  const [busy, setBusy] = useState(false);
  const resolve = useResolvePriceContext();

  const run = (action: ResolveAction) => {
    if (busy) return;
    setBusy(true);
    resolve(price.price_id, action, action === 'approve' ? context : undefined)
      .catch(() => {})
      .finally(() => setBusy(false));
  };

  return (
    <Flex
      gap={3}
      p={3}
      borderRadius="md"
      bg="blackAlpha.400"
      borderLeft="3px solid"
      borderColor="yellow.500"
      flexFlow="column"
    >
      <Flex gap={3} align="center" minW={0}>
        {item && <Image src={item.image.url} alt={item.name} boxSize="50px" />}
        <VStack align="start" gap={1} minW={0}>
          <HStack gap={2} flexWrap="wrap">
            {item ? (
              <Link href={`/item/${item.slug ?? item.internal_id}`} target="_blank">
                <Text fontWeight="bold">{item.name}</Text>
              </Link>
            ) : (
              <Text fontWeight="bold">#{group.item_iid}</Text>
            )}
            <Badge colorPalette="blue" variant="subtle">
              {requests.length} {requests.length === 1 ? 'suggestion' : 'suggestions'}
            </Badge>
            {price.context && (
              <Badge colorPalette="orange" variant="subtle">
                correction
              </Badge>
            )}
          </HStack>
          <Text fontSize="sm" color="gray.300">
            {price.value ? `${npFormat.format(price.value)} NP` : 'Unknown price'} ·{' '}
            {priceDate.format(new Date(price.addedAt))}
            {price.inflated && (
              <Text as="span" color="red.300" fontWeight="bold">
                {' '}
                · inflation
              </Text>
            )}
          </Text>
          <Text fontSize="xs" color="gray.400">
            last {intl.format(new Date(group.lastAt))}
          </Text>
        </VStack>
      </Flex>

      {price.context && (
        <Box fontSize="sm" color="gray.300" bg="blackAlpha.300" p={2} borderRadius="md">
          <Text fontSize="xs" color="gray.500" mb={1}>
            Current context
          </Text>
          <Markdown>{price.context}</Markdown>
        </Box>
      )}

      <VStack align="stretch" gap={1}>
        {requests.map((request, i) => (
          <Flex key={i} gap={2} align="flex-start">
            <Text fontSize="sm" color="gray.300" whiteSpace="pre-wrap" flex={1}>
              <Text as="span" color="gray.500">
                {request.username ?? 'logged out'}:
              </Text>{' '}
              {request.context}
            </Text>
            <Button
              size="2xs"
              variant="ghost"
              disabled={busy || context === request.context}
              onClick={() => setContext(request.context)}
            >
              Use
            </Button>
          </Flex>
        ))}
      </VStack>

      <Textarea
        size="sm"
        variant="subtle"
        value={context}
        maxLength={MAX_PRICE_CONTEXT_SUGGESTION_LENGTH}
        disabled={busy}
        onChange={(e) => setContext(e.target.value)}
      />

      <Flex gap={2} align="center" justify="space-between">
        <Text fontSize="xs" color="gray.500">
          {context.length}/{MAX_PRICE_CONTEXT_SUGGESTION_LENGTH}
        </Text>
        <HStack gap={2}>
          <Button
            size="sm"
            colorPalette="red"
            variant="subtle"
            disabled={busy}
            onClick={() => run('reject')}
          >
            Reject
          </Button>
          <Button
            size="sm"
            colorPalette="green"
            variant="solid"
            disabled={busy || !context.trim()}
            onClick={() => run('approve')}
          >
            Approve
          </Button>
        </HStack>
      </Flex>
    </Flex>
  );
}
