'use client';

import { Badge, Box, Flex, Heading, Icon, Link, SimpleGrid, Text } from '@chakra-ui/react';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';
import { LuExternalLink } from 'react-icons/lu';
import DynamicIcon from '@assets/icons/dynamic.png';
import logoIcon from '@assets/logo_icon.svg';
import HeaderCard from '@components/Card/HeaderCard';
import {
  checklistPages,
  inventoryPages,
  PRICE_CHECKER_SCRIPT_URL,
  TAMPERMONKEY_URL,
  type PriceCheckerPage,
} from '@app/[locale]/tools/price-checker/priceCheckerPages';

const ACCENT = '#e9a23b';

const SETUP_STEPS = ['step-1', 'step-2'] as const;
const USAGE_STEPS = ['step-3', 'step-4', 'step-5'] as const;

type StepKey = (typeof SETUP_STEPS)[number] | (typeof USAGE_STEPS)[number];

function stepHref(step: StepKey) {
  return step === 'step-1' ? TAMPERMONKEY_URL : PRICE_CHECKER_SCRIPT_URL;
}

/** Visual stand-in for the userscript button (matches ImportInfo). */
function ImportButtonPreview() {
  return (
    <Box
      display="inline-flex"
      alignItems="center"
      bg="#2D3748"
      borderRadius="3px"
      gap="5px"
      p="5px"
      justifyContent="center"
      verticalAlign="middle"
    >
      <NextImage src={logoIcon} alt="itemdb logo" width={25} quality={100} />
      <Text as="span" fontSize="sm">
        Import or Price Check with itemdb
      </Text>
    </Box>
  );
}

