/* eslint-disable react/no-unescaped-entities */
import {
  Heading,
  Text,
  Link,
  Center,
  Image,
  Button,
  Icon,
  useDisclosure,
  Box,
} from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import { FiSend } from 'react-icons/fi';
import Layout from '../components/Layout';
import { FeedbackModalProps } from '../components/Modal/FeedbackModal';
import { useTranslations } from 'next-intl';

const FeedbackModal = dynamic<FeedbackModalProps>(
  () => import('../components/Modal/FeedbackModal'),
);

const Error404Page = () => {
  const t = useTranslations();
  const { isOpen, onOpen, onClose } = useDisclosure();

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
      <FeedbackModal isOpen={isOpen} onClose={onClose} />
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
        <Button variant="outline" size="sm" onClick={onOpen}>
          <Icon as={FiSend} mr={1} /> {t('Button.feedback')}
        </Button>
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
      messages: (await import(`../translation/${context.locale}.json`)).default,
    },
  };
}
