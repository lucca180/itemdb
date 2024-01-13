/* eslint-disable react/no-unescaped-entities */
import { Heading, Text, Center, Image } from '@chakra-ui/react';
import Layout from '../components/Layout';
import { useTranslations } from 'next-intl';

const Error500Page = () => {
  const t = useTranslations();
  return (
    <Layout SEO={{ title: t('Error.internal-server-error') }}>
      <Center
        height="75vh"
        flexFlow="column"
        gap={3}
        sx={{ a: { color: 'blue.300' } }}
        textAlign="center"
      >
        <Heading mb={3}>{t('General.something-went-wrong')} :(</Heading>
        <Image
          src="https://images.neopets.com/homepage/maint/images/bottombg_maintenance_mobile.png"
          alt="meepits maintenance"
        />
        <Text>{t('Error.500-text-1')}</Text>
      </Center>
    </Layout>
  );
};

export default Error500Page;

export async function getStaticProps(context: any) {
  return {
    props: {
      messages: (await import(`../translation/${context.locale}.json`)).default,
    },
  };
}
