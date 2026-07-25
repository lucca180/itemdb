'use client';

import {
  Text,
  Spinner,
  Center,
  Accordion,
  Box,
  Flex,
  Link,
  Dialog,
  CloseButton,
  Portal,
  Button,
} from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ItemV2For, UserList } from '@types';
import { useFormatter, useTranslations } from 'next-intl';
import ItemCardV2 from '@components/Items/v2/ItemCardV2';
import { fetchManyItems } from '@app/server/items/actions';
import {
  loadDynamicLogs,
  type DynamicLogCursor,
  type DynamicLogEntry,
} from '@app/server/lists/actions';

const LOGS_PAGE_SIZE = 20;
/** Max ItemCardV2s shown per added/removed section before "show more". */
const ITEMS_PAGE_SIZE = 48;
/** Must stay ≤ `fetchManyItems` server MAX (100). */
const FETCH_MANY_CHUNK = 100;
const NST_TZ = 'America/Los_Angeles';

/** Calendar day in NST as `YYYY-MM-DD` (lexicographically comparable). */
function nstDayKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: NST_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function isBeforeTodayNst(iso: string): boolean {
  return nstDayKey(new Date(iso)) < nstDayKey(new Date());
}

export type DynamicListLogsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  list: UserList;
};

const DynamicListLogsModal = (props: DynamicListLogsModalProps) => {
  const t = useTranslations();
  const formatter = useFormatter();
  const { isOpen, onClose, list } = props;

  const [logs, setLogs] = useState<DynamicLogEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<DynamicLogCursor | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);

  const [itemCache, setItemCache] = useState<Record<number, ItemV2For<'card'>>>({});
  const [panelLoading, setPanelLoading] = useState<Record<number, boolean>>({});
  const [panelError, setPanelError] = useState<Record<number, boolean>>({});
  const [visibleCount, setVisibleCount] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<string[]>([]);

  const itemCacheRef = useRef(itemCache);
  itemCacheRef.current = itemCache;

  const username = list.official ? 'official' : (list.owner.username ?? '');
  const isLinkedList = !!list.linkedListId;

  const removedForDisplay = useCallback(
    (log: DynamicLogEntry) => {
      if (isLinkedList && isBeforeTodayNst(log.addedAt)) return [];
      return log.removed;
    },
    [isLinkedList]
  );

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(false);
      setLoadMoreError(false);
      setLogs([]);
      setNextCursor(null);
      setExpanded([]);
      setVisibleCount({});
      setItemCache({});
      setPanelLoading({});
      setPanelError({});

      try {
        const page = await loadDynamicLogs(username, list.internal_id, null, LOGS_PAGE_SIZE);
        if (cancelled) return;
        setLogs(page.logs);
        setNextCursor(page.nextCursor);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [isOpen, username, list.internal_id]);

  const loadMoreLogs = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setLoadMoreError(false);
    try {
      const page = await loadDynamicLogs(username, list.internal_id, nextCursor, LOGS_PAGE_SIZE);
      setLogs((prev) => [...prev, ...page.logs]);
      setNextCursor(page.nextCursor);
    } catch (e) {
      console.error(e);
      setLoadMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  const ensureItemsLoaded = async (logId: number, iids: number[]) => {
    const needed = iids.filter((iid) => !itemCacheRef.current[iid]);
    if (needed.length === 0) return;

    setPanelLoading((prev) => ({ ...prev, [logId]: true }));
    setPanelError((prev) => ({ ...prev, [logId]: false }));
    try {
      const unique = [...new Set(needed)];
      const merged: Record<string, ItemV2For<'card'>> = {};

      for (let i = 0; i < unique.length; i += FETCH_MANY_CHUNK) {
        const chunk = unique.slice(i, i + FETCH_MANY_CHUNK);
        const data = await fetchManyItems({ type: 'id', data: chunk }, { limit: chunk.length });
        Object.assign(merged, data);
      }

      setItemCache((prev) => {
        const next = { ...prev };
        for (const item of Object.values(merged)) {
          next[item.internal_id] = item;
        }
        return next;
      });
    } catch (e) {
      console.error(e);
      setPanelError((prev) => ({ ...prev, [logId]: true }));
    } finally {
      setPanelLoading((prev) => ({ ...prev, [logId]: false }));
    }
  };

  const visibleIidsForLog = (log: DynamicLogEntry, counts: Record<string, number>) => {
    const addedLimit = counts[`${log.logId}:added`] ?? ITEMS_PAGE_SIZE;
    const removedLimit = counts[`${log.logId}:removed`] ?? ITEMS_PAGE_SIZE;
    const removed = removedForDisplay(log);
    return [...log.added.slice(0, addedLimit), ...removed.slice(0, removedLimit)];
  };

  const onAccordionChange = (details: { value: string[] }) => {
    const next = details.value;
    setExpanded(next);

    for (const value of next) {
      const logId = Number(value);
      const log = logs.find((l) => l.logId === logId);
      if (!log) continue;

      const addedKey = `${logId}:added`;
      const removedKey = `${logId}:removed`;
      const counts = {
        [addedKey]: visibleCount[addedKey] ?? ITEMS_PAGE_SIZE,
        [removedKey]: visibleCount[removedKey] ?? ITEMS_PAGE_SIZE,
      };

      setVisibleCount((prev) => {
        const updated = { ...prev };
        if (!updated[addedKey]) updated[addedKey] = ITEMS_PAGE_SIZE;
        if (!updated[removedKey]) updated[removedKey] = ITEMS_PAGE_SIZE;
        return updated;
      });

      void ensureItemsLoaded(logId, visibleIidsForLog(log, counts));
    }
  };

  const showMoreItems = (log: DynamicLogEntry, kind: 'added' | 'removed') => {
    const sectionKey = `${log.logId}:${kind}`;
    const nextCount = (visibleCount[sectionKey] ?? ITEMS_PAGE_SIZE) + ITEMS_PAGE_SIZE;
    const counts = {
      ...visibleCount,
      [sectionKey]: nextCount,
    };
    setVisibleCount(counts);
    void ensureItemsLoaded(log.logId, visibleIidsForLog(log, counts));
  };

  const renderItemSection = (log: DynamicLogEntry, kind: 'added' | 'removed', iids: number[]) => {
    if (!iids.length) return null;

    const sectionKey = `${log.logId}:${kind}`;
    const limit = visibleCount[sectionKey] ?? ITEMS_PAGE_SIZE;
    const shown = iids.slice(0, limit);
    const remaining = iids.length - shown.length;
    const isPanelLoading = panelLoading[log.logId];
    const hasPanelError = panelError[log.logId];

    return (
      <Flex flexWrap="wrap" gap={2} bg="blackAlpha.400" p={2} borderRadius="md" mb={2}>
        <Text fontSize="sm" fontWeight="bold" w="100%">
          {kind === 'added' ? t('General.added') : t('General.removed')}
        </Text>
        {isPanelLoading && shown.every((iid) => !itemCache[iid]) && (
          <Center w="100%" py={2}>
            <Spinner size="sm" />
          </Center>
        )}
        {hasPanelError && !isPanelLoading && (
          <Text fontSize="xs" color="red.300" w="100%">
            {t('General.error')}
          </Text>
        )}
        {!hasPanelError &&
          shown.map((iid) => {
            const item = itemCache[iid];
            if (!item) {
              if (isPanelLoading) {
                return (
                  <ItemCardV2
                    key={`${kind}-${iid}`}
                    uniqueID={`dynamic-log-${kind}-${log.logId}`}
                    isLoading
                    small
                  />
                );
              }
              return null;
            }
            return (
              <ItemCardV2
                key={`${kind}-${item.internal_id}`}
                uniqueID={`dynamic-log-${kind}-${log.logId}`}
                item={item}
                small
                disablePrefetch
              />
            );
          })}
        {remaining > 0 && !hasPanelError && (
          <Button size="xs" variant="ghost" onClick={() => showMoreItems(log, kind)} w="100%">
            {t('Lists.import-and-more', { value: remaining })}
          </Button>
        )}
      </Flex>
    );
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) onClose();
      }}
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('DynamicList.dynamic-list-history')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              <Text fontSize="xs" textAlign="center" mb={4} color="gray.400">
                {t.rich('Lists.dynamic-disclaimer', {
                  x: list.dynamicType || '',
                  b: (chunk) => <b>{chunk}</b>,
                  Link: (chunk) => (
                    <Link
                      href="/articles/checklists-and-dynamic-lists"
                      target="_blank"
                      rel="noreferrer"
                      color="gray.300"
                    >
                      {chunk}
                    </Link>
                  ),
                })}
              </Text>

              {loading && (
                <Center>
                  <Spinner />
                </Center>
              )}

              {error && !loading && (
                <Text fontSize="sm" textAlign="center" color="red.300" mb={3}>
                  {t('General.error')}
                </Text>
              )}

              {!loading && !error && logs.length === 0 && (
                <Text fontSize="sm" textAlign="center" mb={3}>
                  {t('DynamicList.no-change-logs-found-for-this-list')}
                </Text>
              )}

              {!loading && logs.length > 0 && (
                <>
                  <Accordion.Root collapsible value={expanded} onValueChange={onAccordionChange}>
                    {logs.map((log) => {
                      const hideRemovedHistory = isLinkedList && isBeforeTodayNst(log.addedAt);
                      const removed = hideRemovedHistory ? [] : log.removed;
                      return (
                        <Accordion.Item key={log.logId} value={String(log.logId)}>
                          <Accordion.ItemTrigger>
                            <Box as="span" flex="1" textAlign="left">
                              {formatter.dateTime(new Date(log.addedAt), {
                                dateStyle: 'long',
                                timeStyle: 'short',
                                timeZone: NST_TZ,
                              })}{' '}
                              NST
                              <Text fontSize="sm" color="gray.500">
                                {t('General.x-added', { x: log.added.length })}
                                {!hideRemovedHistory &&
                                  `, ${t('General.x-removed', { x: removed.length })}`}
                              </Text>
                            </Box>
                            <Accordion.ItemIndicator />
                          </Accordion.ItemTrigger>
                          <Accordion.ItemContent>
                            <Accordion.ItemBody pb={4}>
                              {renderItemSection(log, 'added', log.added)}
                              {renderItemSection(log, 'removed', removed)}
                            </Accordion.ItemBody>
                          </Accordion.ItemContent>
                        </Accordion.Item>
                      );
                    })}
                  </Accordion.Root>

                  {loadMoreError && (
                    <Text fontSize="sm" textAlign="center" color="red.300" mt={3}>
                      {t('General.error')}
                    </Text>
                  )}

                  {nextCursor && (
                    <Center mt={4} mb={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        loading={loadingMore}
                        onClick={() => void loadMoreLogs()}
                      >
                        {t('ItemPage.show-more')}
                      </Button>
                    </Center>
                  )}
                </>
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default DynamicListLogsModal;
