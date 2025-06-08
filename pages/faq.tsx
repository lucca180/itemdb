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
import { createTranslator, useTranslations } from 'next-intl';
import { ReactElement } from 'react';
import { loadTranslation } from '@utils/load-translation';

const WhyUsPage = () => {
  const t = useTranslations();
  return (
    <>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/desert/usurper_clue.gif',
          alt: 'xweetok agent thumbnail',
        }}
        color="#4bbde0"
      >
        <Heading as="h1" size="lg">
          {t('FAQ.why-itemdb')}
        </Heading>
        <Text size={{ base: 'sm', md: undefined }}>{t('FAQ.text-1')}</Text>
      </HeaderCard>
      <Flex flexFlow="column" gap={3} sx={{ a: { color: 'cyan.400' }, b: { color: 'blue.300' } }}>
        <Flex flexFlow="column" gap={3} maxW="1000px">
          <Heading size="md">{t('FAQ.what-is-the-itemdb')}</Heading>
          <Text>
            {t.rich('FAQ.text-2', {
              Link1: (chunk) => (
                <Link href="https://github.com/lucca180/itemdb/" isExternal>
                  {chunk}
                </Link>
              ),
              Link2: (chunk) => (
                <Link href="/contribute" isExternal>
                  {chunk}
                </Link>
              ),
            })}
            <br />
            <br />
            {t.rich('FAQ.text-3', {
              b: (chunk) => <b>{chunk}</b>,
              Text: (chunk) => (
                <Text as="span" color="pink.300" fontWeight="bold">
                  {chunk}
                </Text>
              ),
            })}
            <br />
            <br />
            {t.rich('FAQ.text-4', {
              Link: (chunk) => <Link href="/terms">{chunk}</Link>,
              Link1: (chunk) => (
                <Link href="/articles/sort-gallery" isExternal>
                  {chunk}
                </Link>
              ),
              Link2: (chunk) => (
                <Link href="https://docs.itemdb.com.br" isExternal>
                  {chunk}
                </Link>
              ),
              b: (chunk) => <b>{chunk}</b>,
            })}
          </Text>
          <Heading size="md" mt={5}>
            {t('FAQ.is-it-safe-i-wont-be-frozen')}
          </Heading>
          <Text>
            {t.rich('FAQ.text-is-safe', {
              Gramps: (chunk) => (
                <Link href="https://www.youtube.com/@mrsgrandpatv" isExternal>
                  {chunk}
                </Link>
              ),
              Safe: (chunk) => (
                <Link href="/img/tnt-support.png" isExternal>
                  {chunk}
                </Link>
              ),
              br: () => <br />,
            })}
          </Text>
          <Heading size="md" mt={5}>
            {t('FAQ.why-use-itemdb')}
          </Heading>
          <Text>{t('FAQ.we-have-a-lot-of-cool-features-such-as')}</Text>
          <Grid templateColumns={['1', 'repeat(2, 2fr)', 'repeat(3, 2fr)']} gap={[2, 3, 6]}>
            <FeatureCard
              title={t('General.dynamic-lists')}
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
                {t.rich('FAQ.text-5', {
                  Link: (chunk) => (
                    <Link href="/articles/checklists-and-dynamic-lists">{chunk}</Link>
                  ),
                })}
              </>
            </FeatureCard>
            <FeatureCard title={t('FAQ.drop-odds')} icon={<MdShowChart fontSize={'24px'} />}>
              {t('FAQ.text-6')}
            </FeatureCard>
            <FeatureCard
              title={t('FAQ.owls-integration')}
              icon={<MdAttachMoney fontSize={'24px'} />}
            >
              <>
                {t.rich('FAQ.text-7', {
                  Link: (chunk) => <Link href="/owls">{chunk}</Link>,
                })}
              </>
            </FeatureCard>
            <FeatureCard
              title={t('FAQ.powerful-search')}
              icon={<MdOutlineSearch fontSize={'24px'} />}
            >
              <>
                {t.rich('FAQ.text-8', {
                  Link: (chunk) => <Link href="/articles/advanced-search-queries">{chunk}</Link>,
                })}
              </>
            </FeatureCard>
            <FeatureCard title={t('FAQ.wearable-preview')} icon={<MdImage fontSize={'24px'} />}>
              <>
                {t.rich('FAQ.text-9', {
                  Link: (chunk) => (
                    <Link href="https://impress.openneo.net/" isExternal>
                      {chunk}
                    </Link>
                  ),
                })}
              </>
            </FeatureCard>
            <FeatureCard title={t('Layout.userscripts')} icon={<MdDescription fontSize={'24px'} />}>
              <>
                {t.rich('FAQ.text-10', {
                  Link: (chunk) => <Link href="/articles/userscripts">{chunk}</Link>,
                })}
              </>
            </FeatureCard>
          </Grid>
          <Heading size="md" mt={5}>
            {t('FAQ.how-can-i-help')}
          </Heading>
          <Text>
            {t.rich('FAQ.text-11', {
              Link: (chunk) => <Link href="/contribute">{chunk}</Link>,
            })}
          </Text>
          <Heading size="md" mt={5}>
            {t('FAQ.can-i-talk-about-itemdb-on-neopets')}
          </Heading>
          <Text>
            {t.rich('FAQ.text-12', {
              Link: (chunk) => (
                <Link href="http://magnetismotimes.com/" isExternal>
                  {chunk}
                </Link>
              ),
            })}
          </Text>
          <Heading size="md" mt={5}>
            {t('FAQ.you-have-a-lot-of-missing-or-wrong-info')}
          </Heading>
          <Text>
            {t.rich('FAQ.text-13', {
              Link: (chunk) => <Link href="/contribute">{chunk}</Link>,
            })}
            <br />
            <br />
            {t.rich('FAQ.text-14', {
              b: (chunk) => <b>{chunk}</b>,
            })}
          </Text>
        </Flex>
      </Flex>
    </>
  );
};

export default WhyUsPage;

export async function getStaticProps(context: any) {
  return {
    props: {
      messages: await loadTranslation(context.locale, 'faq'),
      locale: context.locale,
    },
  };
}

WhyUsPage.getLayout = function getLayout(page: ReactElement, props: any) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });

  let canonical = 'https://itemdb.com.br/faq';
  if (props.locale && props.locale !== 'en') {
    canonical = `https://itemdb.com.br/${props.locale}/faq`;
  }

  return (
    <Layout SEO={{ title: t('FAQ.frequent-asked-questions'), canonical }} mainColor="#4bbde0c7">
      {page}
    </Layout>
  );
};
