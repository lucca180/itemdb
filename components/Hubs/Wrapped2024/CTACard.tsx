import { Flex, Heading, Text, CloseButton } from '@chakra-ui/react';
import NextLink from 'next/link';
import useSWR from 'swr';
import { useAuth } from '../../../utils/auth';

const fetcher = (url: string) =>
  fetch(url).then((res) => res.json() as Promise<{ status: 'notJoined' | 'notReady' | 'ready' }>);

export const RestockedCTACard = () => {
  const { data, isLoading } = useSWR('/api/v1/restock/wrapped', fetcher);
  const { userPref, updatePref } = useAuth();

  if (
    isLoading ||
    !data ||
    data.status === 'notReady' ||
    data.status === userPref?.dashboard_wrappedHide
  )
    return null;

  return (
    <Flex
      w="100%"
      minH="100px"
      maxW="500px"
      position={'relative'}
      borderRadius={'md'}
      overflow={'hidden'}
      boxShadow={'md'}
      textAlign={'center'}
      _before={{
        content: '""',
        position: 'absolute',
        display: 'block',
        w: '100%',
        h: '100%',
        top: 0,
        zIndex: -1,
        opacity: 0.75,
        filter: 'brightness(0.65)',
        background: 'url(/img/bg1.svg)',
        bgSize: 'cover',
        bgPos: 'center',
      }}
      _after={{
        bgGradient: 'linear(to-b, #15B392, #54C392, #73EC8B)',
        content: '""',
        position: 'absolute',
        display: 'block',
        w: '100%',
        h: '100%',
        top: 0,
        zIndex: -2,
      }}
    >
      <Flex flexFlow={'column'} p={3} w={'100%'}>
        <CloseButton
          onClick={() => updatePref('dashboard_wrappedHide', data.status)}
          position={'absolute'}
          top={1}
          right={1}
        />
        {data.status === 'notJoined' && (
          <>
            <Heading
              as={NextLink}
              href="/restock/dashboard/2024"
              fontWeight={'extrabold'}
              textAlign={'center'}
            >
              Join the{' '}
              <Text as="span" color="#D2FF72">
                2024 Restock Review
              </Text>{' '}
              Waitlist
            </Heading>
            <Text fontSize={'sm'} mt={3}>
              Let&apos;s take a look on everything that happened in your restock year
            </Text>
          </>
        )}
        {data.status === 'ready' && (
          <>
            <Heading
              as={NextLink}
              href="/restock/dashboard/2024"
              fontWeight={'extrabold'}
              textAlign={'center'}
              size="lg"
            >
              The{' '}
              <Text as="span" color="#D2FF72">
                2024 Restock Review
              </Text>{' '}
              is waiting for you
            </Heading>
            <Text fontSize={'sm'} mt={3}>
              Let&apos;s take a look on everything that happened in your restock year
            </Text>
          </>
        )}
      </Flex>
    </Flex>
  );
};
