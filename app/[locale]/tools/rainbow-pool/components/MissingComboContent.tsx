import { Box, Center, Flex, Heading, Link, Text, VStack } from '@chakra-ui/react';
import { getTranslations } from 'next-intl/server';
import { createPoolBreadcrumbList, PoolBreadcrumbs } from '@components/Breadcrumbs/PoolBreadcrumbs';
import MainLink from '@components/Utils/MainLink';
import { petColorSlug } from '@utils/pet-utils';
import { buildRainbowPoolLabels } from '../buildRainbowPoolLabels';
import { RainbowPoolPicker } from './RainbowPoolPicker';
import { BASE_PATH, RainbowPoolShell } from './RainbowPoolShell';

type MissingComboContentProps = {
  locale: string;
  colorName: string;
  speciesName: string;
  colors: string[];
  species: string[];
};

export async function MissingComboContent({
  locale,
  colorName,
  speciesName,
  colors,
  species,
}: MissingComboContentProps) {
  const [t, labels] = await Promise.all([getTranslations(), buildRainbowPoolLabels()]);

  const breadcrumbList = createPoolBreadcrumbList(t, [
    { name: speciesName, item: `${BASE_PATH}/${petColorSlug(speciesName)}` },
    {
      name: `${colorName} ${speciesName}`,
      item: `${BASE_PATH}/${petColorSlug(speciesName)}/${petColorSlug(colorName)}`,
    },
  ]);

  return (
    <RainbowPoolShell>
      <PoolBreadcrumbs breadcrumbList={breadcrumbList} locale={locale} />

      <Center flexFlow="column" gap={4} textAlign="center" mt={4} mb={8} px={2}>
        <RainbowPoolPicker
          colors={colors}
          species={species}
          initialSpecies={speciesName}
          initialColor={colorName}
          selectColorLabel={labels.selectColorLabel}
          selectSpeciesLabel={labels.selectSpeciesLabel}
          searchLabel={labels.searchLabel}
        />

        <Box
          w="100%"
          maxW="560px"
          mt={4}
          p={{ base: 5, md: 6 }}
          borderRadius="xl"
          bg="blackAlpha.600"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
        >
          <VStack gap={4}>
            <VStack gap={2}>
              <Heading as="h1" size="lg">
                {t('PetColors.combination-error')}
              </Heading>
              <Text color="whiteAlpha.900" fontSize="sm" css={{ textWrap: 'pretty' }}>
                {t('PetColors.combination-error-desc', { 0: colorName, 1: speciesName })}
              </Text>
            </VStack>

            <Flex gap={2} flexWrap="wrap" justify="center">
              <Link
                asChild
                px={3}
                py={1.5}
                borderRadius="md"
                bg="blackAlpha.500"
                fontSize="sm"
                color="whiteAlpha.900"
                _hover={{ bg: 'blackAlpha.700' }}
              >
                <MainLink href={`${BASE_PATH}/${petColorSlug(speciesName)}`}>
                  {t('PetColors.all-colours-of', { 0: speciesName })}
                </MainLink>
              </Link>
              <Link
                asChild
                px={3}
                py={1.5}
                borderRadius="md"
                bg="blackAlpha.500"
                fontSize="sm"
                color="whiteAlpha.900"
                _hover={{ bg: 'blackAlpha.700' }}
              >
                <MainLink href={`${BASE_PATH}/${petColorSlug(colorName)}`}>
                  {t('PetColors.all-pets-of', { 0: colorName })}
                </MainLink>
              </Link>
            </Flex>

            <Text fontSize="sm">
              <Link asChild color="teal.200">
                <MainLink href={BASE_PATH}>{labels.toolTitle}</MainLink>
              </Link>
            </Text>
          </VStack>
        </Box>
      </Center>
    </RainbowPoolShell>
  );
}
