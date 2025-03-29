/* eslint-disable react/no-unescaped-entities */
import { Flex, Heading, Text, Link, ListItem, UnorderedList } from '@chakra-ui/react';
import HeaderCard from '../components/Card/HeaderCard';
import Layout from '../components/Layout';
import { ReactElement } from 'react';

const PrivacyPolicyPage = () => {
  return (
    <>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/nt/ntimages/441_xweetok_agent.gif',
          alt: 'xweetok agent thumbnail',
        }}
        color="#7AB92A"
      >
        <Heading as="h1" size="lg">
          Privacy Policy (August 2023)
        </Heading>
        <Text as="h2" size={{ base: 'sm', md: undefined }}>
          itemdb collects some personal data during its use. No information is sold or used for
          advertising.
          <br />
          Here we will detail more about how we collect, process, and use your data.
        </Text>
      </HeaderCard>
      <Flex flexFlow="column" gap={3} sx={{ a: { color: '#7AB92A' }, b: { color: '#7AB92A' } }}>
        <Flex flexFlow="column" gap={3} maxW="1000px">
          <Heading size="lg">What data do we collect and how we use it?</Heading>
          <Text>
            We collect your email address when you choose to create an account. This info is used to
            power features such as user lists. We may also collect your IP address when you visit
            the site or use the itemdb API (such as when you use the itemdb's userscripts). We use
            this info to help prevent abuse of the site and API. We also use your local storage to
            store your preferences.
          </Text>
          <Text>
            We also use third party services to help us run the site. These services may collect and
            process data about your use of the site such as IP address and cookies. These services
            include:
          </Text>
          <UnorderedList spacing={3}>
            <ListItem>
              <Link href="https://simpleanalytics.com" isExternal>
                SimpleAnalytics
              </Link>
              <Text fontSize="sm" color="gray.400">
                We need this data to understand how you use our website so we can improve its design
                and functionality.
              </Text>
            </ListItem>
            <ListItem>
              <Link href="https://www.cloudflare.com/">Cloudflare</Link>
              <Text fontSize="sm" color="gray.400">
                We use Cloudflare to help protect our site from attacks and to help speed up your
                experience.
              </Text>
            </ListItem>
            <ListItem>
              <Link href="https://firebase.google.com/" isExternal>
                Firebase
              </Link>
              <Text fontSize="sm" color="gray.400">
                We use Firebase to help us store and manage user accounts.
              </Text>
            </ListItem>
            <ListItem>
              <Link href="https://sentry.io/" isExternal>
                Sentry
              </Link>
              <Text fontSize="sm" color="gray.400">
                We use Sentry to help us track errors and crashes on the site.
              </Text>
            </ListItem>
          </UnorderedList>
          <Heading size="lg">Your Contributions and Creations</Heading>
          <Text>
            You may choose to contribute to the site by using our Item Data Extractor script. This
            script will allow you to extract data from the Neopets and upload it to the itemdb. This
            data will be publicly available to all users of the site. No personally identifiable
            information will be collected or stored by any of our scripts without your explicit
            consent.
          </Text>
          <Text>
            You may also choose to create a user list. This list can be made public, unlisted or
            private. Public lists will be visible to all users of the site. Unlisted lists will be
            visible to all users that have the link. Private lists will only be visible to you. You
            can choose to make your list public or private at any time. You can also choose to
            delete your list at any time.
          </Text>
          <Text>
            Your Neopets username, if you set one, may be visible to all users of the site. This is
            done to allow and facilitate item trades between itemdb users. We may also track and
            display the last time you used the site. This is done to help other users to find active
            users to trade with.
          </Text>
          <Text>
            We can also label your items in a list as "imported", this means that the item was
            imported to your list from Neopets using an importer tool. This is done to ensure that
            any cap price you set for an NC Item is legit and a fake price to inflate the item
            market price. We currently do not display publicly this information and the Neopets
            account username where the item was imported from is not collected or stored.
          </Text>
          <Text>
            Your lists may be labed as "official" by the itemdb staff. This means that the list
            curated by you has a public utility. Your itemdb username will be displayed as list
            curator. All official lists will be visible to all users of the site. You cannot delete
            an official list. If you wish to be removed from an official list, please contact us.
          </Text>
        </Flex>
      </Flex>
    </>
  );
};

export default PrivacyPolicyPage;

export async function getStaticProps(context: any) {
  return {
    props: {
      messages: (await import(`../translation/${context.locale}.json`)).default,
      locale: context.locale,
    },
  };
}

PrivacyPolicyPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout
      SEO={{
        title: 'Privacy Policy',
        description:
          'itemdb collects some personal data during its use. Here we will detail more about how we collect, process, and use your data.',
      }}
      mainColor="#7AB92Ac7"
    >
      {page}
    </Layout>
  );
};
