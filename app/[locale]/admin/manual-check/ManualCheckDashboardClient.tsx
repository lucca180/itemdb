'use client';

import { useState } from 'react';
import {
  Accordion,
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  Menu,
  Portal,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { LuChevronLeft, LuChevronRight, LuEllipsisVertical } from 'react-icons/lu';
import { Link, useRouter } from '@i18n/navigation';
import { useToast } from '@utils/theme/toast';
import type { ItemProcess } from '@prisma/generated/client';
import type { ItemData } from '@types';
import type {
  ItemManualCheckInfoData,
  ManualCheckConflictCategory,
} from '@app/api/admin/manual/manualCheckService';

const ManualCheckDiffView = dynamic(() =>
  import('@app/_components/Item/ManualCheck/ManualCheckDiffView').then(
    (mod) => mod.ManualCheckDiffView
  )
);

export type DashboardGroup = {
  targetId: number;
  category: ManualCheckConflictCategory;
  item: ItemData;
  info: ItemManualCheckInfoData;
};

type Props = {
  groups: DashboardGroup[];
  page: number;
  pageSize: number;
  total: number;
};

const SECTION_META: Record<
  ManualCheckConflictCategory,
  { label: string; hint: string; accent: string }
> = {
  rename: {
    label: 'Rename',
    hint: 'Image matches — the same item was likely just renamed',
    accent: 'purple.400',
  },
  're-art': {
    label: 'Image change',
    hint: 'Only the name matched — double-check this is really the same item',
    accent: 'orange.400',
  },
  other: {
    label: 'Other fields',
    hint: 'item_id already confirmed — a different field changed',
    accent: 'gray.500',
  },
};

export function ManualCheckDashboardClient({ groups, page, pageSize, total }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const byCategory = (category: ManualCheckConflictCategory) =>
    groups.filter((g) => g.category === category);

  if (groups.length === 0) {
    return (
      <Box textAlign="center" py={16}>
        <Text fontSize="lg" color="gray.400">
          Nothing pending on this page 🎉
        </Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={10} mt={6}>
      {(['rename', 're-art', 'other'] as const).map((category) => {
        const sectionGroups = byCategory(category);
        if (sectionGroups.length === 0) return null;
        return <ManualCheckSection key={category} category={category} groups={sectionGroups} />;
      })}

      <HStack justify="center" gap={4} mt={2}>
        {page > 1 ? (
          <IconButton aria-label="Previous page" size="sm" variant="outline" asChild>
            <Link href={`/admin/manual-check?page=${page - 1}`}>
              <LuChevronLeft />
            </Link>
          </IconButton>
        ) : (
          <IconButton aria-label="Previous page" size="sm" variant="outline" disabled>
            <LuChevronLeft />
          </IconButton>
        )}
        <Text color="gray.400" fontSize="sm" minW="140px" textAlign="center">
          Page {page} of {totalPages} · {total} pending
        </Text>
        {page < totalPages ? (
          <IconButton aria-label="Next page" size="sm" variant="outline" asChild>
            <Link href={`/admin/manual-check?page=${page + 1}`}>
              <LuChevronRight />
            </Link>
          </IconButton>
        ) : (
          <IconButton aria-label="Next page" size="sm" variant="outline" disabled>
            <LuChevronRight />
          </IconButton>
        )}
      </HStack>
    </VStack>
  );
}

function ManualCheckSection({
  category,
  groups,
}: {
  category: ManualCheckConflictCategory;
  groups: DashboardGroup[];
}) {
  const meta = SECTION_META[category];
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const toggle = (targetId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(targetId)) next.delete(targetId);
      else next.add(targetId);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === groups.length ? new Set() : new Set(groups.map((g) => g.targetId))
    );
  };

  const runBulkAction = async (action: 'approve' | 'reprove') => {
    if (selected.size === 0 || busy) return;
    setBusy(true);

    const promise = axios
      .post('/api/admin/manual/bulk', { type: 'info', action, ids: [...selected] })
      .then(() => {
        setSelected(new Set());
        router.refresh();
      })
      .finally(() => setBusy(false));

    toast.promise(promise, {
      success: { id: 'manual-check-bulk-success', title: 'Success', description: 'Thank you' },
      error: {
        id: 'manual-check-bulk-error',
        title: 'Something wrong',
        description: 'Please try again later',
      },
      loading: { id: 'manual-check-bulk-loading', title: 'Please wait' },
    });
  };

  const allSelected = selected.size > 0 && selected.size === groups.length;

  return (
    <Box>
      <Flex align="center" gap={2} mb={1}>
        <Box w="4px" h="20px" borderRadius="full" bg={meta.accent} />
        <Heading size="md">{meta.label}</Heading>
        <Badge colorPalette="whiteAlpha" variant="subtle">
          {groups.length}
        </Badge>
      </Flex>
      <Text fontSize="sm" color="gray.500" mb={3} ml="12px">
        {meta.hint}
      </Text>

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
            onClick={() => runBulkAction('reprove')}
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
        {groups.map((group) => (
          <ManualCheckRow
            key={group.targetId}
            group={group}
            accent={meta.accent}
            showComparisonAccordion={category !== 'other'}
            checked={selected.has(group.targetId)}
            onToggle={() => toggle(group.targetId)}
          />
        ))}
      </VStack>
    </Box>
  );
}

