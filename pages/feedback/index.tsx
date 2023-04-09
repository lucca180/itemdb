import {
  Button,
  Flex,
  Heading,
  Icon,
  ListItem,
  Text,
  UnorderedList,
  useDisclosure,
} from '@chakra-ui/react';
import Link from 'next/link';
import { BsCheckAll, BsPencilFill } from 'react-icons/bs';
import { FiSend } from 'react-icons/fi';
import CardBase from '../../components/Card/CardBase';
import HeaderCard from '../../components/Card/HeaderCard';
import Layout from '../../components/Layout';
import FeedbackModal from '../../components/Modal/FeedbackModal';

const FeedbackPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Layout SEO={{ title: 'Feedback' }}>
      <FeedbackModal isOpen={isOpen} onClose={onClose} />
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/altador/altadorcup/link_images/2008/help_me_decide.gif',
          alt: 'quiz-giver thumbnail',
        }}
        // color="#7AB92A"
      >
        <Heading size="lg">The Feedback System</Heading>
        <Text size={{ base: 'sm', md: undefined }}>
          Most of our content is collected and categorized automatically but there are some things
          our machines can&apos;t do. And you can help it!
        </Text>
      </HeaderCard>
      <Flex
        mt={8}
        gap={6}
        alignItems={{ base: 'center', md: 'flex-start' }}
        flexFlow={{ base: 'column', md: 'row' }}
      >
        <CardBase chakraWrapper={{ flex: 1 }} title="How it works?" chakra={{ bg: 'gray.700' }}>
          <Text>
            You can contribute by manually completing missing data or by validating the suggestions
            of other neopians like you!
            <br />
            <br />
            Either way, the more you contribute correctly the more our systems will trust your
            information - meaning your suggestions will be live faster.
          </Text>
          <Heading size="md" mt={6}>
            Suggesting
          </Heading>
          <Text>As suggesting you can be asked to:</Text>
          <UnorderedList mt={3}>
            <ListItem>Price Trade Lots</ListItem>
            <ListItem>Search and fill missing data</ListItem>
          </UnorderedList>
          <Heading size="md" mt={6}>
            Voting
          </Heading>
          <Text>As voting you can be asked to:</Text>
          <UnorderedList mt={3}>
            <ListItem>Perform fact-checking on the suggested information</ListItem>
            <ListItem>Upvote suggestions with correct and relevant information</ListItem>
            <ListItem>Downvote fraudulent suggestions or spam</ListItem>
          </UnorderedList>
        </CardBase>
        <Flex flex="1" flexFlow="column" alignSelf="stretch" alignItems="center" gap={6}>
          <Heading size="md">I want to</Heading>
          <Flex flex="1" gap={3} flexFlow="column" justifyContent="center">
            <Button
              bg="gray.700"
              as={Link}
              href="/feedback/trades"
              p={6}
              gap={3}
              borderRadius="md"
              textAlign={'center'}
              leftIcon={<Icon boxSize={5} as={BsPencilFill} color="purple.200" />}
            >
              <Text fontSize="md" fontWeight="bold">
                Price Trades
              </Text>
            </Button>
            <Button
              bg="gray.700"
              as={Link}
              href="/feedback/vote"
              p={6}
              borderRadius="md"
              textAlign={'center'}
              leftIcon={<Icon boxSize={10} as={BsCheckAll} color="green.200" />}
            >
              <Text fontSize="md" fontWeight="bold">
                Vote Suggestions
              </Text>
            </Button>
            <Button
              bg="gray.700"
              onClick={onOpen}
              p={6}
              borderRadius="md"
              textAlign={'center'}
              leftIcon={<Icon boxSize={6} as={FiSend} />}
            >
              <Text fontSize="md" fontWeight="bold">
                Send Feedback
              </Text>
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Layout>
  );
};

export default FeedbackPage;
