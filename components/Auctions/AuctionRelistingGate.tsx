'use client';

import { Box, Button, CloseButton, Flex, HStack, Icon, Progress, Text } from '@chakra-ui/react';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { LuLock } from 'react-icons/lu';
import MainLink from '@components/Utils/MainLink';
import type { ContributeWallData } from '@types';
import { useAuth } from '@utils/auth';

// Tells which wall drove a landing; every wall shares utm_content=cta-wall.
const VOTE_HREF = '/feedback/vote?utm_content=cta-wall&utm_term=auction-relisting';
const PRICE_HREF = '/feedback/trades?utm_content=cta-wall&utm_term=auction-relisting';

const VIEWED_KEY = 'relisting-gate-viewed';
const viewedItems = new Set<number>();

/** Tracks `relisting-gate-view` once per item per browser session, not on every expand. */
function trackGateView(itemId: number, count: number) {
  try {
    const stored: number[] = JSON.parse(sessionStorage.getItem(VIEWED_KEY) ?? '[]');
    stored.forEach((id) => viewedItems.add(id));
  } catch {}

  if (viewedItems.has(itemId)) return;
  viewedItems.add(itemId);

  try {
    sessionStorage.setItem(VIEWED_KEY, JSON.stringify([...viewedItems]));
  } catch {}

  window.umami?.track('relisting-gate-view', { count, itemId });
}

/**
 * Soft contribute gate on the auction relisting history. It only measures acceptance for
 * now: the history is still sent to the client, and closing the gate only lasts until the
 * modal closes (the modal unmounts, so it shows again on the next open).
 */
export function useAuctionRelistingGate(wall: ContributeWallData | null) {
  const [dismissed, setDismissed] = useState(false);

  const dismiss = () => {
    window.umami?.track('relisting-gate-close');
    setDismissed(true);
  };

  // A wall with nothing left to do (e.g. empty queues) can't be passed, so it doesn't gate.
  const canContribute = !!wall && (wall.needVotes > 0 || wall.needTrades > 0);

  return { gate: canContribute && !dismissed ? wall : null, dismiss };
}

type AuctionRelistingGateProps = {
  wall: ContributeWallData;
  itemId: number;
  count: number;
  onClose: () => void;
};

/** Shown in place of the relisting history: blurred placeholder rows + contribute CTAs. */
export const AuctionRelistingGate = ({
  wall,
  itemId,
  count,
  onClose,
}: AuctionRelistingGateProps) => {
  const t = useTranslations();
  const { user, openLogin } = useAuth();
  const showVote = wall.needVotes > 0;
  const showPrice = wall.needTrades > 0;

  useEffect(() => {
    trackGateView(itemId, count);
  }, []);

  return (
    <Box position="relative" whiteSpace="normal" minH={{ base: '330px', md: '230px' }}>
      {/* Placeholder rows only — the real history never renders while gated. */}
      <Flex flexFlow="column" gap={0.5} aria-hidden filter="blur(3px)" opacity={0.5}>
        {Array.from({ length: Math.min(count, 5) }, (_, i) => (
          <HStack key={i} justifyContent="space-between" px={2} py={2} bg="blackAlpha.400">
            <Box w="70px" h="10px" borderRadius="sm" bg="whiteAlpha.500" />
            <Box w="40px" h="10px" borderRadius="sm" bg="whiteAlpha.500" />
            <Box w="110px" h="10px" borderRadius="sm" bg="whiteAlpha.500" />
          </HStack>
        ))}
      </Flex>
      <Flex position="absolute" inset={0} alignItems="center" p={2}>
        {/* Sticky + container width keep the card in view when the table scrolls sideways (mobile). */}
        <Flex
          position="sticky"
          left={0}
          w="calc(100cqi - 40px)"
          minW="min(100%, 260px)"
          maxW="100%"
          justifyContent="center"
        >
          <Flex
            flexFlow="column"
            gap={2}
            bg="gray.800"
            p={3}
            borderRadius="md"
            boxShadow="lg"
            maxW="380px"
            w="100%"
            position="relative"
          >
            <CloseButton
              size="2xs"
              position="absolute"
              top={1.5}
              right={1.5}
              color="whiteAlpha.600"
              aria-label={t('ItemPage.relisting-gate-close')}
              onClick={onClose}
            />
            <Text fontSize="xs" fontWeight="semibold" pe={6}>
              <Icon as={LuLock} boxSize={3} mr={1} />
              {t('ItemPage.relisting-gate-title', { count })}
            </Text>
            <Text fontSize="xs" color="whiteAlpha.800">
              {t.rich('ItemPage.relisting-gate-text', {
                b: (chunk) => <b>{chunk}</b>,
              })}
            </Text>
            {/* Contributing needs an account, so logged-out users get a login prompt instead. */}
            {!user && (
              <HStack gap={3}>
                <Text fontSize="xs" color="whiteAlpha.700" flex={1}>
                  {t('ItemPage.relisting-gate-login-text')}
                </Text>
                <Button
                  size="xs"
                  colorPalette="green"
                  variant="surface"
                  flexShrink={0}
                  minW="88px"
                  onClick={() => openLogin('auction-relisting', { trigger: 'relisting-gate' })}
                >
                  {t('ItemPage.relisting-gate-login')}
                </Button>
              </HStack>
            )}
            {user && showVote && (
              <GateOption
                label={t('ItemPage.relisting-gate-vote-label')}
                cta={t('ItemPage.relisting-gate-vote')}
                href={VOTE_HREF}
                trackEvent="relisting-gate-vote"
                need={wall.needVotes}
                goal={wall.voteGoal}
              />
            )}
            {user && showVote && showPrice && (
              <HStack gap={2} color="whiteAlpha.500" fontSize="2xs" textTransform="uppercase">
                <Box flex={1} borderTopWidth="1px" borderColor="whiteAlpha.200" />
                {t('ItemPage.relisting-gate-or')}
                <Box flex={1} borderTopWidth="1px" borderColor="whiteAlpha.200" />
              </HStack>
            )}
            {user && showPrice && (
              <GateOption
                label={t('ItemPage.relisting-gate-price-label')}
                cta={t('ItemPage.relisting-gate-price')}
                href={PRICE_HREF}
                trackEvent="relisting-gate-price"
                need={wall.needTrades}
                goal={wall.tradeGoal}
              />
            )}
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
};

type GateOptionProps = {
  label: string;
  cta: string;
  href: string;
  trackEvent: string;
  need: number;
  goal: number | undefined;
};

/** One way to pass the gate: progress towards its 24h goal + a link to do it. */
const GateOption = ({ label, cta, href, trackEvent, need, goal }: GateOptionProps) => {
  const format = useFormatter();
  const done = goal ? Math.max(goal - need, 0) : null;

  return (
    <HStack gap={3} alignItems="flex-end">
      <Flex flexFlow="column" gap={1} flex={1} minW={0}>
        <HStack justifyContent="space-between" fontSize="xs">
          <Text>{label}</Text>
          {goal && done !== null && (
            <Text color="whiteAlpha.600">
              {format.number(done)}/{format.number(goal)}
            </Text>
          )}
        </HStack>
        {goal && done !== null && (
          <Progress.Root value={done} max={goal} size="xs" colorPalette="green">
            <Progress.Track bg="whiteAlpha.200">
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        )}
      </Flex>
      <Button size="xs" colorPalette="green" variant="surface" flexShrink={0} minW="88px" asChild>
        <MainLink href={href} target="_blank" trackEvent={trackEvent}>
          {cta}
        </MainLink>
      </Button>
    </HStack>
  );
};
