import type { ReactNode } from 'react';
import { Link as I18nLink } from '@i18n/navigation';
import { Link, List, Text, Alert, Flex, Heading } from '@chakra-ui/react';
import { BsCheckCircleFill, BsXCircleFill } from 'react-icons/bs';
import FeedbackButton from '@components/Feedback/FeedbackButton';
import { getTranslations } from 'next-intl/server';
import { MobileDeviceWarning } from './MobileDeviceWarning';
import type { BreadcrumbItem } from '@components/Breadcrumbs/types';

export type ContributeTabLabels = {
  extractor: string;
  feedback: string;
  official: string;
  where: string;
};

export type ContributeTabContent = {
  extractor: ReactNode;
  feedback: ReactNode;
  official: ReactNode;
  where: ReactNode;
};

export type ContributePageLabels = {
  breadcrumbList: BreadcrumbItem[];
  heading: string;
  description: string;
  tabLabels: ContributeTabLabels;
  tabContent: ContributeTabContent;
};

export async function buildContributePageProps(): Promise<ContributePageLabels> {
  const t = await getTranslations();

  return {
    breadcrumbList: [
      { position: 1, name: t('Layout.home'), item: '/' },
      { position: 2, name: t('Layout.how-to-contribute'), item: '/contribute' },
    ],
    heading: t('Layout.how-to-contribute'),
    description: t('Feedback.contribute-description'),
    tabLabels: {
      extractor: t('Feedback.item-data-extractor'),
      feedback: t('Feedback.feedback-system'),
      official: t('Feedback.creating-official-lists'),
      where: t('Feedback.where-to-find-data'),
    },
    tabContent: {
      extractor: buildExtractorTab(t),
      feedback: buildFeedbackTab(t),
      official: buildOfficialTab(t),
      where: buildWhereTab(t),
    },
  };
}

type T = Awaited<ReturnType<typeof getTranslations>>;

function buildExtractorTab(t: T) {
  return (
    <Flex flexFlow="column" gap={3} maxW="1000px">
      <Heading size="lg">{t('Feedback.the-item-data-extractor')}</Heading>
      <MobileDeviceWarning text={t('General.this-may-not-work-on-mobile-devices')} />
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
}

function buildFeedbackTab(t: T) {
  return (
    <Flex flexFlow="column" gap={3} maxW="1000px">
      <Heading size="lg">{t('Feedback.feedback-system')}</Heading>
      <Text>
        {t.rich('Feedback.fds-1', {
          Link: (chunk) => <I18nLink href="/feedback">{chunk}</I18nLink>,
          b: (chunk) => <b>{chunk}</b>,
        })}
      </Text>
      <Text>
        {t.rich('Feedback.fds-2', {
          Link1: (chunk) => <I18nLink href="/feedback/trades">{chunk}</I18nLink>,
          Link2: (chunk) => <I18nLink href="/feedback/vote">{chunk}</I18nLink>,
        })}
      </Text>
      <Text as="div">
        {t.rich('Feedback.fds-3', {
          Feedback: () => <FeedbackButton />,
          b: (chunk) => <b>{chunk}</b>,
        })}
      </Text>
    </Flex>
  );
}

function buildOfficialTab(t: T) {
  return (
    <Flex flexFlow="column" gap={3} maxW="1000px">
      <Heading size="lg">{t('Feedback.creating-official-lists')}</Heading>
      <Text>
        {t.rich('Feedback.ol-1', {
          Link: (chunk) => <I18nLink href="/lists/official">{chunk}</I18nLink>,
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
          Link1: (chunk) => <I18nLink href="/lists/official">{chunk}</I18nLink>,
          Link2: (chunk) => <I18nLink href="/terms">{chunk}</I18nLink>,
        })}
      </Text>
    </Flex>
  );
}

function buildWhereTab(t: T) {
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
}
