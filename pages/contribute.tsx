import {
  Flex,
  Heading,
  Text,
  Link,
  List,
  useMediaQuery,
  Tabs,
  Button,
  Icon,
  Alert,
} from '@chakra-ui/react';
import { BsCheckCircleFill, BsXCircleFill } from 'react-icons/bs';
import HeaderCard from '../components/Card/HeaderCard';
import Layout from '../components/Layout';
import { FiEdit3 } from 'react-icons/fi';
import { createTranslator, useTranslations } from 'next-intl';
import { ReactElement } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs/Breadcrumbs';
import { loadTranslation } from '@utils/load-translation';
import FeedbackButton from '@components/Feedback/FeedbackButton';

const ContributePage = () => {
  const t = useTranslations();
  return (
    <>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/games/betterthanyou/contestant435.gif',
          alt: 'helper acara thumbnail',
        }}
        color="#4974F5"
        breadcrumb={
          <Breadcrumbs
            breadcrumbList={[
              {
                position: 1,
                name: t('Layout.home'),
                item: '/',
              },
              {
                position: 2,
                name: t('Layout.how-to-contribute'),
                item: '/contribute',
              },
            ]}
          />
        }
      >
        <Heading as="h1" size="lg">
          {t('Layout.how-to-contribute')}
        </Heading>
        <Text as="h2">{t('Feedback.contribute-description')}</Text>
      </HeaderCard>
      <Flex flexFlow="column" gap={3} css={{ a: { color: '#ffee71' }, b: { color: '#8ea7f1' } }}>
        <Tabs.Root colorPalette="yellow" defaultValue="extractor">
          <Tabs.List>
            <Tabs.Trigger value="extractor">{t('Feedback.item-data-extractor')}</Tabs.Trigger>
            <Tabs.Trigger value="feedback">{t('Feedback.feedback-system')}</Tabs.Trigger>
            <Tabs.Trigger value="official">{t('Feedback.creating-official-lists')}</Tabs.Trigger>
            <Tabs.Trigger value="where">{t('Feedback.where-to-find-data')}</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="extractor">
            <ItemDataExtractor />
          </Tabs.Content>
          <Tabs.Content value="feedback">
            <FeedbackSystem />
          </Tabs.Content>
          <Tabs.Content value="official">
            <OfficialLists />
          </Tabs.Content>
          <Tabs.Content value="where">
            <WhereToFindInfo />
          </Tabs.Content>
        </Tabs.Root>
      </Flex>
    </>
  );
};

export default ContributePage;

