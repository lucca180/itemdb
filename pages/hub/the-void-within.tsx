import {
  // Alert,
  // AlertDescription,
  // AlertIcon,
  Box,
  Center,
  Flex,
  Heading,
  Image,
  Link,
  Text,
} from '@chakra-ui/react';
import NextImage from 'next/image';
import Layout from '../../components/Layout';

import Banner from '../../public/hub/tvw-banner.png';

import { ReactElement } from 'react';
import { loadTranslation } from '@utils/load-translation';
import { UserList } from '@types';
import { getOfficialListsCat } from '../api/v1/lists/[username]';
import UserListCard from '@components/UserLists/ListCard';

type TheVoidWithinHubProps = {
  messages: any;
  locale: string;
  lists: UserList[];
};

const TheVoidWithinHub = (props: TheVoidWithinHubProps) => {
  const { lists } = props;

  return (
    <>
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(112, 62, 215,.5) 70%)`}
        zIndex={-1}
      />
      <Center position={'relative'} mt={3} mb={6}>
        <Link href="https://www.neopets.com/tvw/" isExternal>
          <Image
            as={NextImage}
            //@ts-expect-error chakra-ui types are not compatible with next/image
            src={Banner}
            quality={100}
            alt="The Void Within Banner"
            borderRadius={'md'}
            boxShadow="lg"
          />
        </Link>
      </Center>

      <Center flexFlow="column" gap={5} sx={{ 'h1, h2, b': { textShadow: '0 0 10px #f3a4ff' } }}>
        <Flex flexFlow={'column'} textAlign={'center'} gap={2} mb={5}>
          <Heading color="whiteAlpha.900">The Void Within - Lost in the Dark</Heading>
          <Text fontSize="md" color="whiteAlpha.800" maxW="1000px">
            Nyx and the Gang are back into Neopia’s epic struggle against the immutable, grey, and
            shadowy shades threatening to overtake the planet in <b>The Void Within</b> Neopets
            Plot!
          </Text>
        </Flex>
        <Center flexFlow="column" gap={1}>
          <Heading as="h2" size="lg" color="whiteAlpha.900">
            Official Lists
          </Heading>
          <Text fontSize="sm" color="whiteAlpha.800" maxW="1000px">
            With itemdb you can find the best prizes and guides to help you get the best items from
            The Void Within plot
          </Text>
        </Center>
        <Flex gap={3} flexWrap="wrap" justifyContent={'center'}>
          {lists.map((list) => (
            <UserListCard key={list.slug} list={list} />
          ))}
        </Flex>
      </Center>
    </>
  );
};

export default TheVoidWithinHub;

export async function getStaticProps(context: any) {
  const featuredLists = ['the-void-within-prize-shop', 'the-void-within'];
  const lists = (await getOfficialListsCat('The Void Within', 3000))
    .sort((a, b) => sortLists(a, b, featuredLists))
    .splice(0, 15);

  return {
    props: {
      lists: lists,
      messages: await loadTranslation(context.locale as string, 'hub/the-void-within'),
      locale: context.locale,
    },
  };
}

TheVoidWithinHub.getLayout = function getLayout(page: ReactElement, props: { locale: string }) {
  const { locale } = props;
  // const t = createTranslator({ messages: props.messages, locale: props.locale });

  let canonical = 'https://itemdb.com.br/hub/the-void-within';
  if (locale && locale !== 'en') canonical = `https://itemdb.com.br/${locale}/hub/the-void-within`;

  return (
    <Layout
      SEO={{
        canonical: canonical,
        title: 'The Void Within Plot Prize Guide',
        description:
          "Nyx and the Gang are back into Neopia's epic struggle against the immutable, grey, and shadowy shades threatening to overtake the planet in The Void Within Neopets Plot! Find the best prizes and guides to help you get the best many neopoints on The Void Within plot",
        themeColor: '#8564df',
        openGraph: {
          images: [
            {
              url: 'https://images.neopets.com/plots/tvw/rewards/images/achievements/94n7e5ffbi.png',
              width: 150,
              height: 150,
              alt: 'The Void Within Plot Paint Brush',
            },
          ],
        },
      }}
      mainColor="#8564df"
    >
      {page}
    </Layout>
  );
};

const sortLists = (a: UserList, b: UserList, featured?: string[]) => {
  if (featured) {
    const aIndex = featured.indexOf(a.slug?.toLowerCase() ?? '');
    const bIndex = featured.indexOf(b.slug?.toLowerCase() ?? '');
    if (aIndex !== -1 && bIndex === -1) return -1;
    if (aIndex === -1 && bIndex !== -1) return 1;
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
  }
  return new Date(a.updatedAt) < new Date(b.updatedAt) ? 1 : -1;
};
