import { Flex, Heading, Text, Divider, Button, useDisclosure, Box } from '@chakra-ui/react';
import HeaderCard from '../../components/Card/HeaderCard';
import Layout from '../../components/Layout';
import { ApplyListModalProps } from '../../components/Modal/OfficialListApply';
import UserListCard from '../../components/UserLists/ListCard';
import { UserList } from '../../types';
import { useAuth } from '../../utils/auth';
import { getUserLists } from '../api/v1/lists/[username]';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import useSWRImmutable from 'swr/immutable';
import axios from 'axios';

const fetcher = (url: string) => axios.get(url).then((res) => res.data as UserList[]);

const ApplyListModal = dynamic<ApplyListModalProps>(
  () => import('../../components/Modal/OfficialListApply')
);

type Props = {
  lists: UserList[];
};

const OfficialListsPage = (props: Props) => {
  const t = useTranslations();
  const { lists: propLists } = props;
  const { data: lists } = useSWRImmutable(`/api/v1/lists/official?includeItems=false`, fetcher, {
    shouldRetryOnError: false,
  });
  const { user, authLoading } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Layout
      SEO={{
        title: t('General.official-lists'),
        description: t('Lists.officialList-description'),
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
        <Heading size="lg">{t('General.official-lists')}</Heading>
        <Text size={{ base: 'sm', md: undefined }}>
          {t.rich('Lists.officialList-subheader', {
            br: () => <br />,
          })}
        </Text>
      </HeaderCard>
      <Divider />
      <Flex flexFlow="column" gap={3}>
        <Flex flexFlow="row" py={3} gap={3} flexWrap="wrap" alignItems="center">
          <Button variant="solid" isLoading={authLoading} onClick={onOpen} isDisabled={!user}>
            + {t('Lists.official-apply-list')}
          </Button>
          <Text as="div" textColor={'gray.300'} fontSize="sm">
            {lists && (
              <>
                {lists.length} {t('General.lists')}
              </>
            )}
          </Text>
        </Flex>
        <Flex mt={5} gap={4} flexWrap="wrap" justifyContent={'center'}>
          {(lists ?? propLists).map((list) => (
            <Box key={list.internal_id} flex={{ base: 1, md: 'initial' }}>
              <UserListCard list={list} />
            </Box>
          ))}
        </Flex>
      </Flex>
    </Layout>
  );
};

export default OfficialListsPage;

export async function getServerSideProps(context: any) {
  const lists = await getUserLists('official', null, false, 15);

  return {
    props: {
      lists,
      messages: (await import(`../../translation/${context.locale}.json`)).default,
    },
  };
}
