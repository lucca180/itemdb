/* eslint-disable react/no-unescaped-entities */
import { Heading, Text, Center, Image } from '@chakra-ui/react';
import Layout from '../components/Layout';

const Error500Page = () => {
  return (
    <Layout SEO={{ title: 'Internal Server Error' }}>
      <Center
        height="75vh"
        flexFlow="column"
        gap={3}
        sx={{ a: { color: 'blue.300' } }}
        textAlign="center"
      >
        <Heading mb={3}>Something went wrong :(</Heading>
        <Image
          src="https://images.neopets.com/homepage/maint/images/bottombg_maintenance_mobile.png"
          alt="meepits maintenance"
        />
        <Text>
          This error has been reported and our meepits will be working on it as soon as possible.
        </Text>
      </Center>
    </Layout>
  );
};

export default Error500Page;
