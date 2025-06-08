/* eslint-disable react/no-unescaped-entities */
import {
  Flex,
  Heading,
  Text,
  Link,
  List,
  ListIcon,
  ListItem,
  useMediaQuery,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Button,
  Icon,
  UnorderedList,
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
} from '@chakra-ui/react';
import { BsCheckCircleFill, BsXCircleFill } from 'react-icons/bs';
import HeaderCard from '../components/Card/HeaderCard';
import Layout from '../components/Layout';
import { useDisclosure } from '@chakra-ui/react';
import { FeedbackModalProps } from '../components/Modal/FeedbackModal';
import { FiEdit3, FiSend } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import { createTranslator, useTranslations } from 'next-intl';
import { ReactElement } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs/Breadcrumbs';
import { loadTranslation } from '@utils/load-translation';

const FeedbackModal = dynamic<FeedbackModalProps>(
  () => import('../components/Modal/FeedbackModal')
);

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
      <Flex flexFlow="column" gap={3} sx={{ a: { color: '#ffee71' }, b: { color: '#8ea7f1' } }}>
        <Tabs colorScheme="yellow">
          <TabList>
            <Tab>{t('Feedback.item-data-extractor')}</Tab>
            <Tab>{t('Feedback.feedback-system')}</Tab>
            <Tab>{t('Feedback.creating-official-lists')}</Tab>
            <Tab>{t('Feedback.where-to-find-data')}</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <ItemDataExtractor />
            </TabPanel>
            <TabPanel>
              <FeedbackSystem />
            </TabPanel>
            <TabPanel>
              <OfficialLists />
            </TabPanel>
            <TabPanel>
              <WhereToFindInfo />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Flex>
    </>
  );
};

export default ContributePage;

const ItemDataExtractor = () => {
  const t = useTranslations();
  const [isLargerThanMD] = useMediaQuery('(min-width: 48em)', { fallback: true });
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
              isExternal
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
              isExternal
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
            <Link href="https://github.com/lucca180/itemdb" isExternal>
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
      <Alert status="warning" borderRadius={'md'}>
        <AlertIcon />
        <Box>
          <AlertTitle>Manifest V3</AlertTitle>
          <AlertDescription>
            {t.rich('Feedback.manifest-v3-text', {
              Link: (chunk) => (
                <Link href="https://www.tampermonkey.net/faq.php#Q209" isExternal>
                  {chunk}
                </Link>
              ),
            })}
          </AlertDescription>
        </Box>
      </Alert>
      <UnorderedList spacing={3}>
        <ListItem>
          {t.rich('Feedback.ide-4', {
            Link: (chunk) => (
              <Link href="https://www.tampermonkey.net/" isExternal>
                {chunk}
              </Link>
            ),
          })}
        </ListItem>
        <ListItem>
          {t.rich('Feedback.ide-5', {
            Link: (chunk) => (
              <Link
                href="https://github.com/lucca180/itemdb/raw/main/userscripts/itemDataExtractor.user.js"
                isExternal
              >
                {chunk}
              </Link>
            ),
          })}
        </ListItem>
      </UnorderedList>
      <Heading size="md" mt={3}>
        {t('Feedback.what-is-sent-to-itemdb')}
      </Heading>
      <List spacing={3}>
        <ListItem>
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          {t('Feedback.ide-6')}
        </ListItem>
        <ListItem>
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          {t.rich('Feedback.ide-7', {
            Text: (chunk) => (
              <Text fontSize="sm" color="gray.400">
                {chunk}
              </Text>
            ),
            b: (chunk) => <b>{chunk}</b>,
          })}
        </ListItem>
        <ListItem>
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          {t.rich('Feedback.ide-8', {
            Text: (chunk) => (
              <Text fontSize="sm" color="gray.400">
                {chunk}
              </Text>
            ),
          })}
        </ListItem>
        <ListItem>
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          {t.rich('Feedback.ide-9', {
            Text: (chunk) => (
              <Text fontSize="sm" color="gray.400">
                {chunk}
              </Text>
            ),
          })}
        </ListItem>
        <ListItem>
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          {t.rich('Feedback.ide-10', {
            Text: (chunk) => (
              <Text fontSize="sm" color="gray.400">
                {chunk}
              </Text>
            ),
          })}
        </ListItem>
      </List>
      <Heading size="md" mt={3}>
        {t('Feedback.what-is-not-sent-to-itemdb')}
      </Heading>
      <List spacing={3}>
        <ListItem>
          <ListIcon as={BsXCircleFill} color="red.300" />

          {t.rich('Feedback.ide-11', {
            Text: (chunk) => (
              <Text fontSize="sm" color="gray.400">
                {chunk}
              </Text>
            ),
          })}
        </ListItem>
      </List>
    </Flex>
  );
};

