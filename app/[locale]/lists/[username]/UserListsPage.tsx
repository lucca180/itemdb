import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import {
  Badge,
  Box,
  Flex,
  Heading,
  IconButton,
  Image,
  Link,
  Separator,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react';
import NextImage from 'next/image';
import Color from 'color';
import { FaEnvelope, FaHouseUser } from 'react-icons/fa';
import UserAchiev from '@components/Achievements/UserAchiev';
import icon from '@assets/logo_icon.svg';
import { getTranslations } from 'next-intl/server';
import {
  countProfileMatchItems,
  getAchievements,
  getListData,
  getLists,
  getMatches,
  type ProfileCore,
} from './loadUserProfile';
import { UserListsPageClient } from './UserListsPageClient';

const Markdown = dynamic(() => import('@components/Utils/Markdown'));

type UserListsPageBodyProps = {
  username: string;
  core: ProfileCore;
};

function UserListsCountBadgeSkeleton() {
  return (
    <Skeleton
      as="span"
      display="inline-block"
      h="24px"
      w="32px"
      verticalAlign="middle"
      borderRadius="md"
      ml={1}
    />
  );
}

function ProfileMatchStatsSkeleton() {
  return <Skeleton h="52px" w="100%" mt={2} borderRadius="md" />;
}

function UserListsSectionSkeleton() {
  return (
    <>
      <Separator mt={5} />
      <Flex justifyContent="space-between" flexWrap="wrap" gap={3} alignItems="center" py={3}>
        <Skeleton h="32px" w="120px" />
        <Skeleton h="32px" w="80px" />
      </Flex>
      <Flex mt={5} gap={4} flexWrap="wrap" justifyContent="center">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} h="220px" w="220px" borderRadius="md" />
        ))}
      </Flex>
    </>
  );
}

async function UserProfileAchievements({ username }: { username: string }) {
  const achievements = await getAchievements(username);

  if (achievements.length === 0) return null;

  return <UserAchiev achievements={achievements} />;
}

async function UserListsCountBadge({ username, isOwner }: { username: string; isOwner: boolean }) {
  const lists = await getLists(username, isOwner);

  return (
    <Badge fontSize="lg" verticalAlign="middle">
      {lists.length}
    </Badge>
  );
}

async function ProfileMatchStats({
  username,
  ownerUsername,
  viewerUsername,
  isOwner,
}: {
  username: string;
  ownerUsername: string;
  viewerUsername: string | undefined;
  isOwner: boolean;
}) {
  const matches = await getMatches(username, viewerUsername, isOwner);
  const t = await getTranslations();
  const seekItems = countProfileMatchItems(matches, 'seek');
  const tradeItems = countProfileMatchItems(matches, 'trade');

  return (
    <Box bg="blackAlpha.400" p={1} px={2} borderRadius="md" mt={2} color="gray.300">
      <Stack gap={1}>
        <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold">
          {t.rich('Lists.profile-match-want', {
            Badge: (chunk) => (
              <Badge borderRadius="md" verticalAlign="middle" colorPalette="green">
                {chunk}
              </Badge>
            ),
            username: ownerUsername,
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
            username: ownerUsername,
            items: tradeItems,
          })}
        </Text>
      </Stack>
    </Box>
  );
}

async function UserListsSection({ username, core }: { username: string; core: ProfileCore }) {
  const { owner, viewer, isOwner } = core;
  const { lists, matches } = await getListData(username, isOwner, viewer?.username ?? undefined);

  return (
    <UserListsPageClient
      key={`${username}-${lists.length}-${lists.map((list) => list.internal_id).join(',')}`}
      owner={owner}
      viewer={viewer}
      isOwner={isOwner}
      lists={lists}
      matches={matches}
      profileColor={owner.profileColor || '#4A5568'}
    />
  );
}

export async function UserListsPageBody({ username, core }: UserListsPageBodyProps) {
  const { owner, viewer, isOwner } = core;
  const t = await getTranslations();
  const color = Color(owner.profileColor || '#4A5568');
  const rgb = color.rgb().array();

  return (
    <>
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
              <Suspense fallback={<Skeleton h="24px" w="60px" borderRadius="md" />}>
                <UserProfileAchievements username={username} />
              </Suspense>
            </Stack>
            <Heading size={{ base: 'lg', md: undefined }} fontWeight="bold">
              {t('Lists.owner-username-s-lists', { username: owner.username ?? '' })}{' '}
              <Suspense fallback={<UserListsCountBadgeSkeleton />}>
                <UserListsCountBadge username={username} isOwner={isOwner} />
              </Suspense>
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
              <Suspense fallback={<ProfileMatchStatsSkeleton />}>
                <ProfileMatchStats
                  username={username}
                  ownerUsername={owner.username ?? ''}
                  viewerUsername={viewer.username ?? undefined}
                  isOwner={isOwner}
                />
              </Suspense>
            )}
          </Flex>
        </Flex>
      </Box>

      <Suspense fallback={<UserListsSectionSkeleton />}>
        <UserListsSection username={username} core={core} />
      </Suspense>
    </>
  );
}
