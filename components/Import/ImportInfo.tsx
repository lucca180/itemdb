import { Flex, Box, Heading, Link, List, Text, useMediaQuery } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import DynamicIcon from '@assets/icons/dynamic.png';
import MainLink from '@components/Utils/MainLink';
import icon from '@assets/logo_icon.svg';

export const ImportInfo = () => {
  const t = useTranslations();
  const [isLargerThanMD] = useMediaQuery(['(min-width: 48em)'], { fallback: [true] });

  return (
    <Flex flexFlow="column" gap={3} maxW="1000px">
      <Heading size="md">{t('Lists.import-step-by-step')}</Heading>
      {!isLargerThanMD && (
        <Text fontSize="sm" color="red.400">
          {t('Lists.import-this-guide-may-not-work-on-mobile-devices')}
        </Text>
      )}
      <List.Root
        as="ol"
        gap={2}
        bg="whiteAlpha.100"
        m={0}
        px={10}
        py={5}
        borderRadius={'md'}
        listStyle="decimal"
      >
        <List.Item>
          {t.rich('Lists.import-text-1', {
            Link: (chunk) => (
              <Link href="https://www.tampermonkey.net/" target="_blank" rel="noopener noreferrer">
                {chunk}
              </Link>
            ),
          })}
        </List.Item>
        <List.Item>
          {t.rich('Lists.import-text-2', {
            Link: (chunk) => (
              <Link
                href="https://github.com/lucca180/itemdb/raw/main/userscripts/listImporter.user.js"
                target="_blank"
                rel="noopener noreferrer"
              >
                {chunk}
              </Link>
            ),
          })}
        </List.Item>
        <List.Item>
          {t('Lists.importer-text-3')}
          <List.Root as="ul" gap={1} mb={3} listStyle="disc">
            <List.Item>
              <Link
                href="https://www.neopets.com/closet.phtml"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('General.closet')}
              </Link>
            </List.Item>
            <List.Item>
              <Link
                href="https://www.neopets.com/gallery/quickremove.phtml"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('General.gallery-quick-remove')}
              </Link>
            </List.Item>
            <List.Item>
              <Link
                href="https://www.neopets.com/safetydeposit.phtml"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('General.safety-deposit-box')}
              </Link>
            </List.Item>
            <List.Item>
              <Link
                href="https://www.neopets.com/gourmet_club.phtml"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={DynamicIcon}
                  alt="lightning bolt"
                  width={8}
                  style={{ display: 'inline' }}
                />{' '}
                {t('General.gourmet-club')} - {t('General.checklist')}
              </Link>
            </List.Item>
            <List.Item>
              <Link
                href="https://www.neopets.com/games/neodeck/index.phtml"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={DynamicIcon}
                  alt="lightning bolt"
                  width={8}
                  style={{ display: 'inline' }}
                />{' '}
                {t('General.neodeck')} - {t('General.checklist')}
              </Link>
            </List.Item>
            <List.Item>
              <Link
                href="https://www.neopets.com/stamps.phtml?type=album&page_id=1&owner="
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={DynamicIcon}
                  alt="lightning bolt"
                  width={8}
                  style={{ display: 'inline' }}
                />{' '}
                {t('General.stamp-album')} - {t('General.checklist')}
              </Link>
            </List.Item>
            <List.Item>
              <Link
                href="https://www.neopets.com/quickref.phtml"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={DynamicIcon}
                  alt="lightning bolt"
                  width={8}
                  style={{ display: 'inline' }}
                />{' '}
                {t('General.book-award')} - {t('General.checklist')}
              </Link>{' '}
              <Text fontSize={'sm'} pl={3} mb={1} color="gray.400">
                {' '}
                - {t('Lists.import-click-pets-intelligence-number')}
              </Text>
            </List.Item>
            <List.Item>
              <Link
                href="https://www.neopets.com/quickref.phtml"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={DynamicIcon}
                  alt="lightning bolt"
                  width={8}
                  style={{ display: 'inline' }}
                />{' '}
                {t('General.booktastic-books-award')} - Checklist
              </Link>{' '}
              <Text fontSize={'sm'} pl={3} mb={1} color="gray.400">
                {' '}
                - {t('Lists.import-click-pets-intelligence-number')}
                <br />- {t('Lists.import-then-click-the-booktastic-books-read-list-link')}
              </Text>
            </List.Item>
          </List.Root>
        </List.Item>
        <List.Item>
          {t.rich('Lists.click-import-button', {
            ImportButton: () => <ImportButton />,
          })}
        </List.Item>
        <List.Item>
          {t('Lists.import-text-3')}
          <Flex alignItems={'center'} gap={1} mt={1}>
            <Image src={DynamicIcon} alt="lightning bolt" width={8} style={{ display: 'inline' }} />{' '}
            <Text fontSize="sm" color="gray.400">
              {t.rich('Lists.import-text-4', {
                Dynamic: (chunk) => (
                  <Link asChild>
                    <MainLink href={'/articles/checklists-and-dynamic-lists'}>{chunk}</MainLink>
                  </Link>
                ),
                Official: (chunk) => (
                  <Link asChild>
                    <MainLink href={'/lists/official'}>{chunk}</MainLink>
                  </Link>
                ),
              })}
            </Text>
          </Flex>
        </List.Item>
      </List.Root>
      <Flex bg="whiteAlpha.200" p={3} borderRadius={'md'} my={3}>
        <Text fontSize="sm">
          {t.rich('Lists.adv-import-cta', {
            b: (chunk) => <b>{chunk}</b>,
            Link: (chunk) => (
              <Link asChild>
                <MainLink prefetch={false} href={'/lists/import/advanced'}>
                  {chunk}
                </MainLink>
              </Link>
            ),
          })}
        </Text>
      </Flex>
      <Heading size="md" mt={3}>
        {t('Lists.how-checklists-works')}
      </Heading>
      <Flex
        fontSize={'sm'}
        color="gray.400"
        flexFlow="column"
        gap={2}
        css={{ b: { color: 'white' } }}
      >
        <Text>
          {t.rich('Lists.checklists-text-1', {
            b: (chunk) => <b>{chunk}</b>,
          })}
        </Text>
        <Text>
          {t.rich('Lists.checklists-text-2', {
            b: (chunk) => <b>{chunk}</b>,
          })}
        </Text>
        <Text>
          {t.rich('Lists.checklists-text-3', {
            b: (chunk) => <b>{chunk}</b>,
            Link2: (chunk) => (
              <Link asChild>
                <MainLink prefetch={false} href={'/articles/checklists-and-dynamic-lists'}>
                  {chunk}
                </MainLink>
              </Link>
            ),
            Link: (chunk) => (
              <Link asChild>
                <MainLink prefetch={false} href={'/lists/official'}>
                  {chunk}
                </MainLink>
              </Link>
            ),
          })}
        </Text>
      </Flex>
      <Heading size="md" mt={3}>
        {t('Lists.scripts-troubleshooting')}
      </Heading>
      <Flex
        fontSize={'sm'}
        color="gray.400"
        flexFlow="column"
        gap={2}
        css={{ b: { color: 'white' } }}
      >
        <Text>
          {t.rich('Lists.scripts-troubleshooting-text', {
            Link: (chunk) => (
              <MainLink href="/articles/help-my-scripts-are-not-working">{chunk}</MainLink>
            ),
          })}
        </Text>
      </Flex>
      <Heading size="md" mt={3}>
        {t('Lists.import-is-it-safe')}
      </Heading>
      <Flex
        fontSize={'sm'}
        color="gray.400"
        flexFlow="column"
        gap={2}
        css={{ b: { color: 'white' } }}
      >
        <Text>
          {t.rich('Lists.import-text-5', {
            i: (chunk) => <i>{chunk}</i>,
          })}
          <br />
          <br />
          {t.rich('Lists.import-text-6', {
            b: (chunk) => <b>{chunk}</b>,
            Link: (chunk) => (
              <Link
                href="https://github.com/lucca180/itemdb/"
                target="_blank"
                rel="noopener noreferrer"
              >
                {chunk}
              </Link>
            ),
          })}
        </Text>
      </Flex>
    </Flex>
  );
};

const ImportButton = () => {
  return (
    <Box
      display="inline-flex"
      alignItems="center"
      bg="#2D3748"
      borderRadius="3px"
      gap="5px"
      p="5px"
      justifyContent="center"
      cursor="pointer"
      verticalAlign="middle"
    >
      <Image src={icon} alt="itemdb logo" width={25} quality={100} />
      <Text fontSize="sm">Import to itemdb</Text>
    </Box>
  );
};
