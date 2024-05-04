/* eslint-disable react/no-unescaped-entities */
import { Heading, Text, Center, Image } from '@chakra-ui/react';
import Layout from '../../../components/Layout';
// import { useTranslations } from 'next-intl';

const Error500Page = () => {
  return (
    <Layout SEO={{ title: 'Restock Dashboard' }}>
      <Center
        height="75vh"
        flexFlow="column"
        gap={3}
        sx={{ a: { color: 'blue.300' } }}
        textAlign="center"
      >
        <Heading mb={3}>Restock Dashboard is down for maintenance</Heading>
        <Image
          src="https://images.neopets.com/homepage/maint/images/bottombg_maintenance_mobile.png"
          alt="meepits maintenance"
          borderRadius={'md'}
        />
        <Text>
          The Restock Dashboard is disabled while we investigate some issues.
          <br />
          Rest assured, your data is safe. Unless they are the reason for our problem, then they
          will be annihilated!
          <br />
          We expect to be back very shortly!
        </Text>
      </Center>
    </Layout>
  );
};

export default Error500Page;

export async function getStaticProps(context: any) {
  return {
    props: {
      messages: (await import(`../../../translation/${context.locale}.json`)).default,
    },
  };
}
