'use client';

import { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  HStack,
  Image,
  Text,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import { Link, useRouter } from '@i18n/navigation';
import { useToast } from '@utils/theme/toast';
import type { ListSuggestionGroup, ListSuggestionItem } from '@services/ListSuggestionService';

/**
 * Client side of /admin/list-suggestions: one section per official list, one row per suggested
 * item, with per-item and bulk approve/reject. Every action refreshes the server data.
 */
type Props = {
  groups: ListSuggestionGroup[];
};

type ResolveAction = 'approve' | 'reject';

const intl = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

/** Calls the admin resolve route with toast feedback, then refreshes the page data. */
function useResolveSuggestions() {
  const router = useRouter();
  const toast = useToast();

  return (listId: number, itemIids: number[], action: ResolveAction) => {
    const promise = axios
      .post('/api/admin/list-suggestions', { listId, itemIids, action })
      .then(() => router.refresh());

    toast.promise(promise, {
      success: {
        id: 'list-suggestions-success',
        title: action === 'approve' ? 'Added to list' : 'Rejected',
      },
      error: {
        id: 'list-suggestions-error',
        title: 'Something wrong',
        description: 'Please try again later',
      },
      loading: { id: 'list-suggestions-loading', title: 'Please wait' },
    });

    return promise;
  };
}

/** One section per list. */
export function ListSuggestionsDashboardClient({ groups }: Props) {
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
    <VStack align="stretch" gap={10} mt={6}>
      {groups.map((group) => (
        <ListSuggestionSection key={group.list.internal_id} group={group} />
      ))}
    </VStack>
  );
}

/** One list: header (link to the list), bulk selection bar and item rows. */
function ListSuggestionSection({ group }: { group: ListSuggestionGroup }) {
  const { list, items } = group;
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const resolve = useResolveSuggestions();
  const accent = list.colorHex ?? 'gray.400';

  const toggle = (iid: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(iid)) next.delete(iid);
      else next.add(iid);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((i) => i.item_iid))
    );
  };

  const runBulkAction = (action: ResolveAction) => {
    if (selected.size === 0 || busy) return;
    setBusy(true);

    resolve(list.internal_id, [...selected], action)
      .then(() => setSelected(new Set()))
      .catch(() => {})
      .finally(() => setBusy(false));
  };

  const allSelected = selected.size > 0 && selected.size === items.length;

  return (
    <Box>
      <Flex align="center" gap={2} mb={3}>
        <Box w="4px" h="20px" borderRadius="full" bg={accent} />
        {list.cover_url && (
          <Image src={list.cover_url} alt={list.name} boxSize="28px" borderRadius="sm" />
        )}
        <Heading size="md">
          <Link href={`/lists/official/${list.slug ?? list.internal_id}`} target="_blank">
            {list.name}
          </Link>
        </Heading>
        <Badge colorPalette="whiteAlpha" variant="subtle">
          {items.length}
        </Badge>
      </Flex>

      <Flex
        align="center"
        justify="space-between"
        flexWrap="wrap"
        gap={3}
        mb={3}
        p={2}
        borderRadius="md"
        bg="blackAlpha.300"
      >
        <Checkbox.Root
          colorPalette="whiteAlpha"
          checked={allSelected ? true : selected.size > 0 ? 'indeterminate' : false}
          onCheckedChange={toggleAll}
          cursor="pointer"
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control cursor="pointer" />
          <Checkbox.Label>
            <Text fontSize="sm" color="gray.300">
              {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
            </Text>
          </Checkbox.Label>
        </Checkbox.Root>
        <HStack gap={2}>
          <Button
            size="sm"
            colorPalette="red"
            variant="subtle"
            disabled={selected.size === 0 || busy}
            onClick={() => runBulkAction('reject')}
          >
            Reject selected
          </Button>
          <Button
            size="sm"
            colorPalette="green"
            variant="solid"
            disabled={selected.size === 0 || busy}
            onClick={() => runBulkAction('approve')}
          >
            Approve selected
          </Button>
        </HStack>
      </Flex>

      <VStack align="stretch" gap={3}>
        {items.map((suggestion) => (
          <ListSuggestionRow
            key={suggestion.item_iid}
            listId={list.internal_id}
            suggestion={suggestion}
            accent={accent}
            checked={selected.has(suggestion.item_iid)}
            onToggle={() => toggle(suggestion.item_iid)}
          />
        ))}
      </VStack>
    </Box>
  );
}

/** One suggested item: who asked, when, their notes, and approve/reject buttons. */
function ListSuggestionRow({
  listId,
  suggestion,
  accent,
  checked,
  onToggle,
}: {
  listId: number;
  suggestion: ListSuggestionItem;
  accent: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const resolve = useResolveSuggestions();
  const { item, requests } = suggestion;
  const notes = requests.filter((r) => !!r.note);
  const usernames = [...new Set(requests.map((r) => r.username ?? 'unknown'))];

  const run = (action: ResolveAction) => {
    if (busy) return;
    setBusy(true);
    resolve(listId, [suggestion.item_iid], action)
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
      borderColor={accent}
      align={{ base: 'stretch', md: 'center' }}
      flexFlow={{ base: 'column', md: 'row' }}
    >
      <Flex gap={3} align="center" flex={1} minW={0}>
        <Checkbox.Root checked={checked} onCheckedChange={onToggle} colorPalette="whiteAlpha">
          <Checkbox.HiddenInput />
          <Checkbox.Control cursor="pointer" />
        </Checkbox.Root>
        {item && <Image src={item.image.url} alt={item.name} boxSize="50px" />}
        <VStack align="start" gap={1} minW={0}>
          <HStack gap={2} flexWrap="wrap">
            {item ? (
              <Link href={`/item/${item.slug ?? item.internal_id}`} target="_blank">
                <Text fontWeight="bold">{item.name}</Text>
              </Link>
            ) : (
              <Text fontWeight="bold">#{suggestion.item_iid}</Text>
            )}
            <Badge colorPalette="blue" variant="subtle">
              {requests.length} {requests.length === 1 ? 'request' : 'requests'}
            </Badge>
          </HStack>
          <Text fontSize="xs" color="gray.400">
            by {usernames.join(', ')} · last {intl.format(new Date(suggestion.lastAt))}
          </Text>
          {notes.map((request, i) => (
            <Text key={i} fontSize="sm" color="gray.300" whiteSpace="pre-wrap">
              <Text as="span" color="gray.500">
                {request.username ?? 'unknown'}:
              </Text>{' '}
              {request.note}
            </Text>
          ))}
        </VStack>
      </Flex>
      <HStack gap={2} justify="flex-end">
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
          disabled={busy}
          onClick={() => run('approve')}
        >
          Approve
        </Button>
      </HStack>
    </Flex>
  );
}