const ItemDataExtractor = () => {
  const t = useTranslations();
  const [isLargerThanMD] = useMediaQuery(['(min-width: 48em)'], { fallback: [true] });
  return (
    <Flex flexFlow="column" gap={3} maxW="1000px">
      <Heading size="lg">{t('Feedback.the-item-data-extractor')}</Heading>
      {!isLargerThanMD && (
        <Text fontSize="sm" color="red.400">
          {t('General.this-may-not-work-on-mobile-devices')}
        </Text>
      )}

      <Text>
        {t.rich('Feedback.ide-1', {
          Link: (chunk) => (
            <Link
              href="https://github.com/lucca180/itemdb/raw/main/userscripts/itemDataExtractor.user.js"
              target="_blank"
              rel="noreferrer"
            >
              {chunk}
            </Link>
          ),
        })}
      </Text>
      <Text>
        {t.rich('Feedback.ide-2', {
          Link: (chunk) => (
            <Link
              href="https://github.com/lucca180/itemdb/raw/main/userscripts/itemDataExtractor.user.js"
              target="_blank"
              rel="noreferrer"
            >
              {chunk}
            </Link>
          ),
          b: (chunk) => <b>{chunk}</b>,
        })}
      </Text>
      <Text>
        {t.rich('Feedback.ide-3', {
          Link: (chunk) => (
            <Link href="https://github.com/lucca180/itemdb" target="_blank" rel="noreferrer">
              {chunk}
            </Link>
          ),
          b: (chunk) => <b>{chunk}</b>,
          br: () => <br />,
        })}
      </Text>
      <Heading size="md" mt={3}>
        {t('Feedback.how-to-install')}
      </Heading>
      <Alert.Root status="warning" borderRadius={'md'}>
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Manifest V3</Alert.Title>
          <Alert.Description>
            {t.rich('Feedback.manifest-v3-text', {
              Link: (chunk) => (
                <Link
                  href="https://www.tampermonkey.net/faq.php#Q209"
                  target="_blank"
                  rel="noreferrer"
                >
                  {chunk}
                </Link>
              ),
            })}
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>
      <List.Root as="ul" gap={3} ps={6}>
        <List.Item>
          {t.rich('Feedback.ide-4', {
            Link: (chunk) => (
              <Link href="https://www.tampermonkey.net/" target="_blank" rel="noreferrer">
                {chunk}
              </Link>
            ),
          })}
        </List.Item>
        <List.Item>
          {t.rich('Feedback.ide-5', {
            Link: (chunk) => (
              <Link
                href="https://github.com/lucca180/itemdb/raw/main/userscripts/itemDataExtractor.user.js"
                target="_blank"
                rel="noreferrer"
              >
                {chunk}
              </Link>
            ),
          })}
        </List.Item>
      </List.Root>
      <Heading size="md" mt={3}>
        {t('Feedback.what-is-sent-to-itemdb')}
      </Heading>
      <List.Root gap={3}>
        <List.Item>
          <List.Indicator asChild color="green.300">
            <BsCheckCircleFill />
          </List.Indicator>
          {t('Feedback.ide-6')}
        </List.Item>
        <List.Item>
          <List.Indicator asChild color="green.300">
            <BsCheckCircleFill />
          </List.Indicator>
          {t.rich('Feedback.ide-7', {
            Text: (chunk) => (
              <Text fontSize="sm" color="gray.400">
                {chunk}
              </Text>
            ),
            b: (chunk) => <b>{chunk}</b>,
          })}
        </List.Item>
        <List.Item>
          <List.Indicator asChild color="green.300">
            <BsCheckCircleFill />
          </List.Indicator>
          {t.rich('Feedback.ide-8', {
            Text: (chunk) => (
              <Text fontSize="sm" color="gray.400">
                {chunk}
              </Text>
            ),
          })}
        </List.Item>
        <List.Item>
          <List.Indicator asChild color="green.300">
            <BsCheckCircleFill />
          </List.Indicator>
          {t.rich('Feedback.ide-9', {
            Text: (chunk) => (
              <Text fontSize="sm" color="gray.400">
                {chunk}
              </Text>
            ),
          })}
        </List.Item>
        <List.Item>
          <List.Indicator asChild color="green.300">
            <BsCheckCircleFill />
          </List.Indicator>
          {t.rich('Feedback.ide-10', {
            Text: (chunk) => (
              <Text fontSize="sm" color="gray.400">
                {chunk}
              </Text>
            ),
          })}
        </List.Item>
      </List.Root>
      <Heading size="md" mt={3}>
        {t('Feedback.what-is-not-sent-to-itemdb')}
      </Heading>
      <List.Root gap={3}>
        <List.Item>
          <List.Indicator asChild color="red.300">
            <BsXCircleFill />
          </List.Indicator>

          {t.rich('Feedback.ide-11', {
            Text: (chunk) => (
              <Text fontSize="sm" color="gray.400">
                {chunk}
              </Text>
            ),
          })}
        </List.Item>
      </List.Root>
    </Flex>
  );
};