export function PriceCheckerPageClient() {
  const t = useTranslations('PriceChecker');
  const tAll = useTranslations();

  const getPageLabel = (page: PriceCheckerPage) =>
    tAll(`${page.labelNamespace}.${page.labelKey}` as Parameters<typeof tAll>[0]);

  const renderStepBody = (step: StepKey) =>
    t.rich(step, {
      Link: (chunks) => (
        <Link href={stepHref(step)} target="_blank" rel="noopener noreferrer" fontWeight="semibold">
          {chunks}
        </Link>
      ),
      ImportButton: () => <ImportButtonPreview />,
    });

  const renderPageCard = (page: PriceCheckerPage) => {
    const label = getPageLabel(page);
    const textColor = page.isChecklist ? undefined : 'white';
    const mutedColor = page.isChecklist ? 'gray.400' : 'whiteAlpha.900';

    return (
      <Box
        key={page.id}
        asChild
        w="full"
        borderWidth="1px"
        borderColor={page.isChecklist ? 'rgba(233, 162, 59, 0.34)' : 'whiteAlpha.200'}
        borderRadius="lg"
        bg={page.isChecklist ? 'rgba(233, 162, 59, 0.06)' : 'whiteAlpha.50'}
        transition="transform 160ms ease, border-color 160ms ease, background 160ms ease"
        _hover={{
          transform: 'translateY(-2px)',
          borderColor: page.isChecklist ? 'rgba(233, 162, 59, 0.72)' : 'whiteAlpha.400',
          bg: page.isChecklist ? 'rgba(233, 162, 59, 0.11)' : 'whiteAlpha.100',
          textDecoration: 'none',
        }}
      >
        <Link
          href={page.href}
          target="_blank"
          rel="noopener noreferrer"
          color={page.isChecklist ? 'inherit' : 'white'}
          w="full"
          _hover={{ color: page.isChecklist ? 'inherit' : 'white', textDecoration: 'none' }}
        >
          <Flex align="stretch" gap={3} p={3} w="full">
            <Box
              flexShrink={0}
              boxSize="72px"
              borderRadius="md"
              overflow="hidden"
              bg="blackAlpha.400"
              display="flex"
              alignItems="center"
              justifyContent="center"
              p={2}
            >
              <NextImage
                src={page.imageSrc}
                alt=""
                width={56}
                height={56}
                style={{ width: '56px', height: '56px', objectFit: 'contain' }}
              />
            </Box>

            <Flex direction="column" flex="1" minW={0} justify="center" gap={1}>
              <Flex align="flex-start" justify="space-between" gap={2}>
                <Heading as="h4" size="sm" lineHeight="1.25" color={textColor}>
                  {label}
                </Heading>
                <Icon
                  as={LuExternalLink}
                  color={page.isChecklist ? 'whiteAlpha.400' : 'white'}
                  boxSize={3.5}
                  mt={0.5}
                  flexShrink={0}
                />
              </Flex>
              {page.noteKey ? (
                <Text fontSize="xs" color={mutedColor} lineHeight="1.45">
                  {t(page.noteKey as Parameters<typeof t>[0])}
                </Text>
              ) : (
                <Text fontSize="xs" color={mutedColor} truncate>
                  {page.href.replace('https://www.neopets.com', '')}
                </Text>
              )}
            </Flex>
          </Flex>
        </Link>
      </Box>
    );
  };

  return (
    <>
      <HeaderCard
        color={ACCENT}
        image={{
          src: 'https://images.neopets.com/items/mall_priceguide.gif',
          alt: t('title'),
        }}
      >
        <Heading as="h1" size="lg">
          {t('title')}
        </Heading>
        <Text fontSize={{ base: 'sm', md: undefined }}>{t('description')}</Text>
      </HeaderCard>

      <Flex direction="column" gap={{ base: 8, md: 10 }} w="full" maxW="1100px">
        <Box css={{ '& a': { color: '#f0c27a' } }}>
          <Heading as="h2" size="lg" mb={1}>
            {t('how-it-works')}
          </Heading>
          <Text color="gray.400" fontSize="sm" mb={5} maxW="560px">
            {t('how-it-works-description')}
          </Text>

          <Flex direction={{ base: 'column', lg: 'row' }} gap={4} align="stretch">
            <Box
              flex={{ lg: '0 0 340px' }}
              borderWidth="1px"
              borderColor="whiteAlpha.200"
              borderRadius="xl"
              bg="whiteAlpha.50"
              p={{ base: 4, md: 5 }}
            >
              <Text
                fontSize="xs"
                fontWeight="bold"
                letterSpacing="0.12em"
                textTransform="uppercase"
                color="orange.300"
                mb={4}
              >
                {t('setup-once')}
              </Text>
              <Flex direction="column">
                {SETUP_STEPS.map((step, index) => (
                  <Flex key={step} gap={3} align="stretch">
                    <Flex direction="column" align="center" flexShrink={0}>
                      <Flex
                        boxSize="32px"
                        borderRadius="full"
                        align="center"
                        justify="center"
                        bg="orange.400"
                        color="gray.950"
                        fontSize="sm"
                        fontWeight="bold"
                      >
                        {index + 1}
                      </Flex>
                      {index < SETUP_STEPS.length - 1 ? (
                        <Box flex="1" w="2px" bg="whiteAlpha.300" my={1} minH="18px" />
                      ) : null}
                    </Flex>
                    <Box pb={index < SETUP_STEPS.length - 1 ? 5 : 0} pt={0.5}>
                      <Heading as="h3" size="sm" mb={1}>
                        {t(`${step}-title` as Parameters<typeof t>[0])}
                      </Heading>
                      <Text as="div" fontSize="sm" color="gray.400" lineHeight="1.55">
                        {renderStepBody(step)}
                      </Text>
                    </Box>
                  </Flex>
                ))}
              </Flex>
            </Box>

            <Box
              flex="1"
              borderWidth="1px"
              borderColor="rgba(233, 162, 59, 0.35)"
              borderRadius="xl"
              bg="linear-gradient(160deg, rgba(233, 162, 59, 0.12), rgba(233, 162, 59, 0.03))"
              p={{ base: 4, md: 5 }}
            >
              <Text
                fontSize="xs"
                fontWeight="bold"
                letterSpacing="0.12em"
                textTransform="uppercase"
                color="orange.300"
                mb={4}
              >
                {t('every-check')}
              </Text>
              <Flex direction={{ base: 'column', md: 'row' }} align="stretch">
                {USAGE_STEPS.map((step, index) => (
                  <Flex
                    key={step}
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
                        bg="rgba(233, 162, 59, 0.35)"
                      />
                    ) : null}
                    <Flex direction={{ base: 'column', md: 'row' }} align="center" flexShrink={0}>
                      <Flex
                        boxSize="32px"
                        borderRadius="full"
                        align="center"
                        justify="center"
                        bg="orange.400"
                        color="gray.950"
                        fontSize="sm"
                        fontWeight="bold"
                        position="relative"
                        zIndex={1}
                      >
                        {index + 3}
                      </Flex>
                      {index < USAGE_STEPS.length - 1 ? (
                        <Box
                          display={{ base: 'block', md: 'none' }}
                          flex="1"
                          w="2px"
                          bg="rgba(233, 162, 59, 0.35)"
                          my={1}
                          minH="18px"
                        />
                      ) : null}
                    </Flex>
                    <Box pt={{ md: 1 }} flex="1">
                      <Heading as="h3" size="sm" mb={1}>
                        {t(`${step}-title` as Parameters<typeof t>[0])}
                      </Heading>
                      <Text as="div" fontSize="sm" color="gray.300" lineHeight="1.55">
                        {renderStepBody(step)}
                      </Text>
                    </Box>
                  </Flex>
                ))}
              </Flex>
            </Box>
          </Flex>
        </Box>

        <Box>
          <Text
            color="orange.300"
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="0.14em"
            textTransform="uppercase"
          >
            {t('choose-source')}
          </Text>
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            justify="space-between"
            align={{ base: 'flex-start', sm: 'flex-end' }}
            gap={2}
            mt={1}
            mb={4}
          >
            <Heading as="h2" size="lg">
              {t('inventory-pages')}
            </Heading>
            <Text color="gray.400" fontSize="sm">
              {t('choose-source-description')}
            </Text>
          </Flex>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={3}>
            {inventoryPages.map(renderPageCard)}
          </SimpleGrid>
        </Box>

        <Box
          borderRadius="xl"
          borderWidth="1px"
          borderColor="rgba(233, 162, 59, 0.24)"
          bg="linear-gradient(145deg, rgba(233, 162, 59, 0.09), rgba(233, 162, 59, 0.025))"
          p={{ base: 4, md: 5 }}
        >
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            justify="space-between"
            align={{ base: 'flex-start', sm: 'center' }}
            gap={3}
            mb={4}
          >
            <Flex align="center" gap={3}>
              <Flex
                boxSize="38px"
                borderRadius="md"
                align="center"
                justify="center"
                bg="rgba(233, 162, 59, 0.18)"
              >
                <NextImage src={DynamicIcon} alt="" width={12} style={{ height: 'auto' }} />
              </Flex>
              <Box>
                <Heading as="h2" size="lg">
                  {t('checklist-pages')}
                </Heading>
                <Text color="gray.400" fontSize="sm" mt={0.5}>
                  {t('dynamic-list-hint')}
                </Text>
              </Box>
            </Flex>
            <Badge colorPalette="orange" variant="subtle" size="sm">
              {t('checklist-count', { count: checklistPages.length })}
            </Badge>
          </Flex>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={3}>
            {checklistPages.map(renderPageCard)}
          </SimpleGrid>
        </Box>
      </Flex>
    </>
  );
}
