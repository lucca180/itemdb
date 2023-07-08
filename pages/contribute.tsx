/* eslint-disable react/no-unescaped-entities */
import {
  Flex,
  Heading,
  Text,
  Link,
  List,
  ListIcon,
  ListItem,
  useMediaQuery,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Button,
  Icon,
  UnorderedList,
} from '@chakra-ui/react';
import { BsCheckCircleFill, BsXCircleFill } from 'react-icons/bs';
import HeaderCard from '../components/Card/HeaderCard';
import Layout from '../components/Layout';
import { useDisclosure } from '@chakra-ui/react';
import FeedbackModal from '../components/Modal/FeedbackModal';
import { FiEdit3, FiSend } from 'react-icons/fi';

const ContributePage = () => {
  return (
    <Layout
      SEO={{
        title: 'How to Contribute',
        description:
          'Itemdb is an open-source website and needs your contribution to become even more awesome. And there are several ways to help!',
        openGraph: {
          images: [
            {
              url: 'https://images.neopets.com/games/betterthanyou/contestant435.gif',
              width: 150,
              height: 150,
            },
          ],
        },
      }}
    >
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/games/betterthanyou/contestant435.gif',
          alt: 'helper acara thumbnail',
        }}
        color="#4974F5"
      >
        <Heading size="lg">How to Contribute</Heading>
        <Text>
          Itemdb is an open-source website and needs your contribution to become even more awesome.
          And there are several ways to help!
        </Text>
      </HeaderCard>
      <Flex flexFlow="column" gap={3} sx={{ a: { color: '#ffee71' }, b: { color: '#8ea7f1' } }}>
        <Tabs colorScheme="yellow">
          <TabList>
            <Tab>Item Data Extractor</Tab>
            <Tab>Feedback System</Tab>
            <Tab>Creating Official Lists</Tab>
            <Tab>Where to Find Info</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <ItemDataExtractor />
            </TabPanel>
            <TabPanel>
              <FeedbackSystem />
            </TabPanel>
            <TabPanel>
              <OfficialLists />
            </TabPanel>
            <TabPanel>
              <WhereToFindInfo />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Flex>
    </Layout>
  );
};

export default ContributePage;

const ItemDataExtractor = () => {
  const [isLargerThanMD] = useMediaQuery('(min-width: 48em)', { fallback: true });
  return (
    <Flex flexFlow="column" gap={3} maxW="1000px">
      <Heading size="lg">The Item Data Extractor</Heading>
      {!isLargerThanMD && (
        <Text fontSize="sm" color="red.400">
          This may not work on mobile devices!
        </Text>
      )}
      <Text>
        All information on itemdb comes directly from users, like you, who are using the{' '}
        <Link
          href="https://github.com/lucca180/itemdb/raw/main/userscripts/itemDataExtractor.user.js"
          isExternal
        >
          {' '}
          Item Data Extractor script
        </Link>
        .
      </Text>
      <Text>
        The{' '}
        <Link
          href="https://github.com/lucca180/itemdb/raw/main/userscripts/itemDataExtractor.user.js"
          isExternal
        >
          Item Data Extractor
        </Link>{' '}
        will collect data from all items you come across during your adventures in Neopia. Whether
        you're searching for something on the <b>Shop Wizard</b>, browsing through your{' '}
        <b>Safety Deposit Box</b>, or restocking on <b>Half Price Day</b>.
      </Text>
      <Text>
        <b>
          No information linking you (or your Neopets account) to the collected data is sent,
          processed, or stored by our servers
        </b>
        .
        <br />
        <br />
        You and your account are absolutely safe. Don't trust us? The entire code of itemdb is
        freely available,{' '}
        <Link href="https://github.com/lucca180/itemdb" isExternal>
          take a look
        </Link>
        . <br /> Also, the script code is commented so that you can understand everything that is
        happening.
      </Text>
      <Text>
        The usernames of item sellers (shops, auctions, and trades) are collected, but{' '}
        <b>only the first 3 characters</b> are stored in our database.
      </Text>
      <Heading size="md" mt={3}>
        TL;DR
      </Heading>
      <Text>
        All of our data comes from the{' '}
        <Link
          href="https://github.com/lucca180/itemdb/raw/main/userscripts/itemDataExtractor.user.js"
          isExternal
        >
          script
        </Link>
        . It is secure, and the code is open-source (in fact, all of our code is). With the script,
        you can help us complete missing information and keep prices up to date!
        <br />
        <br />
        You just need to{' '}
        <Link
          href="https://github.com/lucca180/itemdb/raw/main/userscripts/itemDataExtractor.user.js"
          isExternal
        >
          install it
        </Link>{' '}
        and browse Neopia, and we'll take care of the rest :)
      </Text>
      <Heading size="md" mt={3}>
        How to Install
      </Heading>
      <Text>
        Installing the script is easy.
        <br />
        <br />
        First you will need the{' '}
        <Link href="https://www.tampermonkey.net/" isExternal>
          Tampermonkey
        </Link>{' '}
        extension for your browser if you don't have it already.
        <br />
        Then you just need to{' '}
        <Link
          href="https://github.com/lucca180/itemdb/raw/main/userscripts/itemDataExtractor.user.js"
          isExternal
        >
          click here
        </Link>{' '}
        to install the script and it's done!
      </Text>
      <Heading size="md" mt={3}>
        What is sent to itemdb
      </Heading>
      <List spacing={3}>
        <ListItem>
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          Item info such as name, description, rarity, etc.
        </ListItem>
        <ListItem>
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          Item prices from shops, auctions, and trades.
          <Text fontSize="sm" color="gray.400">
            The usernames of item sellers (shops, auctions, and trades) and bidders are collected,
            but <b>only the first 3 characters</b> are stored in our database.
          </Text>
        </ListItem>
        <ListItem>
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          Restock info
          <Text fontSize="sm" color="gray.400">
            When an item is in stock at a shop, the script will collect that information.
          </Text>
        </ListItem>
        <ListItem>
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          Your IP address
          <Text fontSize="sm" color="gray.400">
            This is used to prevent abuse, spam and false information. It's never public available
            and cannot be used to identify you.
          </Text>
        </ListItem>
      </List>
      <Heading size="md" mt={3}>
        What is NOT sent to itemdb
      </Heading>
      <List spacing={3}>
        <ListItem>
          <ListIcon as={BsXCircleFill} color="red.300" />
          Your username, password, or any other personal information from you or your Neopets
          account.
          <Text fontSize="sm" color="gray.400">
            Only the first 3 characters of your username may, sometimes, be collected in the
            situations mentioned above.
          </Text>
        </ListItem>
      </List>
    </Flex>
  );
};

