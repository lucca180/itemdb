import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Badge, Box, Flex, Heading, IconButton, Image, Link, Stack, Text } from '@chakra-ui/react';
import NextImage from 'next/image';
import Color from 'color';
import { FaEnvelope, FaHouseUser } from 'react-icons/fa';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import UserAchiev from '@components/Achievements/UserAchiev';
import icon from '@assets/logo_icon.svg';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { loadUserProfileRequest, countProfileMatchItems } from './loadUserProfile';
import { UserListsPageClient } from './UserListsPageClient';

const Markdown = dynamic(() => import('@components/Utils/Markdown'));

type UserListsPageProps = {
  params: Promise<{ locale: string; username: string }>;
};

export async function generateMetadata({ params }: UserListsPageProps): Promise<Metadata> {
  const { locale, username } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return getStaticAppPageProps(locale, {
    title: t('Lists.owner-username-s-lists', { username }),
    pathname: `/lists/${username}`,
    noindex: true,
  }).metadata;
}

export default function UserListsPage({ params }: UserListsPageProps) {
  const profileColor = '#4A5568';

  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={`${profileColor}c7`} />}>
      <UserListsPageContent params={params} />
    </Suspense>
  );
}

async function UserListsPageContent({ params }: UserListsPageProps) {
  const { locale, username } = await params;
  setRequestLocale(locale);

  const { owner, viewer, isOwner, lists, achievements, matches } =
    await loadUserProfileRequest(username);

  const t = await getTranslations();
  const color = Color(owner.profileColor || '#4A5568');
  const rgb = color.rgb().array();
  const mainColor = `${color.hex()}b8`;
  const seekItems = countProfileMatchItems(matches, 'seek');
  const tradeItems = countProfileMatchItems(matches, 'trade');

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <Box>
        <Box
          position="absolute"
          h="45vh"
          left="0"
          width="100%"
          bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.6) 80%)`}
          zIndex={-1}
        />
        <Flex gap={{ base: 3, md: 6 }} pt={6} alignItems="center">
          <Box
            position="relative"
            p={{ base: 1, md: 2 }}
            bg={`rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.75)`}
            borderRadius="md"
            display="flex"
            flexFlow="column"
            justifyContent="center"
            alignItems="center"
            boxShadow="inset"
            textAlign="center"
            flex="0 0 auto"
            minW={{ base: '100px', md: '150px' }}
            minH={{ base: '100px', md: '150px' }}
          >
            {!owner.profileImage && (
              <Image
                as={NextImage}
                src={icon}
                width={{ base: '50px', md: '80px' }}
                style={{ opacity: 0.85, flex: 1 }}
                alt="List Cover"
              />
            )}
            {owner.profileImage && (
              <Image
                src={owner.profileImage}
                width={{ base: '100px', md: '150px' }}
                height={{ base: '100px', md: '150px' }}
                borderRadius="md"
                alt="List Cover"
                objectFit="cover"
              />
            )}
          </Box>
          <Flex flexFlow="column" h="100%" gap={2} alignItems="flex-start">
            <Stack direction="row" mb={1} flexWrap="wrap">
              <IconButton
                asChild
                size="xs"
                colorPalette="whiteAlpha"
                variant="subtle"
                aria-label={t('General.userlookup')}
              >
                <Link
                  href={`http://www.neopets.com/userlookup.phtml?user=${owner.neopetsUser}`}
                  target="_blank"
                  rel="noreferrer"
                  data-umami-event="user-interact"
                  data-umami-event-type="userlookup"
                >
                  <FaHouseUser />
                </Link>
              </IconButton>
              <IconButton
                asChild
                size="xs"
                colorPalette="whiteAlpha"
                variant="subtle"
                aria-label={t('General.neomail')}
              >
                <Link
                  href={`http://www.neopets.com/neomessages.phtml?type=send&recipient=${owner.neopetsUser}`}
                  target="_blank"
                  rel="noreferrer"
                  data-umami-event="user-interact"
                  data-umami-event-type="neomail"
                >
                  <FaEnvelope />
                </Link>
              </IconButton>
              {achievements.length > 0 && <UserAchiev achievements={achievements} />}
            </Stack>
            <Heading size={{ base: 'lg', md: undefined }} fontWeight="bold">
              {t('Lists.owner-username-s-lists', { username: owner.username ?? '' })}{' '}
              <Badge fontSize="lg" verticalAlign="middle">
                {lists.length}
              </Badge>
            </Heading>
            {owner.description && (
              <Text as="div" fontSize={{ base: 'xs', md: 'sm' }}>
                <Markdown>{owner.description}</Markdown>
              </Text>
            )}
            {isOwner && !owner.description && (
              <Text fontSize={{ base: 'xs', md: 'sm' }} fontStyle="italic" opacity={0.8}>
                Tip: you can add a description to your profile!
              </Text>
            )}
            {!isOwner && viewer && (
              <Box bg="blackAlpha.400" p={1} px={2} borderRadius="md" mt={2} color="gray.300">
                <Stack gap={1}>
                  <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold">
                    {t.rich('Lists.profile-match-want', {
                      Badge: (chunk) => (
                        <Badge borderRadius="md" verticalAlign="middle" colorPalette="green">
                          {chunk}
                        </Badge>
                      ),
                      username: owner.username ?? '',
                      items: seekItems,
                    })}
                  </Text>
                  <Text
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight="bold"
                    css={{ marginTop: '0 !important' }}
                  >
                    {t.rich('Lists.profile-match-have', {
                      Badge: (chunk) => (
                        <Badge borderRadius="md" verticalAlign="middle" colorPalette="blue">
                          {chunk}
                        </Badge>
                      ),
                      username: owner.username ?? '',
                      items: tradeItems,
                    })}
                  </Text>
                </Stack>
              </Box>
            )}
          </Flex>
        </Flex>
      </Box>

      <UserListsPageClient
        key={`${username}-${lists.length}-${lists.map((list) => list.internal_id).join(',')}`}
        owner={owner}
        viewer={viewer}
        isOwner={isOwner}
        lists={lists}
        matches={matches}
        profileColor={owner.profileColor || '#4A5568'}
      />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
