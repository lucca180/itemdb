/* eslint-disable react/no-unescaped-entities */
import { Heading, Text, Center, Image, Flex } from '@chakra-ui/react';
import logo from '../public/logo_white_compressed.svg';
import NextImage from 'next/image';

const MaintenancePage = () => {
  return (
    <Flex flexFlow={'column'} p={8} h="100vh">
      <Center>
        <Image
          as={NextImage}
          src={logo}
          alt="itemdb logo"
          height="100px"
          width="auto"
          quality={100}
          priority
        />
      </Center>
      <Center
        mt="-100px"
        flex="1"
        flexFlow="column"
        gap={3}
        sx={{ a: { color: 'blue.300' } }}
        textAlign="center"
      >
        <Heading mb={3}>We're under maintenance</Heading>
        <Image
          src="https://images.neopets.com/homepage/maint/images/bottombg_maintenance_mobile.png"
          alt="meepits maintenance"
          borderRadius={'md'}
        />
        <Text>We're under a scheduled maintenance. We'll be back very soon :) </Text>
      </Center>
    </Flex>
  );
};

export default MaintenancePage;