const FeedbackSystem = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <FeedbackModal isOpen={isOpen} onClose={onClose} />
      <Flex flexFlow="column" gap={3} maxW="1000px">
        <Heading size="lg">Feedback System</Heading>
        <Text>
          The <Link href="/feedback">Feedback System</Link> is a way for you to help us improve
          itemdb.You can contribute by <b>manually completing</b> missing data or by{' '}
          <b>validating the suggestions</b> of other neopians like you! Either way, the more you
          contribute correctly the more our systems will trust your information - meaning your
          suggestions will be live faster.
        </Text>
        <Text>
          You can also help by <Link href="/feedback/trades">pricing trading lots</Link> (aka
          translating the wishlist into Neopoints values) and{' '}
          <Link href="/feedback/vote">voting on community suggestions</Link> to ensure they are
          accurate and correct, and should be incorporated into the itemdb.
        </Text>
        <Text as="div">
          Also, on every item page you can <b>suggest new tags</b> or <b>insert additional notes</b>{' '}
          to enrich the information we have available using the{' '}
          <Button variant="outline" size="sm">
            <Icon as={FiEdit3} mr={1} /> Edit
          </Button>{' '}
          button. You can also send comments, report bugs or suggest new features using the{' '}
          <Button variant="outline" size="sm" onClick={onOpen}>
            <Icon as={FiSend} mr={1} /> Feedback
          </Button>{' '}
          button
        </Text>
      </Flex>
    </>
  );
};

const OfficialLists = () => {
  return (
    <Flex flexFlow="column" gap={3} maxW="1000px">
      <Heading size="lg">Creating Official Lists</Heading>
      <Text>
        Want to track every prize of a certain event or daily? Or maybe you have a list that could
        be useful to other neopians? You can <Link href="/lists/official">apply your list</Link> to
        become an <b>official list</b> on itemdb!
      </Text>
      <Text>
        As an official list, your list will receive <b>a special badge</b> and will be{' '}
        <b>featured on its item's pages</b>, so that other neopians can easily find it. You will be
        listed as the curator of the list, and it will be your task to keep it up to date and
        complete!
      </Text>
      <Text>
        Before applying, please make sure your list is complete and up to date. You can also check
        the <Link href="/lists/official">official lists</Link> to see other examples of cool
        official lists! Also check our <Link href="/terms">Terms and Conditions</Link> for more
        information on official lists.
      </Text>
    </Flex>
  );
};

const WhereToFindInfo = () => {
  return (
    <Flex flexFlow="column" gap={3} maxW="1000px">
      <Heading size="lg">Where to find the info</Heading>
      <Text>
        When using the <b>Item Data Extractor Script</b>, the script will automatically collect the
        all available information from the items on the current page. Each page has a different set
        of info available. Here is a list of the pages and the info available on each one:
      </Text>
      <UnorderedList spacing={2}>
        <ListItem>
          <Link href="https://www.neopets.com/inventory.phtml" isExternal>
            Inventory
          </Link>{' '}
          - Name, Description, Image, Category, Rarity, Est. Val, Weight
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/safetydeposit.phtml" isExternal>
            Safety Deposit Box
          </Link>{' '}
          - Item ID, Name, Description, Image, Category (except for NC Items)
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/island/tradingpost.phtml" isExternal>
            Trading Post
          </Link>{' '}
          - Name, Description, Image
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/market.phtml?type=your" isExternal>
            Shops (your shop or restock)
          </Link>{' '}
          - Item ID, Name, Description, Image, Category
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/market_map.phtml" isExternal>
            User Shops
          </Link>{' '}
          - Item ID, Name, Description, Image
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/gallery/" isExternal>
            Gallery front page
          </Link>{' '}
          - Name, Description, Image
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/gallery/quickremove.phtml" isExternal>
            Gallery Admin Page
          </Link>{' '}
          - Item ID, Name, Image
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/closet.phtml" isExternal>
            Closet
          </Link>{' '}
          - Item ID, Name, Description, Image, Category
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/search.phtml" isExternal>
            Search Page
          </Link>{' '}
          - Name, Description, Image, Category, Rarity, Est. Val, Weight
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/neohome/shed" isExternal>
            Storage Shed
          </Link>{' '}
          - Item ID, Name, Description, Image, Category
        </ListItem>
        <ListItem>
          <Link href="http://ncmall.neopets.com/mall/shop.phtml?page=&cat=" isExternal>
            NC Mall
          </Link>{' '}
          - Item ID, Name, Description, Image
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/customise/" isExternal>
            Customization Page
          </Link>{' '}
          - (everything) Item ID, Name, Description, Image, Category, Rarity, Est. Val, Weight
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/ncma/" isExternal>
            NC Journal
          </Link>{' '}
          - Item ID, Name, Image
        </ListItem>
      </UnorderedList>
    </Flex>
  );
};
