import { Heading, Text, Link, Center, Image, Box } from '@chakra-ui/react';
import Layout from '../components/Layout';
import { useTranslations } from 'next-intl';
import { loadTranslation } from '@utils/load-translation';
import FeedbackButton from '@components/Feedback/FeedbackButton';

const Error404Page = () => {
  const t = useTranslations();

  return (
    <Layout SEO={{ title: t('Error.page-not-found'), noindex: true }} mainColor="#ff6464c7">
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(255, 100, 100, 0.7) 70%)`}
        zIndex={-1}
      />
      <Center
        height="75vh"
        flexFlow="column"
        gap={3}
        sx={{ a: { color: 'blue.300' } }}
        textAlign="center"
      >
        <Heading mb={3}>{t('Error.error-404')}</Heading>
        <Image
          src="https://images.neopets.com/themes/h5/grey/images/npc-left.png"
          alt="sad wocky 404"
        />
        <Text>{t('Error.404-text-1')}</Text>
        <Text>{t('Error.404-text-2')}</Text>
        <FeedbackButton />
        <Text fontSize="xs" opacity={0.87}>
          {t.rich('Error.404-text-3', {
            Link: (chunk) => <Link href="/item/6543">{chunk}</Link>,
          })}
        </Text>
      </Center>
    </Layout>
  );
};

export default Error404Page;

export async function getStaticProps(context: any) {
  return {
    props: {
      messages: await loadTranslation(context.locale, '404'),
    },
  };
}
