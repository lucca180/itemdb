import {
  Box,
  Flex,
  Heading,
  Image,
  Divider,
  Badge,
  HStack,
  IconButton,
  Link,
  Text,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react';
import React from 'react';
import Layout from '@components/Layout';
import { User, UserList } from '@types';
import { useRouter } from 'next/router';
import Color from 'color';
import { GetServerSidePropsContext } from 'next';
import { getUser } from '../api/v1/users/[username]';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';
import { CheckAuth } from '@utils/googleCloud';
import { loadTranslation } from '@utils/load-translation';
import { AlbumAvatar, getAlbumInfo } from '../api/v1/collection';
import { FaShareAlt, FaPencilAlt } from 'react-icons/fa';

import NextLink from 'next/link';
import dynamic from 'next/dynamic';
import { ListService } from '@services/ListService';
const Markdown = dynamic(() => import('@components/Utils/Markdown'));

type AlbumInfo = {
  [page_id: number]: {
    avatar: AlbumAvatar;
    officialList?: UserList;
    userList?: UserList;
    hiddenCount: number;
  };
};

type Props = {
  owner: User;
  user: User | null;
  userLists?: { [key: number]: UserList };
  stampLists: AlbumInfo;
  messages: any;
  locale: string;
};

const CollectionPage = (props: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { owner, stampLists, userLists } = props;

  const color = Color(owner?.profileColor || '#4A5568');
  const rgb = color.rgb().array();

  return (
    <Layout
      SEO={{
        title: t('Lists.owner-username-s-lists', { username: router.query.username as string }),
        nofollow: true,
        noindex: true,
      }}
      mainColor={`${color.hex()}b8`}
    >
      <Box>
        <Box
          position="absolute"
          h="45vh"
          left="0"
          width="100%"
          bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.6) 80%)`}
          zIndex={-1}
        />
        <Flex gap={3} pt={6} justifyContent="center" flexFlow={'column'} alignItems="center">
          <Box
            position="relative"
            p={{ base: 1, md: 2 }}
            bg={`rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.75)`}
            borderRadius="md"
            display="flex"
            flexFlow="column"
            justifyContent="center"
            alignItems="center"
            boxShadow="sm"
            textAlign="center"
            flex="0 0 auto"
            minW={{ base: '100px', md: '150px' }}
            minH={{ base: '100px', md: '150px' }}
          >
            {!owner.profileImage && (
              <Image
                as={NextImage}
                src={'/logo_icon.svg'}
                width={{ base: '50px', md: '80px' }}
                style={{ opacity: 0.85, flex: 1 }}
                alt={'List Cover'}
              />
            )}
            {owner.profileImage && (
              <Image
                src={owner.profileImage}
                width={{ base: '100px', md: '150px' }}
                height={{ base: '100px', md: '150px' }}
                borderRadius="md"
                alt={'List Cover'}
                objectFit="cover"
              />
            )}
          </Box>
          <Flex flexFlow={'column'} h={'100%'} gap={2} alignItems={'flex-start'}>
            <Heading size={{ base: 'lg', md: undefined }}>Lucca&apos;s Collection</Heading>
          </Flex>
        </Flex>
      </Box>
      <Divider my={5} />
      <Flex
        flexFlow="column"
        gap={5}
        mb={10}
        // bg="blackAlpha.400"
        // p={4}
        borderRadius="md"
      >
        <TableContainer>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Collection</Th>
                <Th>Category</Th>
                <Th>Total Cost</Th>
                <Th>Progress</Th>
              </Tr>
            </Thead>
            <Tbody>
              {Object.entries(stampLists).map(([page_id, albumInfo]) => (
                <ListCollection key={page_id} isSmall albumInfo={albumInfo} />
              ))}
            </Tbody>
          </Table>
        </TableContainer>
        <Flex flexFlow={'column'} flexWrap={'wrap'} gap={4}></Flex>
      </Flex>
    </Layout>
  );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { username } = context.query;
  if (!username || Array.isArray(username)) return { notFound: true };

  const listService = await ListService.initReq(context.req as any);
  const user = listService.user;

  const owner = await getUser(username as string);
  if (!owner || !owner.username) return { notFound: true };

  const [albumInfo, allUserLists] = await Promise.all([
    getAlbumInfo(),
    listService.getUserLists({
      username: owner.username,
      includeItems: true,
    }),
  ]);

  const filteredUserLists: { [key: number]: UserList } = {};
  const newAlbumInfo = { ...albumInfo } as AlbumInfo;

  Object.entries(albumInfo).forEach(([key, { officialList }]) => {
    const ul = allUserLists.find((l) => l.linkedListId === officialList.internal_id);
    const hiddenCount = ul?.itemInfo?.filter((item) => item.isHidden).length || 0;

    if (ul) {
      ul.itemInfo = [];
      newAlbumInfo[Number(key)].userList = ul;
      filteredUserLists[officialList.internal_id] = ul;
    }

    newAlbumInfo[Number(key)].hiddenCount = hiddenCount || 0;
  });

  const props: Props = {
    owner,
    user: user,
    userLists: filteredUserLists,
    stampLists: newAlbumInfo,
    messages: await loadTranslation(context.locale as string, 'lists/[username]/index'),
    locale: context.locale as string,
  };

  return {
    props,
  };
}

export default CollectionPage;

type ListCollectionProps = {
  userList?: UserList;
  officialList?: UserList;
  isSmall?: boolean;
  albumInfo: AlbumInfo[number];
};

const ListCollection = (props: ListCollectionProps) => {
  const t = useTranslations();
  const { userList, officialList, avatar, hiddenCount } = props.albumInfo;
  if (!userList && !officialList) return null;
  const color = Color(avatar?.color || userList?.colorHex || officialList?.colorHex || '#4A5568');
  const rgb = color.rgb().array();

  const mainList = userList || officialList!;
  return (
    <Tr
      bg="blackAlpha.500"
      sx={{ a: { color: color.lightness(70).hex() } }}
      // bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.6) 0%)`}
    >
      <Td>
        <HStack alignItems={'center'} gap={3}>
          <Link
            as={NextLink}
            href={`/lists/${mainList.official ? 'official' : mainList.owner.username}/${
              mainList.slug ?? mainList.internal_id
            }`}
            prefetch={false}
            _hover={{ textDecoration: 'none' }}
          >
            <Flex
              position="relative"
              w={'65px'}
              h={'65px'}
              bg="gray.700"
              bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1) 0%)`}
              flex="0 0 auto"
              borderRadius="md"
              overflow="hidden"
              boxShadow={'md'}
              justifyContent="center"
              alignItems="center"
            >
              {!avatar?.url && (
                <Image
                  src={'/logo_icon.svg'}
                  width={50}
                  style={{ opacity: 0.85 }}
                  alt={'List Cover'}
                />
              )}

              {avatar?.url && (
                <Image
                  // quality={90}
                  src={avatar?.url}
                  w={'50px'}
                  h={'50px'}
                  alt={'List Cover'}
                  objectFit="cover"
                />
              )}
            </Flex>
          </Link>
          <VStack alignItems={'flex-start'} justifyContent="space-around" spacing={1} flex={1}>
            <Text fontWeight="bold" noOfLines={2}>
              <Link
                as={NextLink}
                href={`/lists/${mainList.official ? 'official' : mainList.owner.username}/${
                  mainList.slug ?? mainList.internal_id
                }`}
                prefetch={false}
              >
                {officialList?.name || userList?.name}
              </Link>
            </Text>
            <Text fontSize="xs" flex={1} noOfLines={4} as="div" sx={{ a: { fontWeight: 'bold' } }}>
              <Markdown>
                {
                  (
                    officialList?.description ||
                    userList?.description ||
                    t('ItemPage.list-no-description')
                  ).split(/[\r\n]+/)[0]
                }
              </Markdown>
            </Text>
          </VStack>
        </HStack>
      </Td>
      <Td>
        <Badge>{officialList?.officialTag || userList?.userTag}</Badge>
      </Td>
      <Td>5000 NP</Td>
      <Td>
        {hiddenCount}/{mainList.itemCount}
      </Td>
    </Tr>
  );
};