const FeedbackSystem = () => {
  const t = useTranslations();

  return (
    <>
      <Flex flexFlow="column" gap={3} maxW="1000px">
        <Heading size="lg">{t('Feedback.feedback-system')}</Heading>
        <Text>
          {t.rich('Feedback.fds-1', {
            Link: (chunk) => <Link href="/feedback">{chunk}</Link>,
            b: (chunk) => <b>{chunk}</b>,
          })}
        </Text>
        <Text>
          {t.rich('Feedback.fds-2', {
            Link1: (chunk) => <Link href="/feedback/trades">{chunk}</Link>,
            Link2: (chunk) => <Link href="/feedback/vote">{chunk}</Link>,
          })}
        </Text>
        <Text as="div">
          {t.rich('Feedback.fds-3', {
            Edit: (chunk) => (
              <Button variant="outline" size="sm">
                <Icon as={FiEdit3} mr={1} /> {chunk}
              </Button>
            ),
            Feedback: () => <FeedbackButton />,
            b: (chunk) => <b>{chunk}</b>,
          })}
        </Text>
      </Flex>
    </>
  );
};

const OfficialLists = () => {
  const t = useTranslations();
  return (
    <Flex flexFlow="column" gap={3} maxW="1000px">
      <Heading size="lg">{t('Feedback.creating-official-lists')}</Heading>
      <Text>
        {t.rich('Feedback.ol-1', {
          Link: (chunk) => <Link href="/lists/official">{chunk}</Link>,
          b: (chunk) => <b>{chunk}</b>,
        })}
      </Text>
      <Text>
        {t.rich('Feedback.ol-2', {
          b: (chunk) => <b>{chunk}</b>,
        })}
      </Text>
      <Text>
        {t.rich('Feedback.ol-3', {
          Link1: (chunk) => <Link href="/lists/official">{chunk}</Link>,
          Link2: (chunk) => <Link href="/terms">{chunk}</Link>,
        })}
      </Text>
    </Flex>
  );
};