type ComparisonRow = {
  label: string;
  current: (item: ItemData) => string;
  incoming: (process: ItemProcess) => string;
};

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: 'Description',
    current: (i) => i.description || '—',
    incoming: (p) => p.description || '—',
  },
  { label: 'Category', current: (i) => i.category || '—', incoming: (p) => p.category || '—' },
  { label: 'Type', current: (i) => i.type, incoming: (p) => p.type },
  {
    label: 'Rarity',
    current: (i) => String(i.rarity ?? '—'),
    incoming: (p) => String(p.rarity ?? '—'),
  },
  {
    label: 'Weight',
    current: (i) => String(i.weight ?? '—'),
    incoming: (p) => String(p.weight ?? '—'),
  },
  {
    label: 'Est. Value',
    current: (i) => String(i.estVal ?? '—'),
    incoming: (p) => String(p.est_val ?? '—'),
  },
  {
    label: 'NC',
    current: (i) => (i.isNC ? 'Yes' : 'No'),
    incoming: (p) => (p.isNC ? 'Yes' : 'No'),
  },
  {
    label: 'Wearable',
    current: (i) => (i.isWearable ? 'Yes' : 'No'),
    incoming: (p) => (p.isWearable ? 'Yes' : 'No'),
  },
  { label: 'Status', current: (i) => i.status || '—', incoming: (p) => p.status || '—' },
];

function ItemThumb({ name, image }: { name: string; image: string | null | undefined }) {
  return (
    <Image
      src={image ?? undefined}
      alt={name}
      title={name}
      boxSize="44px"
      borderRadius="md"
      bg="blackAlpha.400"
      objectFit="contain"
      flexShrink={0}
    />
  );
}

