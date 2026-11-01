'use client';

import { Box, Button, Flex, HStack, Icon, Image, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { LuExternalLink } from 'react-icons/lu';
import MainLink from '@components/Utils/MainLink';
import { GOAL_SIZES, goalSampleImagePath } from '@utils/goalCounter/config';
import type { GoalCounterInfo } from '@utils/goalCounter/eligibility';
import { PREVIEW_BACKGROUNDS } from '@utils/goalCounter/previewSurfaces';
import { goalCounterPreviewConfig, goalCounterSample } from '@utils/goalCounter/sample';
import { GOALS_ACCENT_LIGHT, GoalCounterIcon, goalsAccentAlpha } from '@utils/goalCounter/theme';

/**
 * Shown under the submit button when the import goes into a checklist of an album page or
 * collection that can have a goal counter (the counter itself lives on the list page).
 */
export function ImportGoalCounterCard({ goalCounter }: { goalCounter: GoalCounterInfo }) {
  const t = useTranslations();
  const isCollection = goalCounter.kind === 'collection';
  const sample = goalCounterSample(goalCounter);
  const config = goalCounterPreviewConfig(goalCounter);
  const [w, h] = GOAL_SIZES[config.variant];

  return (
    <Box
      borderRadius="md"
      borderWidth="1px"
      borderColor={goalsAccentAlpha(0.45)}
      bg={goalsAccentAlpha(0.12)}
      p={2.5}
    >
      <HStack gap={1.5} mb={1.5}>
        <Icon as={GoalCounterIcon} color={GOALS_ACCENT_LIGHT} boxSize={3.5} />
        <Text fontSize="xs" fontWeight="bold" color={GOALS_ACCENT_LIGHT}>
          {t('GoalCounter.import-cta-title')}
        </Text>
      </HStack>
      <Text fontSize="xs" color="whiteAlpha.800" lineHeight="short" mb={2}>
        {t(isCollection ? 'GoalCounter.import-cta-collection' : 'GoalCounter.import-cta-stamps')}
      </Text>
      <Flex
        align="center"
        justify="center"
        borderRadius="md"
        p={2}
        css={PREVIEW_BACKGROUNDS.lookup}
      >
        <Image
          src={goalSampleImagePath(sample, config)}
          alt=""
          width={`${w}px`}
          height={`${h}px`}
          loading="lazy"
        />
      </Flex>
      <Button asChild size="2xs" variant="ghost" mt={1.5} w="100%" color={GOALS_ACCENT_LIGHT}>
        <MainLink
          href="/tools/goals"
          target="_blank"
          prefetch={false}
          trackEvent="import-v2-goal-counter-cta"
          trackEventLabel={sample}
        >
          {t('GoalCounter.import-cta-button')}
          <LuExternalLink />
        </MainLink>
      </Button>
    </Box>
  );
}
