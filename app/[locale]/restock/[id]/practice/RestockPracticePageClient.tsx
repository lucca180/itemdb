'use client';

import { Badge, Box, Button, Center, HStack, Spinner, Stack, Switch, Text } from '@chakra-ui/react';
import { useFormatter, useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { NeoShopFrame } from '@components/Hubs/Restock/Practice/NeoShopFrame';
import {
  PracticeResultModal,
  type PracticeResult,
} from '@components/Hubs/Restock/Practice/PracticeResultModal';
import type { ShopInfo } from '@types';
import { INITIAL_MIN_PROFIT } from '@utils/restock-filters';
import {
  decodePracticePool,
  generateRestock,
  loadItemImage,
  practicePoolUrl,
  type PracticeItem,
  type PracticePoolPayload,
  type PracticeStockedItem,
} from '@utils/restockPractice';

type RestockPracticePageClientProps = {
  shopInfo: ShopInfo;
};

type SessionStats = {
  attempts: number;
  /** attempts made with the timer on — the reaction averages only count these */
  timedAttempts: number;
  totalMs: number;
  bestMs: number | null;
  bestPicks: number;
};

type PoolState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; items: PracticeItem[] };

const INITIAL_STATS: SessionStats = {
  attempts: 0,
  timedAttempts: 0,
  totalMs: 0,
  bestMs: null,
  bestPicks: 0,
};
const MAX_MISSED_ITEMS = 5;

// Simulated page load so the grid doesn't pop in instantly after each refresh
const randomLoadDelay = () => 150 + Math.random() * 350;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const statsStorageKey = (shopId: string) => `restock-practice-stats:${shopId}`;
const TIMER_STORAGE_KEY = 'restock-practice-timer';

function readStoredStats(shopId: string): SessionStats {
  try {
    const stored = localStorage.getItem(statsStorageKey(shopId));
    if (!stored) return INITIAL_STATS;

    const parsed = JSON.parse(stored) as Partial<SessionStats>;
    // stats saved before the timer toggle existed: every attempt was timed
    return { ...INITIAL_STATS, timedAttempts: parsed.attempts ?? 0, ...parsed };
  } catch {
    return INITIAL_STATS;
  }
}

