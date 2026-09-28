'use client';

import { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Center,
  Checkbox,
  Flex,
  HStack,
  Image,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import { Link } from '@i18n/navigation';
import { useToast } from '@utils/theme/toast';
import type { OpenableCandidate, OpenableCandidatesResult } from '@services/OpenableReviewService';

/**
 * Client side of /admin/openable-review: one row per item, a quick "mark as openable" button,
 * a toggle to include items whose drops would not render, and "load older openings", which
 * widens the window by `daysStep` days per click.
 */
type Props = {
  initial: OpenableCandidatesResult;
  daysStep: number;
};

const intl = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

export function OpenableReviewClient({ initial, daysStep }: Props) {
  const [result, setResult] = useState(initial);
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const toast = useToast();

  const load = (days: number, all: boolean) => {
    setLoading(true);

    return axios
      .get<OpenableCandidatesResult>('/api/admin/openable-review', {
        params: { days, all: all ? 1 : undefined },
      })
      .then((res) => setResult(res.data))
      .catch(() =>
        toast({
          id: 'openable-review-load-error',
          title: 'Something wrong',
          description: 'Please try again later',
          status: 'error',
        })
      )
      .finally(() => setLoading(false));
  };

  const toggleShowAll = () => {
    const next = !showAll;
    setShowAll(next);
    load(result.days, next);
  };

  const markOpenable = (itemIid: number) => {
    const promise = axios
      .post('/api/admin/openable-review', { itemIid })
      .then(() => setMarked((prev) => new Set(prev).add(itemIid)));

    toast.promise(promise, {
      success: { id: 'openable-review-success', title: 'Marked as openable' },
      error: {
        id: 'openable-review-error',
        title: 'Something wrong',
        description: 'Please try again later',
      },
      loading: { id: 'openable-review-loading', title: 'Please wait' },
    });

    return promise;
  };

  const candidates = result.candidates.filter((c) => !marked.has(c.internal_id));

  return (
    <VStack align="stretch" gap={4} mt={6}>
      <Flex
        align="center"
        justify="space-between"
        flexWrap="wrap"
        gap={3}
        p={2}
        borderRadius="md"
        bg="blackAlpha.300"
      >
        <Text fontSize="sm" color="gray.300">
          {candidates.length} {candidates.length === 1 ? 'item' : 'items'} with openings in the last{' '}
          {result.days} days
        </Text>
        <Checkbox.Root
          colorPalette="whiteAlpha"
          checked={showAll}
          onCheckedChange={toggleShowAll}
          disabled={isLoading}
          cursor="pointer"
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control cursor="pointer" />
          <Checkbox.Label>
            <Text fontSize="sm" color="gray.300">
              Include items whose drops would not show
            </Text>
          </Checkbox.Label>
        </Checkbox.Root>
      </Flex>

      {isLoading && (
        <Center py={8}>
          <Spinner />
        </Center>
      )}

      {!isLoading && candidates.length === 0 && (
        <Box textAlign="center" py={16}>
          <Text fontSize="lg" color="gray.400">
            Nothing to review 🎉
          </Text>
        </Box>
      )}

      {!isLoading &&
        candidates.map((candidate) => (
          <OpenableCandidateRow
            key={candidate.internal_id}
            candidate={candidate}
            onMark={() => markOpenable(candidate.internal_id)}
          />
        ))}

      {!isLoading && result.hasOlder && (
        <Center>
          <Button size="sm" variant="subtle" onClick={() => load(result.days + daysStep, showAll)}>
            Load {daysStep} more days
          </Button>
        </Center>
      )}
    </VStack>
  );
}

/** One item: opening stats, the most reported drops and the "mark as openable" button. */
function OpenableCandidateRow({
  candidate,
  onMark,
}: {
  candidate: OpenableCandidate;
  onMark: () => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);
  const { item } = candidate;

  const run = () => {
    if (busy) return;
    setBusy(true);
    onMark()
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
      borderColor={candidate.wouldShowDrops ? 'green.400' : 'gray.500'}
      align={{ base: 'stretch', md: 'center' }}
      flexFlow={{ base: 'column', md: 'row' }}
    >
      <Flex gap={3} align="center" flex={1} minW={0}>
        {item && <Image src={item.image.url} alt={item.name} boxSize="50px" />}
        <VStack align="start" gap={1} minW={0}>
          <HStack gap={2} flexWrap="wrap">
            {item ? (
              <Link href={`/item/${item.slug ?? item.internal_id}`} target="_blank">
                <Text fontWeight="bold">{item.name}</Text>
              </Link>
            ) : (
              <Text fontWeight="bold">#{candidate.internal_id}</Text>
            )}
            <Badge colorPalette={candidate.canOpen === 'false' ? 'red' : 'gray'} variant="subtle">
              {candidate.canOpen === 'false' ? 'False' : 'Unknown'}
            </Badge>
            {item && (
              <Badge colorPalette={item.type === 'nc' ? 'purple' : 'green'} variant="subtle">
                {item.type.toUpperCase()}
              </Badge>
            )}
          </HStack>
          <Text fontSize="xs" color="gray.400">
            #{candidate.internal_id} · {candidate.recentOpenings} recent / {candidate.totalOpenings}{' '}
            total openings · last {intl.format(new Date(candidate.lastOpeningAt))}
          </Text>
          <HStack gap={2} flexWrap="wrap">
            {candidate.drops.map((drop) => (
              <HStack
                key={drop.item_iid}
                gap={1}
                opacity={drop.accepted ? 1 : 0.5}
                title={drop.accepted ? 'Would show' : 'Not enough reports'}
              >
                {drop.item && (
                  <Image src={drop.item.image.url} alt={drop.item.name} boxSize="20px" />
                )}
                <Text fontSize="xs" color="gray.300">
                  {drop.item?.name ?? `#${drop.item_iid}`} ×{drop.support}
                </Text>
              </HStack>
            ))}
          </HStack>
        </VStack>
      </Flex>
      <HStack gap={2} justify="flex-end">
        <Button size="sm" colorPalette="green" variant="solid" disabled={busy} onClick={run}>
          Mark as openable
        </Button>
      </HStack>
    </Flex>
  );
}
