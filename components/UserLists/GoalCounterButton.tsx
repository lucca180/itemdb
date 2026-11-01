'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
  Badge,
  Button,
  CloseButton,
  Flex,
  HStack,
  Icon,
  Image,
  Popover,
  Portal,
  Text,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { GOAL_SIZES, goalSampleImagePath } from '@utils/goalCounter/config';
import type { GoalCounterInfo } from '@utils/goalCounter/eligibility';
import { PREVIEW_BACKGROUNDS } from '@utils/goalCounter/previewSurfaces';
import { goalCounterPreviewConfig, goalCounterSample } from '@utils/goalCounter/sample';
import { GoalCounterIcon, goalsAccentAlpha, goalsLightAlpha } from '@utils/goalCounter/theme';

// "New" badge + tip until the owner first interacts with the button or the tip (per browser).
// The tip is desktop only (Chakra's `md` breakpoint); on mobile only the badge shows.
// Storage can be unavailable (private mode, blocked site data): then the intro is skipped.
const INTRO_SEEN_KEY = 'goalCounter_introSeen';
const TIP_DURATION_MS = 8000;
const TIP_MEDIA_QUERY = '(min-width: 48rem)';

const listeners = new Set<() => void>();

function getIntroSeen() {
  try {
    return window.localStorage.getItem(INTRO_SEEN_KEY) === '1';
  } catch {
    return true;
  }
}

function markIntroSeen() {
  try {
    window.localStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    // storage unavailable: the intro shows again next time
  }
  listeners.forEach((l) => l());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

type GoalCounterButtonProps = {
  goalCounter: GoalCounterInfo;
  onOpen: () => void;
  /**
   * `code`: the owner's checklist (code modal, with the "New" badge + tip until first use);
   * `info`: an official list, seen by everyone (info modal, no intro)
   */
  kind: 'code' | 'info';
};

export function GoalCounterButton({ goalCounter, onOpen, kind }: GoalCounterButtonProps) {
  const t = useTranslations();
  // seen on the server, so the intro only appears after hydration
  const introSeen = useSyncExternalStore(subscribe, getIntroSeen, () => true);
  const [tipOpen, setTipOpen] = useState(true);
  // the list header renders its actions twice (mobile / desktop) and hides one with CSS:
  // only the visible copy shows the tip, and only on desktop
  const [visible, setVisible] = useState(false);
  const anchorRef = useCallback((el: HTMLDivElement | null) => {
    setVisible(!!el && el.offsetParent !== null && window.matchMedia(TIP_MEDIA_QUERY).matches);
  }, []);
  const isNew = kind === 'code' && !introSeen;
  const sample = goalCounterSample(goalCounter);
  const config = goalCounterPreviewConfig(goalCounter);
  const [w, h] = GOAL_SIZES[config.variant];

  const tipShown = isNew && tipOpen && visible;
  useEffect(() => {
    if (tipShown) window.umami?.track('goal-counter-tip-view', { label: sample });
  }, [tipShown, sample]);

  useEffect(() => {
    if (!isNew) return;
    const handle = window.setTimeout(() => setTipOpen(false), TIP_DURATION_MS);
    return () => window.clearTimeout(handle);
  }, [isNew]);

  const closeTip = () => {
    setTipOpen(false);
    markIntroSeen();
  };

  return (
    <Popover.Root
      open={tipShown}
      onOpenChange={({ open }) => {
        if (!open) setTipOpen(false);
      }}
      positioning={{ placement: 'bottom' }}
      autoFocus={false}
      lazyMount
      unmountOnExit
    >
      <Popover.Anchor ref={anchorRef} display="inline-flex">
        <Button
          size="xs"
          onClick={() => {
            if (isNew) closeTip();
            onOpen();
          }}
          bg="#f6d38b/10"
          borderColor="#f6d38b"
          color="orange.200"
          variant="surface"
          _hover={{ bg: '#f6d38b/20' }}
          boxShadow={
            `inset 0 0 0 1px ${goalsLightAlpha(0.2)}` +
            (isNew ? `, 0 0 0 3px ${goalsAccentAlpha(0.35)}` : '')
          }
          data-umami-event="goal-counter-open"
          data-umami-event-label={sample}
          data-umami-event-new={String(isNew)}
          data-umami-event-kind={kind}
        >
          <Icon as={GoalCounterIcon} />
          {t('GoalCounter.button')}
          {isNew && (
            <Badge size="xs" colorPalette="yellow" variant="solid">
              {t('GoalCounter.new-badge')}
            </Badge>
          )}
        </Button>
      </Popover.Anchor>
      <Portal>
        <Popover.Positioner>
          <Popover.Content
            w="270px"
            bg="gray.700"
            borderWidth="1px"
            borderColor={goalsAccentAlpha(0.6)}
          >
            <Popover.Body p={2.5}>
              <HStack align="flex-start" gap={2}>
                <Text fontSize="xs" color="whiteAlpha.900" lineHeight="short" flex="1">
                  {t(
                    goalCounter.kind === 'collection'
                      ? 'GoalCounter.new-tip-collection'
                      : 'GoalCounter.new-tip-stamps'
                  )}
                </Text>
                <CloseButton
                  size="2xs"
                  onClick={closeTip}
                  aria-label={t('General.close')}
                  data-umami-event="goal-counter-tip-close"
                  data-umami-event-label={sample}
                />
              </HStack>
              <Flex
                mt={2}
                p={2}
                align="center"
                justify="center"
                borderRadius="md"
                css={PREVIEW_BACKGROUNDS.lookup}
              >
                <Image
                  src={goalSampleImagePath(sample, config)}
                  alt=""
                  width={`${w}px`}
                  height={`${h}px`}
                />
              </Flex>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
