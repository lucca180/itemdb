import { Button, Flex, Icon, IconButton, Progress, Skeleton, Stack, Text } from '@chakra-ui/react';
import { useFormatter, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { LuCircleCheck, LuEyeOff, LuLock } from 'react-icons/lu';
import MainLink from '@components/Utils/MainLink';
import A11yTooltip from '@components/Utils/Tooltip';
import type { ChecklistProgress } from '@utils/list/checklistProgress';

type ChecklistProgressCardProps = {
  /** `null` while the hidden items are loading */
  progress: ChecklistProgress | null;
  /** "Finishing costs approx. X NP", plus the chart button */
  cost: ReactNode;
  /** Nothing new will arrive, so a complete list can't promise it */
  sourceDeleted?: boolean;
  onHide: () => void;
};

export function ChecklistProgressCard(props: ChecklistProgressCardProps) {
  const { progress, cost, sourceDeleted, onHide } = props;
  const t = useTranslations();
  const format = useFormatter();

  if (!progress) return <Skeleton w="full" h="84px" borderRadius="lg" />;

  const { collected, total } = progress;
  const left = total - collected;
  const isComplete = left === 0;
  const isEmpty = collected === 0;

  return (
    <Stack
      w="full"
      gap={2}
      px={3}
      py={3}
      borderRadius="lg"
      bg="blackAlpha.300"
      border="1px solid"
      borderColor={isComplete ? 'green.700' : 'whiteAlpha.100'}
      textAlign="left"
    >
      <Flex justifyContent="space-between" alignItems="center" gap={2}>
        <Flex alignItems="center" columnGap={2} flexWrap="wrap" minW={0}>
          <Text fontSize="sm" fontWeight="semibold">
            {isComplete && (
              <Icon as={LuCircleCheck} color="green.300" mr={1} verticalAlign="text-bottom" />
            )}
            {isComplete
              ? t('Lists.all-collected', { total: format.number(total) })
              : t('Lists.collected-progress', {
                  collected: format.number(collected),
                  total: format.number(total),
                })}
          </Text>
          <Flex alignItems="center" gap={1} fontSize="xs" color="whiteAlpha.600">
            <Icon as={LuLock} boxSize="10px" />
            {t('Lists.only-you-see-this')}
          </Flex>
        </Flex>
        <Flex alignItems="center" gap={1} flexShrink={0}>
          <Text fontSize="sm" color="whiteAlpha.700">
            {format.number(collected / total, { style: 'percent', maximumFractionDigits: 0 })}
          </Text>
          <A11yTooltip label={t('Lists.hide-progress')}>
            <IconButton
              aria-label={t('Lists.hide-progress')}
              size="2xs"
              variant="ghost"
              color="whiteAlpha.600"
              onClick={onHide}
              data-umami-event="checklist-progress-toggle"
              data-umami-event-label="hide"
            >
              <LuEyeOff />
            </IconButton>
          </A11yTooltip>
        </Flex>
      </Flex>
      <Progress.Root
        w="full"
        size="sm"
        value={collected}
        max={total}
        colorPalette={isComplete ? 'green' : 'orange'}
        aria-label={t('Lists.collected-progress', { collected, total })}
      >
        <Progress.Track bg="whiteAlpha.200" borderRadius="full">
          <Progress.Range borderRadius="full" />
        </Progress.Track>
      </Progress.Root>
      {isComplete ? (
        !sourceDeleted && (
          <Text fontSize="xs" color="whiteAlpha.700">
            {t('Lists.collected-complete-hint')}
          </Text>
        )
      ) : (
        <Flex justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
          <Text fontSize="sm" lineHeight="1.6" color="whiteAlpha.800">
            {isEmpty ? (
              t('Lists.collected-empty-hint')
            ) : (
              <>
                {t('Lists.items-left', { count: format.number(left) })}
                {cost && <> • {cost}</>}
              </>
            )}
          </Text>
          {/* On a phone the button only earns its row while nothing is collected */}
          <Button
            asChild
            size="xs"
            variant="subtle"
            colorPalette="orange"
            display={{ base: isEmpty ? 'inline-flex' : 'none', md: 'inline-flex' }}
          >
            <MainLink href="/lists/import" trackEvent="checklist-progress-import">
              {t('Lists.import-items')}
            </MainLink>
          </Button>
        </Flex>
      )}
    </Stack>
  );
}
