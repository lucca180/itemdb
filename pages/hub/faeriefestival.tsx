/* eslint-disable @typescript-eslint/ban-ts-comment */
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
} from '@chakra-ui/react';
import NextImage from 'next/image';
import Layout from '../../components/Layout';

import Background from '../../public/hub/faeriefest2023.png';
import Logo from '../../public/hub/faeriefest2023-logo.png';
import SearchCard from '../../components/Hubs/FaerieFest2023/SearchCard';
import { ReactElement } from 'react';
import { loadTranslation } from '@utils/load-translation';
import { getTrendingCatLists } from '../api/v1/beta/trending';
import { UserList } from '@types';
import UserListCard from '@components/UserLists/ListCard';

const EVENT_YEAR = 2025;

type FaeriesFestivalProps = {
  lists: UserList[];
};

const FaeriesFestival = (props: FaeriesFestivalProps) => {
  const { lists } = props;

  return (
    <>
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(221,170,223,.7) 70%)`}
        zIndex={-1}
      />
      <Center position={'relative'} mt={['40px', '50px', '60px']} mb={6}>
        <Link
          display={'inline'}
          href="https://www.neopets.com/faeriefestival/index.phtml"
          isExternal
          position={'absolute'}
          top={['-40px', '-50px', '-60px']}
        >
          <Image
            as={NextImage}
            //@ts-ignore
            src={Logo}
            w={['175px', '200px', '300px']}
            maxW="300px"
            quality={100}
            alt="Faeries Festival logo"
            dropShadow="lg"
          />
        </Link>
        <Link href="https://www.neopets.com/faeriefestival/index.phtml" isExternal>
          <Image
            as={NextImage}
            //@ts-ignore
            src={Background}
            quality={100}
            alt="Faeries Festival background"
            borderRadius={'md'}
            boxShadow="lg"
          />
        </Link>
      </Center>
      <Center flexFlow="column" gap={5}>
        {/* <Alert maxW="400px" fontSize={'sm'} status={'warning'}>
          <AlertIcon />
          <AlertDescription>
            This guide is from the <b>Faerie Festival 2023</b> event. We don&apos;t know if the
            point values will be the same for the next event.
          </AlertDescription>
        </Alert> */}
        <Center flexFlow="column" gap={1}>
          <Heading color="whiteAlpha.900">♻️Recycling</Heading>
          <Heading as="h3" size="sm" color="whiteAlpha.700">
            All items you can recycle and how much points you earn
          </Heading>
        </Center>
        <Flex gap={3} flexWrap="wrap" justifyContent={'center'}>
          <SearchCard
            title="10 points"
            description="All items that give you 10 points to spend at the Prize Shop"
            link="/search?s=&rarity[]=102&rarity[]=179&sortBy=price&price[]=1&price[]="
            color="#40A464"
            coverURL="https://images.neopets.com/items/om_peppers2.gif"
            footerText="r102 - r179"
          />
          <SearchCard
            title="8 points"
            description="All items that give you 8 points to spend at the Prize Shop"
            link="/search?s=&rarity[]=90&rarity[]=97&sortBy=price&price[]=1&price[]="
            color="#C71F1D"
            coverURL="https://images.neopets.com/items/toy_bobble_abominable.gif"
            footerText="r90 - r97"
          />
          <SearchCard
            title="6 points"
            description="All items that give you 6 points to spend at the Prize Shop (except Sticky Snowballs)"
            link="/search?s=&rarity[]=98&rarity[]=100&sortBy=price&price[]=1&price[]="
            color="#515C66"
            coverURL="https://images.neopets.com/items/toy_faerie_grey.gif"
            footerText="r98 - r100"
          />
          <SearchCard
            title="5 points"
            description="All items that give you 5 points to spend at the Prize Shop"
            link="/search?s=&rarity[]=80&rarity[]=89&sortBy=price&price[]=1&price[]="
            color="#6C3C44"
            coverURL="https://images.neopets.com/items/clo_bg_8bitprideflag.gif"
            footerText="r80 - r89"
          />
          <SearchCard
            title="3 points"
            description="All items that give you 3 points to spend at the Prize Shop"
            link="/search?s=&rarity[]=1&rarity[]=79&sortBy=price&price[]=1&price[]="
            color="#065DD2"
            coverURL="https://images.neopets.com/items/bluetradingcardback.gif"
            footerText="r1 - r79"
          />
          <SearchCard
            title="1 points"
            description="All items that give you 1 point to spend at the Prize Shop"
            link="/search?s=&rarity[]=101&rarity[]=101&sortBy=price&price[]=1&price[]="
            color="#8484BC"
            coverURL="https://images.neopets.com/items/om_chokato3.gif"
            footerText="r101"
          />
        </Flex>
        <Center flexFlow="column" gap={1} mt={5}>
          <Heading color="whiteAlpha.900">📦Faerie Donation Capsule</Heading>
          <Heading as="h3" size="sm" color="whiteAlpha.700">
            All drops from the Faerie Donation Capsule
          </Heading>
        </Center>
        <Flex gap={3} flexWrap="wrap" justifyContent={'center'}>
          <SearchCard
            title="r99"
            description="All r99 items that you can get from the Faerie Donation Capsule"
            link="/search?s=&rarity[]=99&rarity[]=99"
            color="#EC5CDC"
            coverURL="https://images.neopets.com/items/sta_queen_fyora.gif"
            footerText="15% chance"
          />
          <SearchCard
            title="r96 - r98"
            description="All r96 - r98 items that you can get from the Faerie Donation Capsule"
            link="/search?s=&rarity[]=96&rarity[]=98"
            color="#F70808"
            coverURL="https://images.neopets.com/items/sta_sloth_charm.gif"
            footerText="25% chance"
          />
          <SearchCard
            title="r90 - r95"
            description="All r90 - r95 items that you can get from the Faerie Donation Capsule"
            link="/search?s=&rarity[]=90&rarity[]=95"
            color="#F4C412"
            coverURL="https://images.neopets.com/items/toy_faerie_siyana.gif"
            footerText="60% chance"
          />
        </Flex>
        <Center flexFlow="column" gap={1} mt={5}>
          <Heading color="whiteAlpha.900">🛍️Official Lists</Heading>
          <Heading as="h3" size="sm" color="whiteAlpha.700">
            Some curated lists to help you get the best items at the Faerie Festival event
          </Heading>
        </Center>
        <Flex gap={3} flexWrap="wrap" justifyContent={'center'}>
          {lists.map((list) => (
            <UserListCard isSmall key={list.internal_id} list={list} />
          ))}
        </Flex>
        <Center flexFlow="column" gap={1} mt={5}>
          <Heading color="whiteAlpha.900">🔧Utilities</Heading>
          <Heading as="h3" size="sm" color="whiteAlpha.700">
            itemdb Tools to make your life easier
          </Heading>
        </Center>
        <Flex gap={3} flexWrap="wrap" justifyContent={'center'}>
          <SearchCard
            title="SDB Importer"
            description="Import all your sdb items to itemdb and sort them by Recycling Points to find the best items to recycle"
            link="/lists/import"
            color="#6A7895"
            coverURL="https://images.neopets.com/items/bak_chained_vault.gif"
            footerText="Userscript"
          />
          <SearchCard
            title="Dynamic Lists"
            description="Create your own lists that update automatically based on your criteria"
            link="/articles/checklists-and-dynamic-lists"
            color="#FCE414"
            coverURL="https://images.neopets.com/items/mall_trink_neopetzapped.gif"
            footerText="Lists"
          />
          <SearchCard
            title="SDB Pricer"
            description="Now updated to show how many points you earn by recycling each item!"
            link="/articles/userscripts"
            color="#B74926"
            coverURL="https://images.neopets.com/items/ghost_quiggle_bag.gif"
            footerText="Userscript"
          />
          <SearchCard
            title="Item Data Extractor"
            description="Play Neopets and help itemdb to stay up to date!"
            link="/contribute"
            color="#8ea7f1"
            coverURL="https://images.neopets.com/games/betterthanyou/contestant435.gif"
            footerText="Userscript"
          />
        </Flex>
      </Center>
    </>
  );
};

export default FaeriesFestival;

export async function getStaticProps(context: any) {
  const lists = (await getTrendingCatLists('Faerie Festival', 100)).filter(
    (l) => new Date(l.createdAt).getFullYear() === EVENT_YEAR
  );

  return {
    props: {
      lists: lists,
      messages: await loadTranslation(context.locale as string, 'hub/faeriefestival'),
      locale: context.locale,
    },
    revalidate: 300,
  };
}

FaeriesFestival.getLayout = function getLayout(page: ReactElement) {
  // const t = createTranslator({ messages: props.messages, locale: props.locale });
  return (
    <Layout
      SEO={{
        title: 'Faerie Festival Guide',
        description: 'Find the best items to recycle for the Faerie Festival event!',
        themeColor: '#9b65c0',
        openGraph: {
          images: [
            {
              url: 'https://images.neopets.com/homepage/marquee/icons/faeriefestival_event_icon.png',
              width: 300,
              height: 300,
              alt: 'Faeries Festival',
            },
          ],
        },
      }}
      mainColor="#9b65c0c7"
    >
      {page}
    </Layout>
  );
};