const FeedbackSystem = () => {
  const t = useTranslations();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <FeedbackModal isOpen={isOpen} onClose={onClose} />
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
            Feedback: (chunk) => (
              <Button variant="outline" size="sm" onClick={onOpen}>
                <Icon as={FiSend} mr={1} /> {chunk}
              </Button>
            ),
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
      <UnorderedList spacing={2}>
        <ListItem>
          <Link href="https://www.neopets.com/inventory.phtml" isExternal>
            {t('General.Inventory')}
          </Link>{' '}
          - {t('General.name')}, {t('General.description')}, {t('General.Image')},{' '}
          {t('General.category')}, {t('General.rarity')}, {t('General.est-val')},{' '}
          {t('General.weight')}
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/safetydeposit.phtml" isExternal>
            {t('General.safety-deposit-box')}
          </Link>{' '}
          - {t('General.item-id')}, {t('General.name')}, {t('General.description')},{' '}
          {t('General.Image')}, {t('General.category')} {t('Feedback.except-for-nc-items')}
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/island/tradingpost.phtml" isExternal>
            {t('General.trading-post')}
          </Link>{' '}
          - {t('General.name')}, {t('General.description')}, {t('General.Image')}
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/market.phtml?type=your" isExternal>
            {t('Feedback.shops-your-shop-or-restock')}
          </Link>{' '}
          - {t('General.item-id')}, {t('General.name')}, {t('General.description')},{' '}
          {t('General.Image')}, {t('General.category')}
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/market_map.phtml" isExternal>
            {t('Feedback.user-shops')}
          </Link>{' '}
          - {t('General.item-id')}, {t('General.name')}, {t('General.description')},{' '}
          {t('General.Image')}
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/gallery/" isExternal>
            {t('Feedback.gallery-front-page')}
          </Link>{' '}
          - {t('General.name')}, {t('General.description')}, {t('General.Image')}
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/gallery/quickremove.phtml" isExternal>
            {t('Feedback.gallery-admin-page')}
          </Link>{' '}
          - {t('General.item-id')}, {t('General.name')}, {t('General.Image')}
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/closet.phtml" isExternal>
            {t('General.closet')}
          </Link>{' '}
          - {t('General.item-id')}, {t('General.name')}, {t('General.description')},{' '}
          {t('General.Image')}, {t('General.category')}
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/search.phtml" isExternal>
            {t('Feedback.search-page')}
          </Link>{' '}
          - {t('General.name')}, {t('General.description')}, {t('General.Image')},{' '}
          {t('General.category')}, {t('General.rarity')}, {t('General.est-val')},{' '}
          {t('General.weight')}
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/neohome/shed" isExternal>
            {t('Feedback.storage-shed')}
          </Link>{' '}
          - {t('General.item-id')}, {t('General.name')}, {t('General.description')},{' '}
          {t('General.Image')}, {t('General.category')}
        </ListItem>
        <ListItem>
          <Link href="http://ncmall.neopets.com/mall/shop.phtml?page=&cat=" isExternal>
            {t('General.nc-mall')}
          </Link>{' '}
          - {t('General.item-id')}, {t('General.name')}, {t('General.description')},{' '}
          {t('General.Image')}
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/customise/" isExternal>
            {t('Feedback.customization-page')}
          </Link>{' '}
          - {t('Feedback.everything')} {t('General.item-id')}, {t('General.name')},{' '}
          {t('General.description')}, {t('General.Image')}, {t('General.category')},{' '}
          {t('General.rarity')}, {t('General.est-val')}, {t('General.weight')}
        </ListItem>
        <ListItem>
          <Link href="https://www.neopets.com/ncma/" isExternal>
            {t('Feedback.nc-journal')}
          </Link>{' '}
          - {t('General.item-id')}, {t('General.name')}, {t('General.Image')}
        </ListItem>
      </UnorderedList>
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
