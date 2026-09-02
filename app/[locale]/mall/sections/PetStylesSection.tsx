import { Suspense } from 'react';
import { Box, Flex, Separator, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
import { getTranslations } from 'next-intl/server';
import { MAIN_COLOR } from '@app/[locale]/rainbow-pool/components/RainbowPoolShell';
import { StyleTokenTile } from '@app/[locale]/rainbow-pool/pet-styles/components/StyleTokenTile';
import { loadRecentPrismaticTokens, loadRecentlyReleasedPetStyles } from '@app/server/petStyles';
import { STYLES_BASE_PATH } from '@utils/petStyles/paths';
import { MallSectionHeader } from './MallSectionHeader';

const TOKEN_LIMIT = 6;
const PRISMATIC_LIMIT = 6;
/** Same wash as the Pet Styles / Rainbow Pool hub (`MAIN_COLOR`). */
const STYLES_WASH = MAIN_COLOR;
const STYLES_KICKER = '#75b6a4';

function PetStylesSkeleton() {
  return (
    <Skeleton
      w="100%"
      minW={0}
      h={{ base: '320px', md: '420px' }}
      borderRadius="xl"
      bg="gray.700"
    />
  );
}

export function PetStylesSection() {
  return (
    <Suspense fallback={<PetStylesSkeleton />}>
      <PetStylesContent />
    </Suspense>
  );
}

async function PetStylesContent() {
  const [tokens, recentPrismatics, t] = await Promise.all([
    loadRecentlyReleasedPetStyles(TOKEN_LIMIT, { includePrismatic: false }),
    loadRecentPrismaticTokens(PRISMATIC_LIMIT),
    getTranslations(),
  ]);

  if (tokens.length === 0 && recentPrismatics.length === 0) return null;

  const inStudio = tokens.filter((token) => token.inStudio).length;
  const lede =
    inStudio > 0
      ? t('NcMall.pet-styles-lede-studio', { count: inStudio })
      : t('NcMall.pet-styles-lede');

  return (
    <Flex as="section" id="pet-styles" direction="column" w="100%" minW={0}>
      <Box
        w="100%"
        minW={0}
        bg="gray.700"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="whiteAlpha.200"
        p={{ base: 4, md: 6 }}
        bgGradient={`linear-gradient(to bottom, ${STYLES_WASH}, transparent 55%)`}
      >
        <Flex direction="column" gap={6} w="100%" minW={0}>
          <MallSectionHeader
            kicker={t('NcMall.pet-styles-kicker')}
            kickerColor={STYLES_KICKER}
            title={t('NcMall.pet-styles-title')}
            lede={lede}
            link={{ href: STYLES_BASE_PATH, label: t('NcMall.pet-styles-hub-link') }}
            linkColor={STYLES_KICKER}
          />

          {tokens.length > 0 && (
            <SimpleGrid columns={{ base: 2, sm: 3, lg: 6 }} gap={3} w="100%" minW={0}>
              {tokens.map((token) => (
                <Box key={token.id} minW={0}>
                  <StyleTokenTile token={token} linkTo="item" />
                </Box>
              ))}
            </SimpleGrid>
          )}

          {tokens.length > 0 && recentPrismatics.length > 0 && (
            <Separator borderColor="whiteAlpha.200" />
          )}

          {recentPrismatics.length > 0 && (
            <Flex direction="column" gap={3} w="100%" minW={0}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                letterSpacing="0.16em"
                textTransform="uppercase"
                color="whiteAlpha.700"
              >
                {t('PetStyles.recent-prismatics')}
              </Text>
              <SimpleGrid columns={{ base: 2, sm: 3, lg: 6 }} gap={3} w="100%" minW={0}>
                {recentPrismatics.map((token) => (
                  <Box key={token.id} minW={0}>
                    <StyleTokenTile token={token} />
                  </Box>
                ))}
              </SimpleGrid>
            </Flex>
          )}
        </Flex>
      </Box>
    </Flex>
  );
}
