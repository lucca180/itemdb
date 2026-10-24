'use client';

import { Box, Flex, Heading, Link, Text } from '@chakra-ui/react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import MainLink from '@components/Utils/MainLink';
import logoIcon from '@assets/logo_icon.svg';
import { StepNumber } from '@app/[locale]/tools/price-checker/PriceCheckerHowItWorks';
import {
  PRICE_CHECKER_SCRIPT_URL,
  TAMPERMONKEY_URL,
} from '@app/[locale]/tools/price-checker/priceCheckerPages';
import {
  PRICE_CHECKER_ACCENT_LIGHT,
  PRICE_CHECKER_ACCENT_RGB,
} from '@app/[locale]/tools/price-checker/priceCheckerTheme';

const SETUP_STEPS = [
  { key: 'step-1', titleKey: 'ImportPage.step-1-title', bodyKey: 'ImportPage.step-1' },
  { key: 'step-2', titleKey: 'ImportPage.step-2-title', bodyKey: 'ImportPage.step-2' },
] as const;

const USAGE_STEPS = [
  { key: 'step-3', titleKey: 'ImportPage.step-3-title', bodyKey: 'ImportPage.step-3' },
  { key: 'step-4', titleKey: 'ImportPage.step-4-title', bodyKey: 'ImportPage.step-4' },
  { key: 'step-5', titleKey: 'ImportPage.step-5-title', bodyKey: 'ImportPage.step-5' },
] as const;

type StepKey = (typeof SETUP_STEPS)[number]['key'] | (typeof USAGE_STEPS)[number]['key'];

const eyebrowProps = {
  fontSize: 'xs',
  fontWeight: 'bold',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: PRICE_CHECKER_ACCENT_LIGHT,
  mb: 4,
} as const;

function ScriptButton() {
  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      bg="#2D3748"
      borderRadius="3px"
      gap="5px"
      p="5px"
      verticalAlign="middle"
      color="white"
      fontSize="xs"
      fontWeight="normal"
    >
      <Image src={logoIcon} alt="itemdb logo" width={22} quality={100} />
      Import or Price Check with itemdb
    </Box>
  );
}

function StepBody({ step, bodyKey }: { step: StepKey; bodyKey: `ImportPage.${StepKey}` }) {
  const t = useTranslations();

  return t.rich(bodyKey, {
    Link: (chunks) => (
      <Link
        href={step === 'step-1' ? TAMPERMONKEY_URL : PRICE_CHECKER_SCRIPT_URL}
        target="_blank"
        rel="noopener noreferrer"
        fontWeight="semibold"
        data-umami-event="import-page-setup"
        data-umami-event-label={step === 'step-1' ? 'tampermonkey' : 'install-script'}
      >
        {chunks}
      </Link>
    ),
    HelpLink: (chunks) => (
      <MainLink
        viaNextLink
        prefetch={false}
        href="/articles/help-my-scripts-are-not-working"
        trackEvent="import-page-guide"
        trackEventLabel="scripts-not-working"
      >
        <Text as="span" fontWeight="semibold">
          {chunks}
        </Text>
      </MainLink>
    ),
    ImportButton: () => <ScriptButton />,
    Small: (chunks) => (
      <Text as="span" display="block" fontSize="xs" color="gray.500" mt={1}>
        {chunks}
      </Text>
    ),
  });
}

export function ImportHowItWorks() {
  const t = useTranslations();

  return (
    <Box css={{ '& a': { color: PRICE_CHECKER_ACCENT_LIGHT } }}>
      <Heading as="h2" size="lg" mb={1}>
        {t('ImportPage.how-it-works')}
      </Heading>

      <Flex direction={{ base: 'column', lg: 'row' }} gap={4} align="stretch" mt={5}>
        <Box
          flex={{ lg: '0 0 340px' }}
          borderWidth="1px"
          borderColor="whiteAlpha.200"
          borderRadius="xl"
          bg="whiteAlpha.50"
          p={{ base: 4, md: 5 }}
        >
          <Text {...eyebrowProps}>{t('ImportPage.setup-once')}</Text>
          <Flex direction="column">
            {SETUP_STEPS.map((step, index) => (
              <Flex key={step.key} gap={3} align="stretch">
                <Flex direction="column" align="center" flexShrink={0}>
                  <StepNumber n={index + 1} />
                  {index < SETUP_STEPS.length - 1 ? (
                    <Box flex="1" w="2px" bg="whiteAlpha.300" my={1} minH="18px" />
                  ) : null}
                </Flex>
                <Box pb={index < SETUP_STEPS.length - 1 ? 5 : 0} pt={0.5}>
                  <Heading as="h3" size="sm" mb={1}>
                    {t(step.titleKey)}
                  </Heading>
                  <Text as="div" fontSize="sm" color="gray.400" lineHeight="1.55">
                    <StepBody step={step.key} bodyKey={step.bodyKey} />
                  </Text>
                </Box>
              </Flex>
            ))}
          </Flex>
        </Box>

        <Box
          flex="1"
          borderWidth="1px"
          borderColor={`rgba(${PRICE_CHECKER_ACCENT_RGB}, 0.4)`}
          borderRadius="xl"
          bg={`linear-gradient(160deg, rgba(${PRICE_CHECKER_ACCENT_RGB}, 0.14), rgba(${PRICE_CHECKER_ACCENT_RGB}, 0.03))`}
          p={{ base: 4, md: 5 }}
        >
          <Text {...eyebrowProps}>{t('ImportPage.every-import')}</Text>
          <Flex direction={{ base: 'column', md: 'row' }} align="stretch">
            {USAGE_STEPS.map((step, index) => (
              <Flex
                key={step.key}
                direction={{ base: 'row', md: 'column' }}
                flex="1"
                gap={3}
                position="relative"
                pr={{ md: index < USAGE_STEPS.length - 1 ? 5 : 0 }}
                pb={{ base: index < USAGE_STEPS.length - 1 ? 5 : 0, md: 0 }}
              >
                {index < USAGE_STEPS.length - 1 ? (
                  <Box
                    display={{ base: 'none', md: 'block' }}
                    position="absolute"
                    top="15px"
                    left="40px"
                    right="8px"
                    h="2px"
                    bg={`rgba(${PRICE_CHECKER_ACCENT_RGB}, 0.4)`}
                  />
                ) : null}
                <Flex direction={{ base: 'column', md: 'row' }} align="center" flexShrink={0}>
                  <StepNumber n={index + 3} />
                  {index < USAGE_STEPS.length - 1 ? (
                    <Box
                      display={{ base: 'block', md: 'none' }}
                      flex="1"
                      w="2px"
                      bg={`rgba(${PRICE_CHECKER_ACCENT_RGB}, 0.4)`}
                      my={1}
                      minH="18px"
                    />
                  ) : null}
                </Flex>
                <Box pt={{ md: 1 }} flex="1">
                  <Heading as="h3" size="sm" mb={1}>
                    {t(step.titleKey)}
                  </Heading>
                  <Text as="div" fontSize="sm" color="gray.300" lineHeight="1.55">
                    <StepBody step={step.key} bodyKey={step.bodyKey} />
                  </Text>
                </Box>
              </Flex>
            ))}
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
}
