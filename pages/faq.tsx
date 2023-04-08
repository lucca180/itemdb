/* eslint-disable react/no-unescaped-entities */
import { Flex, Heading, Text, Link } from '@chakra-ui/react';
import HeaderCard from '../components/Card/HeaderCard';
import Layout from '../components/Layout';

const PrivacyPolicyPage = () => {
  return (
    <Layout SEO={{ title: 'Frequent Asked Questions' }}>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/desert/usurper_clue.gif',
          alt: 'xweetok agent thumbnail',
        }}
        color="#4bbde0"
      >
        <Heading size="lg">Frequent Asked Question</Heading>
        <Text size={{ base: 'sm', md: undefined }}>
          Here you can find the most frequent asked questions about the itemdb.
        </Text>
      </HeaderCard>
      <Flex flexFlow="column" gap={3} sx={{ a: { color: 'cyan.400' }, b: { color: 'blue.300' } }}>
        <Flex flexFlow="column" gap={3} maxW="1000px">
          <Heading size="md">What is the itemdb?</Heading>
          <Text>
            The itemdb is a{' '}
            <Link href="https://github.com/lucca180/itemdb/" isExternal>
              open source
            </Link>{' '}
            database for neopets items. It is a community driven project where everyone can{' '}
            <Link href="/contribute" isExternal>
              contribute
            </Link>
            .<br />
            <br />
            Our goal is to provide as much <b>information</b> as possible about neopets items and
            make it easy for you to find <b>new and interesting items</b> whether it be for your{' '}
            <Text as="span" color="pink.300" fontWeight="bold">
              pink themed gallery
            </Text>{' '}
            or putting together a <b>cool outfit for your pet</b>.
            <br />
            <br />
            As a <b>community-supported project</b>, we think it's fair that everyone can use our
            data for their projects (read our <Link href="/terms">terms</Link> first!). Want to{' '}
            <b>calculate neopia inflation</b> in an almost scientifically accurate way? Or{' '}
            <Link
              href="https://github.com/lucca180/itemdb/raw/main/userscripts/sortGallery.user.js"
              isExternal
            >
              sort your gallery by color
            </Link>
            ? Just take a look at our{' '}
            <Link href="https://itemdb.stoplight.io/docs/itemdb-api" isExternal>
              API
            </Link>
            .
          </Text>
          <Heading size="md" mt={5}>
            How can I help?
          </Heading>
          <Text>
            We have a page dedicated to the different ways you can{' '}
            <Link href="/contribute">contribute to the itemdb</Link>.
          </Text>
          <Heading size="md" mt={5}>
            Can i talk about itemdb on Neopets?
          </Heading>
          <Text>
            itemdb is a{' '}
            <Link href="http://magnetismotimes.com/" isExternal>
              Magnetismo Times
            </Link>{' '}
            project and, as Certified Site, you should be able to talk about it on Neopets - but you
            cannot link to it. Yet.
          </Text>
          <Heading size="md" mt={5}>
            You have a lot of missing or wrong info...
          </Heading>
          <Text>
            All the information on the itemdb is provided by users like you using our{' '}
            <Link href="/contribute">Item Data Extractor Script</Link>. Most of the time, as soon
            the correct information hits our database, it will be automatically updated on the site
            and you should not worry about it.
            <br />
            <br />
            But sometimes, when TNT changes something, our algorithm will fall into a merge conflict
            and we will need to give it a check manually. If that is the case, you can help us by
            reporting the issue using the <b>Feedback Button</b> on each item's pages.
          </Text>
        </Flex>
      </Flex>
    </Layout>
  );
};

export default PrivacyPolicyPage;
