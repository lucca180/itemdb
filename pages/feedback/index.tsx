import { Button, Flex, Heading, Icon, ListItem, Text, UnorderedList } from '@chakra-ui/react';
import { BsCheckAll, BsPencilFill } from 'react-icons/bs';
import CardBase from '../../components/Card/CardBase';
import Layout from '../../components/Layout';

const FeedbackPage = () => {
  return (
    <Layout SEO={{ title: 'Feedback' }}>
      <Heading>The Feedback System</Heading>
      <Text>
        Most of our content is collected and categorized automatically but there are some things our
        machines can&apos;t do. And you can help it!
      </Text>
      <Flex mt={12}>
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
        <Flex flex="1" flexFlow="column" alignItems="center">
          <Heading size="lg">I want to</Heading>
          <Flex flex="1" justifyContent="center" alignItems="center" gap={12}>
            <Button
              bg="gray.700"
              w={200}
              h={200}
              gap={6}
              flexFlow="column"
              justifyContent="center"
              alignItems="center"
              borderRadius="md"
              textAlign={'center'}
            >
              <Icon boxSize={10} as={BsPencilFill} color="purple.200" />
              <Text fontSize="md" fontWeight="bold">
                Suggest
              </Text>
            </Button>
            <Button
              bg="gray.700"
              w={200}
              h={200}
              gap={6}
              flexFlow="column"
              justifyContent="center"
              alignItems="center"
              borderRadius="md"
              textAlign={'center'}
            >
              <Icon boxSize={10} as={BsCheckAll} color="green.200" />
              <Text fontSize="md" fontWeight="bold">
                Vote
              </Text>
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Layout>
  );
};

export default FeedbackPage;
