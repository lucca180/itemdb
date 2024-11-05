/* eslint-disable react/no-unescaped-entities */
import { Flex, Heading, Text } from '@chakra-ui/react';
import HeaderCard from '../components/Card/HeaderCard';
import Layout from '../components/Layout';
import { ReactElement } from 'react';

const TermsPage = () => {
  return (
    <>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/caption/sm_caption_1252.gif',
          alt: 'xweetok agent thumbnail',
        }}
        color="#a5aa9f"
      >
        <Heading size="lg">Terms of Use (April 2023)</Heading>
        <Text size={{ base: 'sm', md: undefined }}>
          This page outlines the terms of use for itemdb, its features, and API.
        </Text>
      </HeaderCard>
      <Flex flexFlow="column" gap={3} sx={{ a: { color: '#cec2c2' }, b: { color: '#ffffff' } }}>
        <Flex flexFlow="column" gap={3} maxW="1000px">
          <Heading size="lg">Absolutely no cheating.</Heading>
          <Text>
            <b>
              You may not use the itemdb or any of its features or data, including API, to use or
              distribute any program/script that provides unfair advantage in any way or break any
              (reasonable) Neopets rule.
            </b>{' '}
            This includes but is not limited to: using the itemdb API to automatically buy/sell
            items on Neopets or using price data to gain unfair advantage restocking (e.g item
            highlighting).
          </Text>
          <Text>
            We reserve the right to ban any user who violates this rule. We also reserve the right
            to ban any user who we believe is using the itemdb or its API to cheat in any way.
          </Text>
          <Heading size="lg">Using itemdb</Heading>
          <Text>
            You may use the itemdb website and its features for personal use only. You may not use
            the itemdb website or its features for commercial use. That means that you cannot use,
            sell or distribute any program/script that uses the itemdb data for profit. You also may
            not use itemdb to sell items for real money.
          </Text>
          <Text>
            Bear in mind that lots of itemdb content are property of NeoPets Inc. and we have
            permission to use it. We do not own any of Neopets content and we do not claim to own
            any of it. We are not affiliated with Neopets Inc. in any way.
          </Text>
          <Text>
            Be thoughtful when using the itemdb API. Most of personal uses are fine, but heavy use
            of the API can cause performance issues for the site. If you are using the API for a
            project, please contact us and we will be happy to help you. We reserve the right to
            refuse service to anyone who we believe is using the site or its API in a way that is
            detrimental to the site or its community.
          </Text>
          <Heading size="lg">User Generated Content</Heading>
          <Text>
            itemdb can provide you with the ability to create and share content. You are responsible
            for the content you create and share. Please keep any content you create and share
            appropriate for all ages. We reserve the right to remove any content we believe is
            inappropriate.
          </Text>
          <Text>
            When creating content on itemdb, such as lists, you are granting us a license to use
            that content as a part of the itemdb website or any other Magnetismo Times project with
            proper attributions. Bear in mind that any public content you create on itemdb can be
            accessed by anyone, including other users and search engines.
          </Text>
          <Text>
            Users can also contribute to the itemdb database. When you choose to submit any
            contribution to itemdb you are giving up all rights to that data. You are also giving us
            permission to use that data in any way we see fit.
          </Text>
          <Text>
            Official Lists are a special type of user generated content. Official Lists are curated
            by users who have applied to be an Official List Curator. As a curator, you are no
            longer owner of the list. We reserve the right to intervene in any official list in any
            way we see fit to ensure the quality of the list and the information it contains.
          </Text>
          <Heading size="lg">Liability</Heading>
          <Text>
            The itemdb data is not guaranteed to be accurate. We do our best to keep the data up to
            date and accurate, but we cannot guarantee that it is. We are not responsible for any
            losses you may incur as a result of using itemdb data.
          </Text>
        </Flex>
      </Flex>
    </>
  );
};

export default TermsPage;

export async function getStaticProps(context: any) {
  return {
    props: {
      messages: (await import(`../translation/${context.locale}.json`)).default,
      locale: context.locale,
    },
  };
}

TermsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout
      SEO={{
        title: 'Terms of Use',
        description: 'This page outlines the terms of use for itemdb, its features, and API.',
      }}
      mainColor="#a5aa9fc7"
    >
      {page}
    </Layout>
  );
};
