/* eslint-disable react/no-unescaped-entities */
import {
  Divider,
  Flex,
  Heading,
  Text,
  Link,
  List,
  ListIcon,
  ListItem,
  useMediaQuery,
} from '@chakra-ui/react';
import { BsCheckCircleFill, BsXCircleFill } from 'react-icons/bs';
import HeaderCard from '../components/Card/HeaderCard';
import Layout from '../components/Layout';

const ContributePage = () => {
  const [isLargerThanMD] = useMediaQuery('(min-width: 48em)', { fallback: true });

  return (
    <Layout SEO={{ title: 'How to Contribute' }}>
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
        <Divider />
        <Flex flexFlow="column" gap={3} maxW="1000px">
          <Heading size="lg">Using the Item Data Extractor</Heading>
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
            will collect data from all items you come across during your adventures in Neopia.
            Whether you're searching for something on the <b>Shop Wizard</b>, browsing through your{' '}
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
            . <br /> Also, the script code is commented so that you can understand everything that
            is happening.
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
            . It is secure, and the code is open-source (in fact, all of our code is). With the
            script, you can help us complete missing information and keep prices up to date!
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
                The usernames of item sellers (shops, auctions, and trades) and bidders are
                collected, but <b>only the first 3 characters</b> are stored in our database.
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
                This is used to prevent abuse, spam and false information. It's never public
                available and cannot be used to identify you.
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
      </Flex>
    </Layout>
  );
};

export default ContributePage;
