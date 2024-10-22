import { Flex, Text, Link } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import NextLink from 'next/link';

export const SiteAlert = () => {
  const t = useTranslations();
  return (
    <Flex bg="yellow.500">
      <Flex w="full" maxW="8xl" marginX="auto" py={1} alignItems={'center'} gap={1} fontSize={'xs'}>
        <Image
          src="https://images.neopets.com/746b9753/3ceb2e2.png"
          width={32}
          height={32}
          alt="confused shop wizard"
        />
        <Text color="blackAlpha.900">
          {t.rich('Layout.tavi-alert', {
            Link: (children) => (
              <Link as={NextLink} href="/contribute" fontWeight="bold">
                {children}
              </Link>
            ),
          })}
        </Text>
      </Flex>
    </Flex>
  );
};
