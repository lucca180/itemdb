import {
  Center,
  Heading,
  Text,
  Flex,
  Select,
  FormControl,
  FormHelperText,
  FormLabel,
  Button,
  useToast,
  Box,
} from '@chakra-ui/react';
import HeaderCard from '../../components/Card/HeaderCard';
import Layout from '../../components/Layout';
import { createTranslator, useTranslations } from 'next-intl';
import ItemSelect from '../../components/Input/ItemSelect';
import { ItemData } from '../../types';
import { ReactElement, useState } from 'react';
import ItemCard from '../../components/Items/ItemCard';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { NextPageContext, NextApiRequest } from 'next';
import { CheckAuth } from '../../utils/googleCloud';

const DATA_COLLECTING_OPTIONS: {
  [id: string]: {
    name: string;
    id: string;
    multiple: boolean;
    description: string;
  };
} = {
  dailyQuests: {
    name: 'Daily Quests',
    id: 'dailyQuests',
    multiple: true,
    description: 'We are collecting data on the new Daily Rewards in the Quest Log.',
  },
  weeklyQuests: {
    name: 'Weekly Quests',
    id: 'weeklyQuests',
    multiple: true,
    description: 'We are collecting data on the new Weekly Rewards in the Quest Log.',
  },
};

const DataCollectingPage = () => {
  const t = useTranslations();
  const toast = useToast();
  const [itemList, setItemList] = useState<ItemData[]>([]);
  const [type, setType] = useState<string>('');
  const onChange = (item: ItemData) => {
    const items = [...itemList].filter((i) => i.internal_id !== item.internal_id);
    items.push(item);
    setItemList(items);
  };

  const submit = async () => {
    const obj = {
      type: type,
      itemList: itemList.map((item) => item.internal_id).join(','),
    };

    const resProm = axios.post('/api/v1/tools/data-collecting', obj);
    toast.promise(resProm, {
      success: { title: t('General.success'), description: t('General.thank-you') },
      error: {
        title: t('General.something-went-wrong'),
        description: t('General.try-again-later'),
      },
      loading: { title: t('General.sending-dots') },
    });

    const res = await resProm;

    console.log(res.data);

    setItemList([]);
  };

  return (
    <>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/caption/sm_caption_982.gif',
          alt: 'quiz-giver thumbnail',
        }}
        color="#b4ff53"
      >
        <Heading size="lg">Data Collecting Tool</Heading>
        <Text size={{ base: 'sm', md: undefined }}>
          This tool is designed to help us collect certain data that we can&apos;t capture
          automatically (mostly some prize pools)
        </Text>
      </HeaderCard>
      <Flex justifyContent={'space-between'} w={'100%'} gap={8}>
        <Flex flexFlow={'column'} w="100%" maxW={'500px'}>
          <FormControl my={5}>
            <FormLabel>Type</FormLabel>
            <Select
              variant="solid"
              bg={'blackAlpha.300'}
              onChange={(e) => setType(e.target.value)}
              value={type}
            >
              <option value="">Select Type</option>
              {Object.values(DATA_COLLECTING_OPTIONS).map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
            <FormHelperText>
              We&apos;re only seeking data from these places right now. We can add more in the
              future!
            </FormHelperText>
          </FormControl>
          <Box my={5}>
            <FormLabel>Item</FormLabel>
            <ItemSelect isDisabled={!type} onChange={onChange} />
          </Box>
          <Center mt={4} gap={3}>
            <Button
              disabled={!itemList.length}
              colorScheme="gray"
              variant="ghost"
              onClick={() => setItemList([])}
            >
              Clear
            </Button>
            <Button
              disabled={!itemList.length}
              colorScheme="green"
              variant="ghost"
              onClick={submit}
            >
              Submit
            </Button>
          </Center>
        </Flex>
        <Flex flexFlow="column" w={'100%'}>
          <Flex flexFlow="column" mb={3}>
            <Heading as="h3" size="md" textAlign={'center'}>
              {DATA_COLLECTING_OPTIONS[type]?.name}
            </Heading>
            <Text fontSize={'sm'} textAlign={'center'}>
              {DATA_COLLECTING_OPTIONS[type]?.description}
            </Text>
          </Flex>
          <Flex flex={1} borderRadius={'md'} bg="blackAlpha.500" p={3} gap={3}>
            {!!itemList.length && (
              <>
                <Flex gap={3} flexWrap={'wrap'} justifyContent={'center'}>
                  {itemList.map((item) => (
                    <ItemCard key={item.internal_id} item={item} small />
                  ))}
                </Flex>
              </>
            )}
            {!itemList.length && (
              <Center flex="1">
                <Text color="gray.400">No items selected</Text>
              </Center>
            )}
          </Flex>
        </Flex>
      </Flex>
    </>
  );
};

export default DataCollectingPage;

export async function getServerSideProps(context: NextPageContext) {
  try {
    const token = getCookie('userToken', { req: context.req, res: context.res }) as
      | string
      | undefined
      | null;

    if (!token) throw new Error('No token found');

    const check = await CheckAuth(context.req as NextApiRequest, token);
    if (!check.user) throw new Error('User not found');

    if (check.user.banned) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        messages: (await import(`../../translation/${context.locale}.json`)).default,
        locale: context.locale,
      },
    };
  } catch (e) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
}

DataCollectingPage.getLayout = function getLayout(page: ReactElement, props: any) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });
  return (
    <Layout
      SEO={{
        title: 'Data Collecting Tool',
        description: t('Feedback.feedback-system-description'),
        noindex: true,
      }}
      mainColor="#abf14ec7"
    >
      {page}
    </Layout>
  );
};
