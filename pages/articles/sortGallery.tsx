/* eslint-disable react/no-unescaped-entities */
import { Flex, Heading, Text, Link } from '@chakra-ui/react';
import HeaderCard from '../../components/Card/HeaderCard';
import Layout from '../../components/Layout';

const SortGalleryPage = () => {
  return (
    <Layout
      SEO={{
        title: 'How to Sort Neopets Galleries by Color?',
        description:
          'Ever wanted your gallery all aesthetic and pleasing? Well, now you can! This guide will show you how use itemdb to sort your gallery by color.',
      }}
    >
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/caption/caption_670.gif',
          alt: 'rainbow pets',
        }}
        color="#05B7E8"
      >
        <Heading size="lg" as="h1">
          How to Sort Neopets Galleries by Color?
        </Heading>
        <Text size={{ base: 'sm', md: undefined }} as="h2">
          Ever wanted your gallery all aesthetic and pleasing? Well, now you can! This guide will
          show you how use itemdb to sort your gallery by color.
        </Text>
      </HeaderCard>
      <Flex flexFlow="column" gap={3} sx={{ a: { color: 'cyan.300' }, b: { color: 'blue.300' } }}>
        <Flex flexFlow="column" gap={3} maxW="1000px">
          <Heading size="md" as="h3">
            Step 1
          </Heading>
          <Text>
            You will need to install the{' '}
            <Link href="https://www.tampermonkey.net/" isExternal>
              Tampermonkey
            </Link>{' '}
            extension for your browser if you haven't already.
          </Text>
          <Heading size="md" as="h3">
            Step 2
          </Heading>
          <Text>
            Once you have installed the extension, install the{' '}
            <Link
              href="https://github.com/lucca180/itemdb/raw/main/userscripts/sortGallery.user.js"
              isExternal
            >
              itemdb Sort Gallery Script
            </Link>
            .
          </Text>
          <Text fontSize="sm">
            If you have any concerns about your privacy or security, you can view the entire source
            code for itemdb on{' '}
            <Link href="https://github.com/lucca180/itemdb" isExternal>
              Github
            </Link>
            . You can also check our <Link href="/privacy">privacy policy</Link>,{' '}
            <Link href="/terms">terms of service</Link> and our main site{' '}
            <Link href="https://magnetismotimes.com/" isExternal>
              Magnetismo Times
            </Link>
            .
          </Text>
          <Heading size="md" as="h3">
            Step 3
          </Heading>
          <Text>
            Once you have installed the script, you can go to your{' '}
            <Link href="https://www.neopets.com/gallery/index.phtml?dowhat=rank&view=all">
              gallery rank page
            </Link>{' '}
            and select one of <b>color pallete options</b> to sort your gallery by color.
          </Text>
          <Text fontSize="sm">
            <b>Computers cannot see colors the same way humans do</b>, so somethimes the sorting{' '}
            <b>might not be perfect.</b> In this case you can manually <b>change the order</b> of
            some items (you can use decimals to put an item in between two others!).
          </Text>
          <Text fontSize="sm">
            If your gallery is too big it can take a while to the magic happen, so be patient! Also
            it can fail if we dont have some item in our database, so if that happens,{' '}
            <Link href="/contribute">learn how to help</Link>!
          </Text>
          <Heading size="md" as="h3">
            Step 4
          </Heading>
          <Text>
            Hit the <b>Save</b> button and you are done! You can now{' '}
            <Link href="https://www.neopets.com/gallery/index.phtml?is_owner=no&view=all">
              visit your gallery
            </Link>{' '}
            and see your gallery sorted by color!
          </Text>
          <Text>
            If you are happy with the result, please consider to{' '}
            <Link href="/contribute">contribute</Link> to the project! You can also{' '}
            <b>create your lists</b> and <Link href="/lists/import">easily import items</Link> from
            your gallery, closet or sdb!
          </Text>
        </Flex>
      </Flex>
    </Layout>
  );
};

export default SortGalleryPage;
