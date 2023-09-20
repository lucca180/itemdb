/* eslint-disable react/no-unescaped-entities */
import { Flex, Heading, Text, Link, Grid } from '@chakra-ui/react';
import {
  MdAttachMoney,
  MdDescription,
  MdImage,
  MdOutlineSearch,
  MdShowChart,
} from 'react-icons/md';
import FeatureCard from '../components/Card/FeatureCard';
import HeaderCard from '../components/Card/HeaderCard';
import Layout from '../components/Layout';
import DynamicIcon from '../public/icons/dynamic.png';
import NextImage from 'next/image';

const WhyUsPage = () => {
  return (
    <Layout SEO={{ title: 'Frequent Asked Questions' }}>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/desert/usurper_clue.gif',
          alt: 'xweetok agent thumbnail',
        }}
        color="#4bbde0"
      >
        <Heading size="lg">Why itemdb?</Heading>
        <Text size={{ base: 'sm', md: undefined }}>
          Here you can find the most frequent asked questions about the itemdb.
        </Text>
      </HeaderCard>
      <Flex flexFlow="column" gap={3} sx={{ a: { color: 'cyan.400' }, b: { color: 'blue.300' } }}>
        <Flex flexFlow="column" gap={3} maxW="1000px">
          <Heading size="md">What is the itemdb?</Heading>
          <Text>
            The itemdb is a{' '}
            <Link href="https://github.com/lucca180/itemdb/" isExternal>
              open source
            </Link>{' '}
            database for neopets items. It is a community driven project where everyone can{' '}
            <Link href="/contribute" isExternal>
              contribute
            </Link>
            .<br />
            <br />
            Our goal is to provide as much <b>information</b> as possible about neopets items and
            make it easy for you to find <b>new and interesting items</b> whether it be for your{' '}
            <Text as="span" color="pink.300" fontWeight="bold">
              pink themed gallery
            </Text>{' '}
            or putting together a <b>cool outfit for your pet</b>.
            <br />
            <br />
            As a <b>community-supported project</b>, we think it's fair that everyone can use our
            data for their projects (read our <Link href="/terms">terms</Link> first!). Want to{' '}
            <b>calculate neopia inflation</b> in an almost scientifically accurate way? Or{' '}
            <Link href="/articles/sortGallery" isExternal>
              sort your gallery by color
            </Link>
            ? Just take a look at our{' '}
            <Link href="https://itemdb.stoplight.io/docs/itemdb-api" isExternal>
              API
            </Link>
            .
          </Text>
          <Heading size="md">Why use itemdb?</Heading>
          <Text>We have a lot of cool features, such as:</Text>
          <Grid templateColumns={['1', 'repeat(2, 2fr)', 'repeat(3, 2fr)']} gap={[2, 3, 6]}>
            <FeatureCard
              title="Dynamic Lists"
              icon={
                <NextImage
                  src={DynamicIcon}
                  alt="lightning bolt"
                  width={14}
                  style={{ display: 'inline' }}
                />
              }
            >
              <>
                Create <Link href="/articles/checklists-and-dynamic-lists">dynamic lists</Link> that
                update automatically as new items are released.
              </>
            </FeatureCard>
            <FeatureCard title="Drop Odds" icon={<MdShowChart fontSize={'24px'} />}>
              See the odds of getting an item from Mystery Capsules, Goodie Bags and other
              openables.
            </FeatureCard>
            <FeatureCard title="Owls Integration" icon={<MdAttachMoney fontSize={'24px'} />}>
              <>
                Search, sort and filter NC Wearables by{' '}
                <Link href="/articles/owls">Owls Value</Link>. You can also see the Trade Report
                History for each item.
              </>
            </FeatureCard>
            <FeatureCard title="Powerful Search" icon={<MdOutlineSearch fontSize={'24px'} />}>
              <>
                {' '}
                Use our <Link href="/articles/advanced-search-queries">
                  operators and filters
                </Link>{' '}
                to find the perfect item for your gallery or outfit. You can even search for items
                by color pallete!
              </>
            </FeatureCard>
            <FeatureCard title="Wearable Preview" icon={<MdImage fontSize={'24px'} />}>
              <>
                Preview how a wearable looks on your pet before buying it. Powered by{' '}
                <Link href="https://impress.openneo.net/" isExternal>
                  Dress to Impress
                </Link>
                .
              </>
            </FeatureCard>
            <FeatureCard title="Userscripts" icon={<MdDescription fontSize={'24px'} />}>
              <>
                Price your SDB? Sort your gallery by color? We have a lot of{' '}
                <Link href="/articles/userscripts">userscripts</Link> to make your life easier.
              </>
            </FeatureCard>
          </Grid>
          <Heading size="md" mt={5}>
            How can I help?
          </Heading>
          <Text>
            We have a page dedicated to the different ways you can{' '}
            <Link href="/contribute">contribute to the itemdb</Link>.
          </Text>
          <Heading size="md" mt={5}>
            Can i talk about itemdb on Neopets?
          </Heading>
          <Text>
            itemdb is a{' '}
            <Link href="http://magnetismotimes.com/" isExternal>
              Magnetismo Times
            </Link>{' '}
            project and, as Certified Site, you should be able to talk about it on Neopets - but you
            cannot link to it. Yet.
          </Text>
          <Heading size="md" mt={5}>
            You have a lot of missing or wrong info...
          </Heading>
          <Text>
            All the information on the itemdb is provided by users like you using our{' '}
            <Link href="/contribute">Item Data Extractor Script</Link>. Most of the time, as soon
            the correct information hits our database, it will be automatically updated on the site
            and you should not worry about it.
            <br />
            <br />
            But sometimes, when TNT changes something, our algorithm will fall into a merge conflict
            and we will need to give it a check manually. If that is the case, you can help us by
            reporting the issue using the <b>Feedback Button</b> on each item's pages.
          </Text>
        </Flex>
      </Flex>
    </Layout>
  );
};

export default WhyUsPage;
