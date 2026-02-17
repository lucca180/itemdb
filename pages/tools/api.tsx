import {
  Center,
  Heading,
  Text,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Button,
  useToast,
  Box,
  Input,
  Textarea,
} from '@chakra-ui/react';
import HeaderCard from '../../components/Card/HeaderCard';
import Layout from '../../components/Layout';
import { useFormatter } from 'next-intl';
import { APIKeyData } from '../../types';
import { ReactElement, useState } from 'react';
import axios from 'axios';
import { NextApiRequest, GetServerSidePropsContext } from 'next';
import { CheckAuth } from '../../utils/googleCloud';
import { loadTranslation } from '@utils/load-translation';
import { getAPIKeys } from '../api/auth/apikeys';

type APIKeysPageProps = {
  apiKeys: APIKeyData[];
  messages: Record<string, string>;
  locale: string;
};

const APIKeysPage = (props: APIKeysPageProps) => {
  // const t = useTranslations();
  const formatter = useFormatter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [apiCreateResult, setApiCreateResult] = useState<APIKeyData | null>(null);

  const keys = [...props.apiKeys, ...(apiCreateResult ? [apiCreateResult] : [])];

  const isCreateDisabled = keys.length >= 3;

  const createKey = async () => {
    const name = (document.getElementById('api-key-name') as HTMLInputElement)?.value;
    const description = (document.getElementById('api-key-description') as HTMLInputElement)?.value;

    if (!name || !description) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in both the name and description fields to create an API key.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post('/api/auth/apikeys', { name, description });
      setApiCreateResult(res.data);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error creating API Key',
        description: 'An error occurred while creating the API key.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteKey = async (key_id: number) => {
    const prom = axios.delete('/api/auth/apikeys', { data: { key_id } }).then(() => {
      window.location.reload();
    });

    toast.promise(prom, {
      loading: {
        title: 'Deleting Key',
      },
      success: {
        title: 'Key Deleted',
        description: 'Refreshing the page to update the list of keys',
      },
      error: {
        title: 'Error deleting API Key',
        description: 'An error occurred while deleting the API key.',
      },
    });
  };

  return (
    <>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/nt/ntimages/147_grundo_programmer.gif',
          alt: 'grundo programmer thumbnail',
        }}
        color="#c853ff"
      >
        <Heading as="h1" size="lg">
          API Keys
        </Heading>
        <Text size={{ base: 'sm', md: undefined }}>Create and manage your itemdb API Keys</Text>
      </HeaderCard>
      <Flex
        flexFlow={{ base: 'column-reverse', md: 'row' }}
        justifyContent={'space-between'}
        w={'100%'}
        gap={8}
      >
        <Flex
          flex={1}
          flexFlow={'column'}
          gap={4}
          bg="blackAlpha.400"
          p={4}
          borderRadius="md"
          maxW="700px"
        >
          <Heading size="md">Your API Keys ({keys.length}/3)</Heading>
          {keys.length === 0 && <Text fontSize={'sm'}>You don&apos;t have any API keys yet</Text>}

          {keys.map((apiKey) => (
            <Box key={apiKey.key_id} p={3} bg="blackAlpha.300" borderRadius="md">
              <Flex justifyContent={'space-between'} alignItems="center">
                <Flex
                  flexFlow={'column'}
                  alignItems="flex-start"
                  gap={1}
                  opacity={!apiKey.active ? '0.7' : '1'}
                >
                  {!apiKey.active && (
                    <Text fontSize={'xs'} color="red.400">
                      This key is inactive and will be removed from the system after 24 hours
                    </Text>
                  )}
                  <Text fontWeight={'bold'}>{apiKey.name}</Text>
                  <Text fontSize={'sm'}>{apiKey.description}</Text>
                  {apiKey.api_key && (
                    <FormControl my={3} fontSize={'xs'} bg="blackAlpha.500" p={2} borderRadius="md">
                      <FormLabel fontSize={'sm'} color="whiteAlpha.600">
                        API Key
                      </FormLabel>
                      <Input
                        size="sm"
                        value={apiKey.api_key}
                        isReadOnly
                        variant={'filled'}
                        maxW="400px"
                      />
                      <FormHelperText fontSize={'xs'} color="whiteAlpha.600">
                        This is the only time you will see this key, make sure to copy it and keep
                        it secure.
                      </FormHelperText>
                    </FormControl>
                  )}
                  <Text fontSize={'xs'} color="gray.400">
                    Created At: {formatter.dateTime(new Date(apiKey.createdAt))} | Limit:{' '}
                    {apiKey.limit === -1 ? 'Unlimited' : apiKey.limit} items
                  </Text>
                </Flex>
                {apiKey.active && (
                  <Button
                    colorScheme="red"
                    variant={'outline'}
                    size={'xs'}
                    onClick={() => deleteKey(apiKey.key_id)}
                  >
                    Delete
                  </Button>
                )}
              </Flex>
            </Box>
          ))}
        </Flex>

        <Flex
          flex={1}
          flexFlow={'column'}
          gap={4}
          bg="blackAlpha.400"
          p={4}
          borderRadius="md"
          maxW="700px"
        >
          <Heading size="md">Create New Key</Heading>
          <Text fontSize={'sm'}>
            You can have up to 3 API Keys at a time. Deleting a key still counts towards your limit
            for 24 hours.
          </Text>
          <FormControl isDisabled={isCreateDisabled}>
            <FormLabel>Name</FormLabel>
            <Input id="api-key-name" name="name" variant={'filled'} />
            <FormHelperText>Give your API key a name to identify it later</FormHelperText>
          </FormControl>
          <FormControl isDisabled={isCreateDisabled}>
            <FormLabel>Description</FormLabel>
            <Textarea id="api-key-description" name="description" variant={'filled'} />
            <FormHelperText>
              Provide a brief description on what you will use this API key for
            </FormHelperText>
          </FormControl>
          <Center mt={3}>
            <Button
              colorScheme="purple"
              maxW="200px"
              isLoading={isLoading}
              onClick={createKey}
              isDisabled={isCreateDisabled}
            >
              Create API Key
            </Button>
          </Center>
        </Flex>
      </Flex>
    </>
  );
};

export default APIKeysPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  try {
    const check = await CheckAuth(context.req as NextApiRequest);
    if (!check.user) throw new Error('User not found');

    if (check.user.banned) {
      return {
        notFound: true,
      };
    }

    const apiKeys = await getAPIKeys(check.user.id);

    return {
      props: {
        apiKeys,
        messages: await loadTranslation(context.locale as string, 'tools/api'),
        locale: context.locale,
      },
    };
  } catch (e) {
    return {
      redirect: {
        destination: `/login?redirect=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    };
  }
}

APIKeysPage.getLayout = function getLayout(page: ReactElement) {
  // const t = createTranslator({ messages: props.messages, locale: props.locale });
  return (
    <Layout
      SEO={{
        title: 'API Keys',
        // description: t('Feedback.feedback-system-description'),
        noindex: true,
      }}
      mainColor="#c853ffc7"
    >
      {page}
    </Layout>
  );
};
