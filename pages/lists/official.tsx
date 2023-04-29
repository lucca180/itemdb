import { Flex, Heading, Text, Divider, Button, useDisclosure, Box } from '@chakra-ui/react';
import HeaderCard from '../../components/Card/HeaderCard';
import Layout from '../../components/Layout';
import ApplyListModal from '../../components/Modal/OfficialListApply';
import UserListCard from '../../components/UserLists/ListCard';
import { UserList } from '../../types';
import { useAuth } from '../../utils/auth';
import { getUserLists } from '../api/v1/lists/[username]';

type Props = {
  lists: UserList[];
};

const OfficialListsPage = (props: Props) => {
  const { lists } = props;
  const { user, authLoading } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Layout
      SEO={{
        title: 'Official Lists',
        description:
          'Official lists are especially useful lists for the entire neopia community. They may contain the prize pool of some daily link or event, for example, and deserve to be highlighted!',
        openGraph: {
          images: [
            {
              url: 'https://images.neopets.com/games/tradingcards/premium/0911.gif',
              width: 150,
              height: 150,
            },
          ],
        },
      }}
    >
      <ApplyListModal isOpen={isOpen} onClose={onClose} />
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/games/tradingcards/premium/0911.gif',
          alt: 'grundo warehouse thumbnail',
        }}
        color="#4962ec"
      >
        <Heading size="lg">Official Lists</Heading>
        <Text size={{ base: 'sm', md: undefined }}>
          Official lists are especially useful lists for the entire neopia community. <br />
          They may contain the prize pool of some daily link or event, for example, and deserve to
          be highlighted!
          <br />
          <br />
          Anyone can nominate their list to be official! It just needs to be very, very useful!
        </Text>
      </HeaderCard>
      <Divider />
      <Flex flexFlow="column" gap={3}>
        <Flex flexFlow="row" py={3} gap={3} flexWrap="wrap" alignItems="center">
          <Button variant="solid" isLoading={authLoading} onClick={onOpen} isDisabled={!user}>
            + Apply List
          </Button>
          <Text as="div" textColor={'gray.300'} fontSize="sm">
            {lists.length} lists
          </Text>
        </Flex>
        <Flex mt={5} gap={4} flexWrap="wrap" justifyContent={'center'}>
          {lists.map((list) => (
            <Box key={list.internal_id} flex="1">
              <UserListCard list={list} />
            </Box>
          ))}
        </Flex>
      </Flex>
    </Layout>
  );
};

export default OfficialListsPage;

export async function getServerSideProps() {
  const lists = await getUserLists('official');

  return {
    props: {
      lists,
    },
  };
}
