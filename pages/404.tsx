/* eslint-disable react/no-unescaped-entities */
import { Heading, Text, Link, Center, Image, Button, Icon, useDisclosure } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import { FiSend } from 'react-icons/fi';
import Layout from '../components/Layout';
import { FeedbackModalProps } from '../components/Modal/FeedbackModal';

const FeedbackModal = dynamic<FeedbackModalProps>(
  () => import('../components/Modal/FeedbackModal')
);

const Error404Page = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Layout SEO={{ title: 'Page not Found', noindex: true }}>
      <FeedbackModal isOpen={isOpen} onClose={onClose} />
      <Center
        height="75vh"
        flexFlow="column"
        gap={3}
        sx={{ a: { color: 'blue.300' } }}
        textAlign="center"
      >
        <Heading mb={3}>Error 404</Heading>
        <Image
          src="https://images.neopets.com/themes/h5/grey/images/npc-left.png"
          alt="sad wocky 404"
        />
        <Text>The page you are looking for does not exist :(</Text>
        <Text>If you think it should exist, please use the button below to let us know.</Text>
        <Button variant="outline" size="sm" onClick={onOpen}>
          <Icon as={FiSend} mr={1} /> Feedback
        </Button>
        <Text fontSize="xs" opacity={0.87}>
          We think <Link href="/item/6543">this page</Link> might be appropriate instead...
        </Text>
      </Center>
    </Layout>
  );
};

export default Error404Page;