const WhereToFindInfo = () => {
  const t = useTranslations();
  return (
    <Flex flexFlow="column" gap={3} maxW="1000px">
      <Heading size="lg">{t('Feedback.where-to-find-data')}</Heading>
      <Text>
        {t.rich('Feedback.wdf-1', {
          b: (chunk) => <b>{chunk}</b>,
        })}
      </Text>
      <List.Root as="ul" gap={2} ps={6}>
        <List.Item>
          <Link href="https://www.neopets.com/inventory.phtml" target="_blank" rel="noreferrer">
            {t('General.Inventory')}
          </Link>{' '}
          - {t('General.name')}, {t('General.description')}, {t('General.Image')},{' '}
          {t('General.category')}, {t('General.rarity')}, {t('General.est-val')},{' '}
          {t('General.weight')}
        </List.Item>
        <List.Item>
          <Link href="https://www.neopets.com/safetydeposit.phtml" target="_blank" rel="noreferrer">
            {t('General.safety-deposit-box')}
          </Link>{' '}
          - {t('General.item-id')}, {t('General.name')}, {t('General.description')},{' '}
          {t('General.Image')}, {t('General.category')} {t('Feedback.except-for-nc-items')}
        </List.Item>
        <List.Item>
          <Link
            href="https://www.neopets.com/island/tradingpost.phtml"
            target="_blank"
            rel="noreferrer"
          >
            {t('General.trading-post')}
          </Link>{' '}
          - {t('General.name')}, {t('General.description')}, {t('General.Image')}
        </List.Item>
        <List.Item>
          <Link
            href="https://www.neopets.com/market.phtml?type=your"
            target="_blank"
            rel="noreferrer"
          >
            {t('Feedback.shops-your-shop-or-restock')}
          </Link>{' '}
          - {t('General.item-id')}, {t('General.name')}, {t('General.description')},{' '}
          {t('General.Image')}, {t('General.category')}
        </List.Item>
        <List.Item>
          <Link href="https://www.neopets.com/market_map.phtml" target="_blank" rel="noreferrer">
            {t('Feedback.user-shops')}
          </Link>{' '}
          - {t('General.item-id')}, {t('General.name')}, {t('General.description')},{' '}
          {t('General.Image')}
        </List.Item>
        <List.Item>
          <Link href="https://www.neopets.com/gallery/" target="_blank" rel="noreferrer">
            {t('Feedback.gallery-front-page')}
          </Link>{' '}
          - {t('General.name')}, {t('General.description')}, {t('General.Image')}
        </List.Item>
        <List.Item>
          <Link
            href="https://www.neopets.com/gallery/quickremove.phtml"
            target="_blank"
            rel="noreferrer"
          >
            {t('Feedback.gallery-admin-page')}
          </Link>{' '}
          - {t('General.item-id')}, {t('General.name')}, {t('General.Image')}
        </List.Item>
        <List.Item>
          <Link href="https://www.neopets.com/closet.phtml" target="_blank" rel="noreferrer">
            {t('General.closet')}
          </Link>{' '}
          - {t('General.item-id')}, {t('General.name')}, {t('General.description')},{' '}
          {t('General.Image')}, {t('General.category')}
        </List.Item>
        <List.Item>
          <Link href="https://www.neopets.com/search.phtml" target="_blank" rel="noreferrer">
            {t('Feedback.search-page')}
          </Link>{' '}
          - {t('General.name')}, {t('General.description')}, {t('General.Image')},{' '}
          {t('General.category')}, {t('General.rarity')}, {t('General.est-val')},{' '}
          {t('General.weight')}
        </List.Item>
        <List.Item>
          <Link href="https://www.neopets.com/neohome/shed" target="_blank" rel="noreferrer">
            {t('Feedback.storage-shed')}
          </Link>{' '}
          - {t('General.item-id')}, {t('General.name')}, {t('General.description')},{' '}
          {t('General.Image')}, {t('General.category')}
        </List.Item>
        <List.Item>
          <Link
            href="http://ncmall.neopets.com/mall/shop.phtml?page=&cat="
            target="_blank"
            rel="noreferrer"
          >
            {t('General.nc-mall')}
          </Link>{' '}
          - {t('General.item-id')}, {t('General.name')}, {t('General.description')},{' '}
          {t('General.Image')}
        </List.Item>
        <List.Item>
          <Link href="https://www.neopets.com/customise/" target="_blank" rel="noreferrer">
            {t('Feedback.customization-page')}
          </Link>{' '}
          - {t('Feedback.everything')} {t('General.item-id')}, {t('General.name')},{' '}
          {t('General.description')}, {t('General.Image')}, {t('General.category')},{' '}
          {t('General.rarity')}, {t('General.est-val')}, {t('General.weight')}
        </List.Item>
        <List.Item>
          <Link href="https://www.neopets.com/ncma/" target="_blank" rel="noreferrer">
            {t('Feedback.nc-journal')}
          </Link>{' '}
          - {t('General.item-id')}, {t('General.name')}, {t('General.Image')}
        </List.Item>
      </List.Root>
    </Flex>
  );
};

export async function getStaticProps(context: any) {
  return {
    props: {
      messages: await loadTranslation(context.locale, 'contribute'),
      locale: context.locale,
    },
  };
}

ContributePage.getLayout = function getLayout(page: ReactElement, props: any) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });

  let canonical = 'https://itemdb.com.br/contribute';
  if (props.locale && props.locale !== 'en') {
    canonical = `https://itemdb.com.br/${props.locale}/contribute`;
  }

  return (
    <Layout
      SEO={{
        title: t('Layout.how-to-contribute'),
        description: t('Feedback.contribute-description'),
        openGraph: {
          images: [
            {
              url: 'https://images.neopets.com/games/betterthanyou/contestant435.gif',
              width: 150,
              height: 150,
            },
          ],
        },
        canonical: canonical,
      }}
      mainColor="#4974f5c7"
    >
      {page}
    </Layout>
  );
};
