'use client';

import { Badge, Box, Flex, Heading, Icon, Link, SimpleGrid, Tabs, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import {
  LuCircleCheck,
  LuDownload,
  LuListChecks,
  LuMousePointerClick,
  LuPencil,
  LuRefreshCw,
  LuSparkles,
} from 'react-icons/lu';
import MainLink from '@components/Utils/MainLink';
import { useScriptStatus } from '@utils/scriptUtils';
import { StepNumber } from '@app/[locale]/tools/price-checker/PriceCheckerHowItWorks';
import {
  PRICE_CHECKER_SCRIPT_URL,
  TAMPERMONKEY_URL,
} from '@app/[locale]/tools/price-checker/priceCheckerPages';

/** `generic`: any collection (import page). `stamps`: Stamp Album category page. */
export type ChecklistGuideVariant = 'generic' | 'stamps';

const b = (chunks: ReactNode) => <b>{chunks}</b>;

/** The edge over static checklists: they follow the source list on their own */
export function ChecklistAutoUpdateBanner({
  accent,
  variant,
}: {
  accent: string;
  variant: ChecklistGuideVariant;
}) {
  const t = useTranslations('ChecklistGuide');

  return (
    <Flex
      gap={3}
      align="center"
      p={{ base: 3, md: 4 }}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={`${accent}66`}
      bg={`${accent}14`}
    >
      <Flex
        boxSize="40px"
        flexShrink={0}
        borderRadius="full"
        align="center"
        justify="center"
        bg={`${accent}33`}
      >
        <Icon as={LuRefreshCw} color={accent} boxSize={5} />
      </Flex>
      <Box>
        <Text fontWeight="bold" fontSize="sm">
          {t('auto-title')}
        </Text>
        <Text fontSize="sm" color="gray.300" lineHeight="1.5">
          {t(`auto-${variant}`)}
        </Text>
      </Box>
    </Flex>
  );
}

/** Most "my script doesn't work" cases: the browser blocks userscripts until an extra setting */
export function TampermonkeyExtraStep({ trackFrom }: { trackFrom: string }) {
  const t = useTranslations('ChecklistGuide');

  return (
    <Text as="span" display="block" fontSize="xs" color="gray.400">
      {t.rich('extra-step', {
        Link: (chunks) => (
          <MainLink
            viaNextLink
            prefetch={false}
            href="/articles/help-my-scripts-are-not-working"
            trackEvent="checklist-guide-link"
            trackEventLabel={`${trackFrom}:tampermonkey-extra-step`}
          >
            <Text as="span" textDecoration="underline">
              {chunks}
            </Text>
          </MainLink>
        ),
      })}
    </Text>
  );
}

type Step = { key: string; icon: IconType; title: string; body: ReactNode; done?: boolean };

function StepList({ steps }: { steps: Step[] }) {
  return (
    <SimpleGrid columns={{ base: 1, md: steps.length }} gap={3}>
      {steps.map((step, i) => (
        <Flex
          key={step.key}
          direction="column"
          gap={2}
          p={4}
          borderRadius="lg"
          bg="blackAlpha.300"
          borderWidth="1px"
          borderColor={step.done ? 'green.700' : 'whiteAlpha.100'}
        >
          <Flex align="center" gap={2}>
            {step.done ? (
              <Icon as={LuCircleCheck} boxSize="32px" color="green.300" />
            ) : (
              <StepNumber n={i + 1} />
            )}
            <Icon as={step.icon} color="gray.400" />
          </Flex>
          <Heading as="h4" size="sm">
            {step.title}
          </Heading>
          <Text as="div" fontSize="sm" color="gray.300" lineHeight="1.55">
            {step.body}
          </Text>
        </Flex>
      ))}
    </SimpleGrid>
  );
}

/** How to fill a checklist: with the List Importer, or by hand without any script */
export function ChecklistHowToTabs({
  variant,
  trackFrom,
}: {
  variant: ChecklistGuideVariant;
  /** Umami label prefix, e.g. `import-page` */
  trackFrom: string;
}) {
  const t = useTranslations('ChecklistGuide');
  const { scriptStatus } = useScriptStatus();
  const status = scriptStatus?.itemdb_listImporter?.status;

  const scriptLink = (chunks: ReactNode) => (
    <Link
      href={PRICE_CHECKER_SCRIPT_URL}
      target="_blank"
      rel="noopener noreferrer"
      fontWeight="semibold"
      textDecoration="underline"
      onClick={() =>
        window.umami?.track('checklist-guide-link', { label: `${trackFrom}:install-script` })
      }
    >
      {chunks}
    </Link>
  );

  const installStep: Step =
    status === 'ok'
      ? {
          key: 'install',
          icon: LuDownload,
          done: true,
          title: t('installed-title'),
          body: t('installed'),
        }
      : {
          key: 'install',
          icon: LuDownload,
          title: status === 'outdated' ? t('outdated-title') : t('install-title'),
          body: (
            <Flex direction="column" gap={2}>
              <Text as="span">
                {status === 'outdated'
                  ? t.rich('outdated', { ScriptLink: scriptLink })
                  : t.rich('install', {
                      ScriptLink: scriptLink,
                      TampermonkeyLink: (chunks) => (
                        <Link
                          href={TAMPERMONKEY_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          fontWeight="semibold"
                          textDecoration="underline"
                          onClick={() =>
                            window.umami?.track('checklist-guide-link', {
                              label: `${trackFrom}:tampermonkey`,
                            })
                          }
                        >
                          {chunks}
                        </Link>
                      ),
                    })}
              </Text>
              {status !== 'outdated' && <TampermonkeyExtraStep trackFrom={trackFrom} />}
            </Flex>
          ),
        };

  const withScript: Step[] = [
    installStep,
    {
      key: 'open',
      icon: LuMousePointerClick,
      title: t('open-title'),
      body: t.rich(`open-${variant}`, { b }),
    },
    {
      key: 'create',
      icon: LuSparkles,
      title: t('create-title'),
      body: (
        <Flex direction="column" gap={2}>
          <Text as="span">{t.rich('create', { b })}</Text>
          <Text as="span" fontSize="xs" color="gray.400">
            {t.rich(`create-note-${variant}`, { b })}
          </Text>
        </Flex>
      ),
    },
    {
      key: 'collect',
      icon: LuListChecks,
      title: t('collect-title'),
      body: t.rich(`collect-${variant}`, { b }),
    },
  ];

  const withoutScript: Step[] = [
    {
      key: 'create',
      icon: LuSparkles,
      title: t('manual-create-title'),
      body: t.rich(`manual-create-${variant}`, {
        b,
        Link: (chunks) => (
          <MainLink
            viaNextLink
            prefetch={false}
            href="/lists/official"
            trackEvent="checklist-guide-link"
            trackEventLabel={`${trackFrom}:official-lists`}
          >
            <Text as="span" fontWeight="semibold" textDecoration="underline">
              {chunks}
            </Text>
          </MainLink>
        ),
      }),
    },
    {
      key: 'select',
      icon: LuPencil,
      title: t('manual-edit-title'),
      body: t.rich(`manual-edit-${variant}`, { b }),
    },
    {
      key: 'collect',
      icon: LuListChecks,
      title: t('manual-collect-title'),
      body: t.rich('manual-collect', { b }),
    },
  ];

  return (
    <Tabs.Root
      defaultValue="script"
      variant="enclosed"
      fitted
      onValueChange={({ value }) =>
        window.umami?.track('checklist-guide-tab', { label: `${trackFrom}:${value}` })
      }
    >
      <Tabs.List>
        <Tabs.Trigger value="script">
          <Icon as={LuDownload} /> {t('tab-script')}
          <Badge
            size="xs"
            colorPalette="green"
            ml={1}
            display={{ base: 'none', md: 'inline-flex' }}
          >
            {t('fastest')}
          </Badge>
        </Tabs.Trigger>
        <Tabs.Trigger value="manual">
          <Icon as={LuPencil} /> {t('tab-manual')}
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="script" pt={4}>
        <StepList steps={withScript} />
      </Tabs.Content>
      <Tabs.Content value="manual" pt={4}>
        <Flex direction="column" gap={3}>
          <StepList steps={withoutScript} />
          <Text fontSize="xs" color="gray.400">
            {t('manual-note')}
          </Text>
        </Flex>
      </Tabs.Content>
    </Tabs.Root>
  );
}
