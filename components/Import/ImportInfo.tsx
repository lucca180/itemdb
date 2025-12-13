import {
  useMediaQuery,
  Heading,
  OrderedList,
  ListItem,
  UnorderedList,
  Flex,
  Text,
  Link,
  Box,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import DynamicIcon from '../../public/icons/dynamic.png';
import NextLink from 'next/link';
import icon from '../../public/logo_icon.svg';

export const ImportInfo = () => {
  const t = useTranslations();
  const [isLargerThanMD] = useMediaQuery('(min-width: 48em)', { fallback: true });

  return (
    <Flex flexFlow="column" gap={3} maxW="1000px">
      <Heading size="md">{t('Lists.import-step-by-step')}</Heading>
      {!isLargerThanMD && (
        <Text fontSize="sm" color="red.400">
          {t('Lists.import-this-guide-may-not-work-on-mobile-devices')}
        </Text>
      )}
      <OrderedList spacing={2} bg="whiteAlpha.100" m={0} px={10} py={5} borderRadius={'md'}>
        <ListItem>
          {t.rich('Lists.import-text-1', {
            Link: (chunk) => (
              <Link href="https://www.tampermonkey.net/" isExternal>
                {chunk}
              </Link>
            ),
          })}
        </ListItem>
        <ListItem>
          {t.rich('Lists.import-text-2', {
            Link: (chunk) => (
              <Link
                href="https://github.com/lucca180/itemdb/raw/main/userscripts/listImporter.user.js"
                isExternal
              >
                {chunk}
              </Link>
            ),
          })}
        </ListItem>
        <ListItem>
          {t('Lists.importer-text-3')}
          <UnorderedList spacing={1} mb={3}>
            <ListItem>
              <Link href="https://www.neopets.com/closet.phtml" isExternal>
                {t('General.closet')}
              </Link>
            </ListItem>
            <ListItem>
              <Link href="https://www.neopets.com/gallery/quickremove.phtml" isExternal>
                {t('General.gallery-quick-remove')}
              </Link>
            </ListItem>
            <ListItem>
              <Link href="https://www.neopets.com/safetydeposit.phtml" isExternal>
                {t('General.safety-deposit-box')}
              </Link>
            </ListItem>
            <ListItem>
              <Link href="https://www.neopets.com/gourmet_club.phtml" isExternal>
                <Image
                  src={DynamicIcon}
                  alt="lightning bolt"
                  width={8}
                  style={{ display: 'inline' }}
                />{' '}
                {t('General.gourmet-club')} - {t('General.checklist')}
              </Link>
            </ListItem>
            <ListItem>
              <Link href="https://www.neopets.com/games/neodeck/index.phtml" isExternal>
                <Image
                  src={DynamicIcon}
                  alt="lightning bolt"
                  width={8}
                  style={{ display: 'inline' }}
                />{' '}
                {t('General.neodeck')} - {t('General.checklist')}
              </Link>
            </ListItem>
            <ListItem>
              <Link
                href="https://www.neopets.com/stamps.phtml?type=album&page_id=1&owner="
                isExternal
              >
                <Image
                  src={DynamicIcon}
                  alt="lightning bolt"
                  width={8}
                  style={{ display: 'inline' }}
                />{' '}
                {t('General.stamp-album')} - {t('General.checklist')}
              </Link>
            </ListItem>
            <ListItem>
              <Link href="https://www.neopets.com/quickref.phtml" isExternal>
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
            </ListItem>
            <ListItem>
              <Link href="https://www.neopets.com/quickref.phtml" isExternal>
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
            </ListItem>
          </UnorderedList>
        </ListItem>
        <ListItem>
          {t.rich('Lists.click-import-button', {
            ImportButton: () => <ImportButton />,
          })}
        </ListItem>
        <ListItem>
          {t('Lists.import-text-3')}
          <Flex alignItems={'center'} gap={1} mt={1}>
            <Image src={DynamicIcon} alt="lightning bolt" width={8} style={{ display: 'inline' }} />{' '}
            <Text fontSize="sm" color="gray.400">
              {t.rich('Lists.import-text-4', {
                Dynamic: (chunk) => (
                  <Link as={NextLink} href={'/articles/checklists-and-dynamic-lists'}>
                    {chunk}
                  </Link>
                ),
                Official: (chunk) => (
                  <Link as={NextLink} href={'/lists/official'}>
                    {chunk}
                  </Link>
                ),
              })}
            </Text>
          </Flex>
        </ListItem>
      </OrderedList>
      <Flex bg="whiteAlpha.200" p={3} borderRadius={'md'} my={3}>
        <Text fontSize="sm">
          {t.rich('Lists.adv-import-cta', {
            b: (chunk) => <b>{chunk}</b>,
            Link: (chunk) => (
              <Link as={NextLink} prefetch={false} href={'/lists/import/advanced'}>
                {chunk}
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
        sx={{ b: { color: 'white' } }}
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
              <Link as={NextLink} prefetch={false} href={'/articles/checklists-and-dynamic-lists'}>
                {chunk}
              </Link>
            ),
            Link: (chunk) => (
              <Link as={NextLink} prefetch={false} href={'/lists/official'}>
                {chunk}
              </Link>
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
        sx={{ b: { color: 'white' } }}
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
              <Link href="https://github.com/lucca180/itemdb/" isExternal>
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
      <Image src={icon} alt="itemdb logo" width={25} quality="100" />
      <Text fontSize="sm">Import to itemdb</Text>
    </Box>
  );
};