function ManualCheckRow({
  group,
  accent,
  showComparisonAccordion,
  checked,
  onToggle,
}: {
  group: DashboardGroup;
  accent: string;
  showComparisonAccordion: boolean;
  checked: boolean;
  onToggle: () => void;
}) {
  const { item, info } = group;
  const itemHref = `/item/${item.slug ?? item.internal_id}`;
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const conflictChange = info.changes.find((change) => change.field === info.conflictField);

  const submit = (
    action: 'approve' | 'reprove' | 'correct' | 'force_create' | 'mark_clone',
    correctInfo?: { field: string | null; value: unknown }
  ) => {
    if (busy) return;
    setBusy(true);

    const promise = axios
      .post(`/api/admin/manual/${item.internal_id}`, {
        action,
        type: 'info',
        checkID: info.process.internal_id,
        correctInfo,
      })
      .then(() => router.refresh())
      .finally(() => setBusy(false));

    toast.promise(promise, {
      success: { id: 'manual-check-success', title: 'Success', description: 'Thank you' },
      error: {
        id: 'manual-check-error',
        title: 'Something wrong',
        description: 'Please try again later',
      },
      loading: { id: 'manual-check-loading', title: 'Please wait' },
    });
  };

  const approve = () =>
    submit(
      'approve',
      conflictChange ? { field: info.conflictField, value: conflictChange.rawIncoming } : undefined
    );

  return (
    <Box
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderLeftWidth="3px"
      borderLeftColor={accent}
      borderRadius="lg"
      bg="blackAlpha.300"
      p={3}
    >
      <Flex align="center" justify="space-between" gap={3} flexWrap="wrap">
        <HStack gap={3} flex={1} minW="280px">
          <Checkbox.Root
            colorPalette="whiteAlpha"
            checked={checked}
            onCheckedChange={onToggle}
            cursor="pointer"
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control cursor="pointer" />
          </Checkbox.Root>

          <ItemThumb name={item.name} image={item.image} />
          <Text fontSize="sm" fontWeight="medium" lineClamp={2}>
            <Link href={itemHref} target="_blank">
              <Text as="span" textDecoration="underline" textDecorationStyle="dotted">
                {item.name}
              </Text>
            </Link>
          </Text>

          <Text color="gray.600">→</Text>

          <ItemThumb name={info.process.name} image={info.process.image} />
          <Text fontSize="sm" fontWeight="medium" lineClamp={2}>
            {info.process.name}
          </Text>
        </HStack>

        <HStack gap={2} flexShrink={0}>
          <Button
            size="sm"
            colorPalette="red"
            variant="subtle"
            disabled={busy}
            onClick={() => submit('reprove')}
          >
            Ignore
          </Button>
          <Button size="sm" colorPalette="green" variant="solid" disabled={busy} onClick={approve}>
            Approve
          </Button>
          <Menu.Root positioning={{ placement: 'bottom-end' }}>
            <Menu.Trigger asChild>
              <IconButton
                aria-label="More actions"
                size="sm"
                variant="ghost"
                colorPalette="whiteAlpha"
                disabled={busy}
              >
                <LuEllipsisVertical />
              </IconButton>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  {info.changes.some((c) => !c.isConflict) && (
                    <Menu.Item
                      value="correct"
                      cursor="pointer"
                      _hover={{ bg: 'whiteAlpha.200' }}
                      onClick={() =>
                        submit(
                          'correct',
                          conflictChange
                            ? { field: info.conflictField, value: conflictChange.rawCurrent }
                            : undefined
                        )
                      }
                    >
                      Keep current {info.conflictField}, apply other changes
                    </Menu.Item>
                  )}
                  <Menu.Item
                    value="force_create"
                    cursor="pointer"
                    _hover={{ bg: 'whiteAlpha.200' }}
                    onClick={() => submit('force_create')}
                  >
                    Create as new item
                  </Menu.Item>
                  <Menu.Item
                    value="mark_clone"
                    cursor="pointer"
                    _hover={{ bg: 'whiteAlpha.200' }}
                    onClick={() => submit('mark_clone')}
                  >
                    Create as clone (canonical_id)
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </HStack>
      </Flex>

      {info.changes.length > 0 && (
        <Box mt={3}>
          <ManualCheckDiffView changes={info.changes} conflictField={info.conflictField} />
        </Box>
      )}

      {showComparisonAccordion && (
        <Accordion.Root collapsible mt={3} bg="red.950" borderRadius="md">
          <Accordion.Item value="compare">
            <Accordion.ItemTrigger px={3} py={2}>
              <Box as="span" flex="1" textAlign="left" fontSize="xs" color="gray.400">
                Compare more fields
              </Box>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody px={3} pb={3}>
                <SimpleGrid columns={3} gap={2} fontSize="sm">
                  <Text fontWeight="semibold" color="gray.400">
                    Field
                  </Text>
                  <Text fontWeight="semibold" color="gray.400">
                    Current
                  </Text>
                  <Text fontWeight="semibold" color="gray.400">
                    New
                  </Text>
                  {COMPARISON_ROWS.flatMap((row) => [
                    <Text key={`${row.label}-label`} color="gray.400">
                      {row.label}
                    </Text>,
                    <Text key={`${row.label}-current`}>{row.current(item)}</Text>,
                    <Text key={`${row.label}-incoming`}>{row.incoming(info.process)}</Text>,
                  ])}
                </SimpleGrid>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion.Root>
      )}
    </Box>
  );
}
