import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  Icon,
  Image,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { LuArrowRight, LuExternalLink } from 'react-icons/lu';
import MainLink from '@components/Utils/MainLink';
import type { LinkedListModalProps } from '@components/DynamicLists/LinkedListModal';
import { useAuth } from '@utils/auth';
import { useLists } from '@utils/useLists';
import { GOAL_SIZES, goalSampleImagePath } from '@utils/goalCounter/config';
import type { GoalCounterInfo } from '@utils/goalCounter/eligibility';
import { PREVIEW_BACKGROUNDS } from '@utils/goalCounter/previewSurfaces';
import { goalCounterSample, goalCounterVariants } from '@utils/goalCounter/sample';
import { GOALS_ACCENT, GOALS_ACCENT_LIGHT, GoalCounterIcon } from '@utils/goalCounter/theme';
import type { UserList } from '@types';

const LinkedListModal = dynamic<LinkedListModalProps>(
  () => import('@components/DynamicLists/LinkedListModal'),
  { ssr: false }
);

// a few styles are enough to show what it looks like; the full picker is on the checklist
const MAX_EXAMPLES = 3;
const STEPS = ['info-step-1', 'info-step-2', 'info-step-3'] as const;

export type GoalCounterInfoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** The official album page or collection list */
  list: UserList;
  goalCounter: GoalCounterInfo;
};

/**
 * Shown on official album/collection lists: the goal counter belongs to the user's checklist,
 * so this explains it and leads to that checklist (or creates one).
 */
const GoalCounterInfoModal = (props: GoalCounterInfoModalProps) => {
  const t = useTranslations();
  const { isOpen, onClose, list, goalCounter } = props;
  const { user, openLogin } = useAuth();
  const { lists, isLoading } = useLists();
  const [isOpenLinked, setOpenLinked] = useState(false);
  const isCollection = goalCounter.kind === 'collection';
  const sample = goalCounterSample(goalCounter);
  const examples = goalCounterVariants(goalCounter).slice(0, MAX_EXAMPLES);

  // most recently updated checklist of this list
  const checklist = useMemo(
    () =>
      lists
        .filter((l) => l.linkedListId === list.internal_id)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0],
    [lists, list.internal_id]
  );

  const createChecklist = () => {
    window.umami?.track('goal-counter-info-create', { label: sample, auth: String(!!user) });
    if (!user) {
      onClose();
      openLogin('checklist', { trigger: 'goal-counter-info' });
      return;
    }
    setOpenLinked(true);
  };

  return (
    <>
      {isOpenLinked && (
        <LinkedListModal isOpen={isOpenLinked} onClose={() => setOpenLinked(false)} list={list} />
      )}
      <Dialog.Root
        open={isOpen}
        onOpenChange={({ open }) => {
          if (!open) onClose();
        }}
        placement="center"
        size="lg"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <HStack gap={3}>
                  <Image src={goalCounter.image} alt="" w="50px" h="50px" borderRadius="md" />
                  <Box>
                    <Dialog.Title fontSize="lg" fontWeight="bold">
                      <HStack gap={2}>
                        <Icon as={GoalCounterIcon} color={GOALS_ACCENT_LIGHT} />
                        {t('GoalCounter.title')}
                      </HStack>
                    </Dialog.Title>
                    <Text fontSize="sm" color="whiteAlpha.700">
                      {goalCounter.name}
                    </Text>
                  </Box>
                </HStack>
              </Dialog.Header>
              <Dialog.Body>
                <Text fontSize="sm" mb={4}>
                  {t(
                    isCollection
                      ? 'GoalCounter.info-description-collection'
                      : 'GoalCounter.info-description-stamps'
                  )}
                </Text>

                <Flex
                  gap={3}
                  flexWrap="wrap"
                  align="center"
                  justify="center"
                  borderRadius="md"
                  p={4}
                  mb={5}
                  css={PREVIEW_BACKGROUNDS.lookup}
                >
                  {examples.map((variant) => {
                    const [w, h] = GOAL_SIZES[variant];
                    return (
                      <Image
                        key={variant}
                        src={goalSampleImagePath(sample, { variant, bg: 'transparent' })}
                        alt={t(`GoalCounter.variant-${variant}`)}
                        width={`${w}px`}
                        height={`${h}px`}
                        loading="lazy"
                      />
                    );
                  })}
                </Flex>

                <Text fontSize="sm" fontWeight="bold" mb={2}>
                  {t('GoalCounter.info-how')}
                </Text>
                <VStack align="stretch" gap={2}>
                  {STEPS.map((step, i) => (
                    <HStack key={step} align="flex-start" gap={3}>
                      <Flex
                        boxSize="22px"
                        borderRadius="full"
                        bg={GOALS_ACCENT}
                        color="white"
                        fontSize="xs"
                        fontWeight="bold"
                        align="center"
                        justify="center"
                        flexShrink={0}
                      >
                        {i + 1}
                      </Flex>
                      <Text fontSize="sm" color="gray.300">
                        {t(`GoalCounter.${step}`)}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Dialog.Body>
              <Dialog.Footer justifyContent="space-between" flexWrap="wrap" gap={2}>
                <Button asChild variant="ghost" size="sm" color={GOALS_ACCENT_LIGHT}>
                  <MainLink
                    href="/tools/goals"
                    target="_blank"
                    prefetch={false}
                    trackEvent="goal-counter-info-learn-more"
                    trackEventLabel={sample}
                  >
                    {t('GoalCounter.info-learn-more')}
                    <LuExternalLink />
                  </MainLink>
                </Button>
                {checklist && user?.username ? (
                  <Button
                    asChild
                    size="sm"
                    bg={GOALS_ACCENT}
                    color="white"
                    _hover={{ opacity: 0.9 }}
                  >
                    <MainLink
                      href={`/lists/${user.username}/${checklist.internal_id}`}
                      prefetch={false}
                      trackEvent="goal-counter-info-open-checklist"
                      trackEventLabel={sample}
                    >
                      {t('GoalCounter.info-open-checklist')}
                      <LuArrowRight />
                    </MainLink>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    bg={GOALS_ACCENT}
                    color="white"
                    _hover={{ opacity: 0.9 }}
                    onClick={createChecklist}
                    loading={!!user && isLoading}
                  >
                    {t('General.create-checklist')}
                  </Button>
                )}
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
};

export default GoalCounterInfoModal;