function readStoredTimerEnabled() {
  try {
    return localStorage.getItem(TIMER_STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

function writeStoredTimerEnabled(enabled: boolean) {
  try {
    localStorage.setItem(TIMER_STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // storage unavailable — the preference just won't persist
  }
}

function writeStoredStats(shopId: string, stats: SessionStats) {
  try {
    localStorage.setItem(statsStorageKey(shopId), JSON.stringify(stats));
  } catch {
    // storage unavailable (private mode, blocked site data) — stats just won't persist
  }
}

/** Rolls a restock and waits until every image is decoded, so it can be painted in one frame. */
const prepareRestock = (pool: PracticeItem[], shopId: number): Promise<PracticeStockedItem[]> =>
  Promise.all(
    generateRestock(pool, shopId).map(async (item) => ({
      ...item,
      image: await loadItemImage(item.imageId),
    }))
  );

export function RestockPracticePageClient({ shopInfo }: RestockPracticePageClientProps) {
  const t = useTranslations();
  const format = useFormatter();
  const shopId = Number(shopInfo.id);

  const [pool, setPool] = useState<PoolState>({ status: 'loading' });
  const [items, setItems] = useState<PracticeStockedItem[] | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [stats, setStats] = useState<SessionStats>(INITIAL_STATS);
  const [isTimerEnabled, setTimerEnabled] = useState(true);

  // performance.now() of the first frame the restock was painted; null while not measurable
  const shownAtRef = useRef<number | null>(null);
  const refreshIdRef = useRef(0);
  // next restock, rolled + images preloaded while the user looks at the current one
  const nextRestockRef = useRef<Promise<PracticeStockedItem[]> | null>(null);

  const loadPool = useCallback(
    async (signal?: AbortSignal) => {
      setPool({ status: 'loading' });
      try {
        const res = await fetch(practicePoolUrl(shopId), { signal });
        if (!res.ok) throw new Error(`Failed to load practice pool: ${res.status}`);

        const poolItems = decodePracticePool((await res.json()) as PracticePoolPayload);
        if (signal?.aborted) return;

        nextRestockRef.current = prepareRestock(poolItems, shopId);
        setPool({ status: 'ready', items: poolItems });
      } catch (error) {
        if (signal?.aborted) return;
        console.error(error);
        setPool({ status: 'error' });
      }
    },
    [shopId]
  );

  // Abort on cleanup: a stale response must not overwrite a newer shop's pool
  // (this also cancels the extra dev-only request from Strict Mode's double effect run)
  useEffect(() => {
    const controller = new AbortController();
    loadPool(controller.signal);
    return () => controller.abort();
  }, [loadPool]);

  useEffect(() => {
    setStats(readStoredStats(shopInfo.id));
  }, [shopInfo.id]);

  useEffect(() => {
    setTimerEnabled(readStoredTimerEnabled());
  }, []);

  const handleTimerChange = (enabled: boolean) => {
    setTimerEnabled(enabled);
    writeStoredTimerEnabled(enabled);
  };

  const updateStats = (updater: (prev: SessionStats) => SessionStats) => {
    setStats((prev) => {
      const next = updater(prev);
      writeStoredStats(shopInfo.id, next);
      return next;
    });
  };

  const refresh = useCallback(async () => {
    if (pool.status !== 'ready') return;

    const refreshId = ++refreshIdRef.current;
    shownAtRef.current = null;
    setResult(null);
    setItems(null);
    setLoading(true);

    const pending = nextRestockRef.current ?? prepareRestock(pool.items, shopId);
    nextRestockRef.current = null;

    const [restock] = await Promise.all([pending, wait(randomLoadDelay())]);

    // a newer refresh started while this one was loading
    if (refreshId !== refreshIdRef.current) return;

    flushSync(() => {
      setItems(restock);
      setLoading(false);
    });

    // start the clock on the frame the grid gets painted, not when the refresh started
    requestAnimationFrame((frameTime) => {
      if (refreshId === refreshIdRef.current) shownAtRef.current = frameTime;
    });

    nextRestockRef.current = prepareRestock(pool.items, shopId);
  }, [pool, shopId]);

  const handleItemClick = (item: PracticeStockedItem, clickTime: number) => {
    const shownAt = shownAtRef.current;
    if (shownAt === null || !items) return;
    shownAtRef.current = null;

    const reactionMs = isTimerEnabled ? Math.max(0, clickTime - shownAt) : null;
    // only items that actually profit count as "missed", even when the pick lost money
    const pickedProfit = Math.max(item.profit ?? 0, 0);
    const missed = items
      .filter((other) => other.id !== item.id && (other.profit ?? 0) > pickedProfit)
      .sort((a, b) => (b.profit ?? 0) - (a.profit ?? 0));

    // same "worth buying" bar as the restock shop page; below it the right move is to refresh
    const hasProfitableItems = items.some((other) => (other.profit ?? 0) >= INITIAL_MIN_PROFIT);
    const isBestPick = hasProfitableItems && item.profit !== null && missed.length === 0;

    setResult({
      reactionMs,
      picked: item,
      missed: missed.slice(0, MAX_MISSED_ITEMS),
      isBestPick,
      hasProfitableItems,
    });

    updateStats((prev) => ({
      attempts: prev.attempts + 1,
      bestPicks: prev.bestPicks + (isBestPick ? 1 : 0),
      ...(reactionMs === null
        ? { timedAttempts: prev.timedAttempts, totalMs: prev.totalMs, bestMs: prev.bestMs }
        : {
            timedAttempts: prev.timedAttempts + 1,
            totalMs: prev.totalMs + reactionMs,
            bestMs: prev.bestMs === null ? reactionMs : Math.min(prev.bestMs, reactionMs),
          }),
    }));
  };

  // F5 / Ctrl+R refresh the simulated shop instead of the page
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isRefreshKey =
        e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r');
      if (!isRefreshKey) return;
      e.preventDefault();
      if (!e.repeat) refresh();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [refresh]);

  const formatMs = (ms: number | null) =>
    ms === null ? '-' : t('Restock.practice-ms', { x: format.number(Math.round(ms)) });

  const hasStarted = items !== null || isLoading;

  return (
    <Stack gap={4} w="100%">
      <HStack justify="center" gap={{ base: 2, md: 4 }} flexWrap="wrap">
        <StatBox label={t('Restock.practice-attempts')} value={format.number(stats.attempts)} />
        {isTimerEnabled && (
          <>
            <StatBox
              label={t('Restock.practice-avg-reaction')}
              value={formatMs(stats.timedAttempts ? stats.totalMs / stats.timedAttempts : null)}
            />
            <StatBox label={t('Restock.practice-best-reaction')} value={formatMs(stats.bestMs)} />
          </>
        )}
        <StatBox
          label={t('Restock.practice-best-pick-rate')}
          value={
            stats.attempts
              ? format.number(stats.bestPicks / stats.attempts, { style: 'percent' })
              : '-'
          }
        />
        <Button
          size="sm"
          variant="subtle"
          onClick={() => updateStats(() => INITIAL_STATS)}
          disabled={!stats.attempts}
        >
          {t('Restock.practice-reset')}
        </Button>
      </HStack>

      <HStack justify="center" gap={4} flexWrap="wrap">
        <HStack gap={2}>
          <Badge colorPalette="orange">Beta</Badge>
          <Text textAlign="center" fontSize="sm" color="whiteAlpha.700">
            {t('Restock.practice-refresh-hint')}
          </Text>
        </HStack>
        <Switch.Root
          size="sm"
          checked={isTimerEnabled}
          onCheckedChange={({ checked }) => handleTimerChange(!!checked)}
        >
          <Switch.HiddenInput />
          <Switch.Control />
          <Switch.Label fontSize="sm">{t('Restock.practice-timer')}</Switch.Label>
        </Switch.Root>
      </HStack>

      <NeoShopFrame
        shop={shopInfo}
        items={isLoading ? null : items}
        onItemClick={handleItemClick}
        onRefresh={refresh}
        placeholder={
          !hasStarted && (
            <Center flexDirection="column" gap={3} py="60px" px={4} textAlign="center">
              <Text fontSize="11pt">{t('Restock.practice-description')}</Text>
              {pool.status === 'loading' && <Spinner />}
              {pool.status === 'error' && (
                <>
                  <Text fontSize="11pt" color="red.600">
                    {t('General.something-went-wrong-please-try-again-later')}
                  </Text>
                  <Button onClick={() => loadPool()}>{t('Restock.practice-retry')}</Button>
                </>
              )}
              {pool.status === 'ready' && (
                <Button colorPalette="green" onClick={refresh}>
                  {t('Restock.practice-start')}
                </Button>
              )}
            </Center>
          )
        }
      />

      <PracticeResultModal result={result} onNext={refresh} />
    </Stack>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <Box bg="blackAlpha.400" borderRadius="md" px={3} py={2} minW="110px" textAlign="center">
      <Text fontSize="xs" color="whiteAlpha.700">
        {label}
      </Text>
      <Text fontSize="lg" fontWeight="bold">
        {value}
      </Text>
    </Box>
  );
}
