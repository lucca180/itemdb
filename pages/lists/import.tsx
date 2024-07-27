import {
  Divider,
  Flex,
  Heading,
  Link,
  ListItem,
  OrderedList,
  Text,
  Box,
  FormControl,
  FormLabel,
  Select,
  Checkbox,
  CheckboxGroup,
  VStack,
  Button,
  useToast,
  useMediaQuery,
  HStack,
  UnorderedList,
} from '@chakra-ui/react';
import Image from 'next/image';
import HeaderCard from '../../components/Card/HeaderCard';
import Layout from '../../components/Layout';
import icon from '../../public/logo_icon.svg';
import { parseBody } from 'next/dist/server/api-utils/node/parse-body';
import ListSelect from '../../components/UserLists/ListSelect';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { ItemData, UserList } from '../../types';
import ItemCard from '../../components/Items/ItemCard';
import { useAuth } from '../../utils/auth';
import { getList } from '../api/v1/lists/[username]/[list_id]';
import { CreateLinkedListButton } from '../../components/DynamicLists/CreateLinkedList';
import { useRouter } from 'next/router';
import DynamicIcon from '../../public/icons/dynamic.png';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
type Props = {
  items?: { [index: number | string]: number };
  indexType?: string;
  recomended_list?: UserList | null;
};

const ImportPage = (props: Props) => {
  const t = useTranslations();
  const { items, indexType, recomended_list } = props;
  return (
    <Layout
      SEO={{
        title: t('Lists.checklists-and-importing-items'),
        description: t('Lists.import-page-description'),
        openGraph: {
          images: [
            {
              url: 'https://images.neopets.com/caption/sm_caption_831.gif',
              width: 150,
              height: 150,
            },
          ],
        },
      }}
    >
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/caption/sm_caption_831.gif',
          alt: 'Importing Items Thumbnail',
        }}
        color="#65855B"
      >
        <Heading size="lg">{t('Lists.checklists-and-importing-items')}</Heading>
        <Text as="div" sx={{ a: { color: '#b8e9a9' } }}>
          {t('Lists.import-page-description')}
        </Text>
      </HeaderCard>
      <Flex flexFlow="column" gap={3} sx={{ a: { color: '#b8e9a9' } }}>
        <Divider />
        {!items && <ImportInfo />}
        {items && !!indexType && (
          <ImportItems items={items} indexType={indexType} recomended_list={recomended_list} />
        )}
      </Flex>
    </Layout>
  );
};

export default ImportPage;

export async function getServerSideProps(context: any) {
  const body = await parseBody(context.req, '4mb');
  const items = JSON.parse(body?.itemDataJson ?? 'null');
  const indexType = body?.indexType ?? 'item_id';
  const list_id = body?.list_id ?? null;

  const list = list_id ? await getList('official', Number(list_id), null, true) : null;

  return {
    props: {
      items: items,
      indexType: indexType,
      recomended_list: list,
      messages: (await import(`../../translation/${context.locale}.json`)).default,
    }, // will be passed to the page component as props
  };
}

type ImportItemsProps = {
  items: { [item_id: number | string]: number };
  indexType: string;
  recomended_list?: UserList | null;
};

const DefaultImportInfo = {
  list: undefined as UserList | undefined,
  items: [] as {
    item_iid: number;
    capValue?: number;
    amount?: number;
    imported: boolean;
  }[],
  ignore: [] as ('np' | 'nc' | 'quantity')[],
  action: 'add' as 'add' | 'remove' | 'hide',
};

const ImportItems = (props: ImportItemsProps) => {
  const t = useTranslations();
  const { user, getIdToken } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { items, indexType, recomended_list } = props;
  const [itemData, setItemData] = useState<{ [identifier: string | number]: ItemData } | null>(
    null
  );
  const [notFound, setNotFound] = useState<number>(0);
  const [importInfo, setImportInfo] = useState(DefaultImportInfo);

  useEffect(() => {
    return () => toast.closeAll();
  });

  useEffect(() => {
    init();
  }, [items]);

  const loadedItems = useMemo(
    () =>
      Object.entries(itemData ?? {}).sort(
        (a, b) => (b[1].price.value ?? 0) - (a[1].price.value ?? 0)
      ),
    [itemData, items]
  );

  const init = async () => {
    const itemRes = await axios.post(`/api/v1/items/many`, {
      [indexType]: Object.keys(items),
    });

    const data: { [identifier: string | number]: ItemData } = itemRes.data;
    const nullItems = Object.values(items).length - Object.values(data).length;
    setNotFound(nullItems);
    setItemData(data);
  };

  const handleImport = async () => {
    if (!itemData || !user || !importInfo.list) return;
    const canonicalAmount = {} as { [canonical_id: number]: number };
    const importData: {
      item_iid: number;
      capValue?: number;
      amount?: number;
      imported: boolean;
    }[] = Object.values(itemData)
      .filter((item: ItemData) => {
        if (item == null) return false;
        if (importInfo.ignore.includes('np') && item.type === 'np') return false;
        if (importInfo.ignore.includes('nc') && item.type === 'nc') return false;

        if (item.canonical_id) {
          canonicalAmount[item.canonical_id] = (canonicalAmount[item.canonical_id] ?? 0) + 1;
        }

        return true;
      })
      .map((item: ItemData) => ({
        item_iid: item.canonical_id ?? item.internal_id,
        amount: importInfo.ignore.includes('quantity')
          ? 1
          : item.canonical_id
          ? canonicalAmount[item.canonical_id]
          : items[item.item_id ?? -1] ?? 1,
        imported: true,
      }));

    if (!importData.length) {
      toast({
        title: t('General.error'),
        description: t('Lists.import-error'),
        status: 'error',
        duration: 10000,
      });

      return;
    }

    const toastInfo = toast({
      title: t('Lists.import-toast-title', {
        action: importInfo.action === 'add' ? t('General.importing') : t('General.removing'),
      }),
      description: t('Lists.import-please-wait', {
        action:
          importInfo.action === 'add'
            ? t('Lists.toast-import')
            : importInfo.action === 'hide'
            ? t('Lists.toast-hide')
            : t('Lists.toast-remove'),
      }),
      status: 'info',
      duration: null,
    });

    try {
      if (importInfo.action === 'add') {
        await axios.put(
          `/api/v1/lists/${user.username}/${importInfo.list.internal_id}/`,
          {
            items: importData,
          },
          {
            headers: {
              Authorization: `Bearer ${await getIdToken()}`,
            },
          }
        );
      }

      if (importInfo.action === 'remove' || importInfo.action === 'hide') {
        await axios.delete(`/api/v1/lists/${user.username}/${importInfo.list.internal_id}/`, {
          data: {
            item_iid: importData.map((item) => item.item_iid),
          },
          params: {
            hide: importInfo.action === 'hide',
          },
          headers: {
            Authorization: `Bearer ${await getIdToken()}`,
          },
        });
      }

      toast.update(toastInfo, {
        title: t('General.success'),
        description: t('Lists.import-success', {
          action:
            importInfo.action === 'add'
              ? t('Lists.toast-imported')
              : importInfo.action === 'hide'
              ? t('Lists.toast-hidden')
              : t('Lists.toast-removed'),
        }),
        status: 'success',
        duration: 10000,
        isClosable: true,
      });

      router.push(`/lists/${user.username}/${importInfo.list.internal_id}`);
    } catch (e) {
      console.error(e);
      toast.update(toastInfo, {
        title: t('General.error'),
        description: t('Lists.import-error-action', {
          action:
            importInfo.action === 'add'
              ? t('Lists.toast-importing')
              : importInfo.action === 'hide'
              ? t('Lists.toast-hidding')
              : t('Lists.toast-removing'),
        }),
        status: 'error',
        duration: null,
        isClosable: true,
      });
    }
  };

  const handleListChange = (list: UserList) => {
    let action = importInfo.action;

    if (list.dynamicType === 'fullSync' && ['remove', 'add'].includes(importInfo.action)) {
      action = 'hide';
    }

    if (list.dynamicType && list.dynamicType !== 'addOnly' && importInfo.action == 'add') {
      action = 'hide';
    }

    setImportInfo({
      ...importInfo,
      action,
      list,
    });
  };

  const handleIgnoreChange = (ignore: ('np' | 'nc' | 'quantity')[]) => {
    setImportInfo({
      ...importInfo,
      ignore,
    });
  };

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const action = e.target.value as 'add' | 'remove' | 'hide';
    setImportInfo({
      ...importInfo,
      action,
    });
  };

  const handleLinkedList = (list: UserList) => {
    setImportInfo({
      ...importInfo,
      action: 'hide',
      list,
    });
  };

  return (
    <>
      <Heading size="lg">Importing {Object.values(itemData ?? items).length} Items</Heading>
      {notFound > 0 && (
        <Text fontSize="sm" color="red.400">
          {t.rich('Lists.import-notFound', {
            b: (children) => <b>{children}</b>,
            notFound: notFound,
          })}
          ;
        </Text>
      )}
      <Flex flexFlow={{ base: 'column-reverse', md: 'row' }} gap={6}>
        <Flex flex="2" sx={{ a: { color: 'initial' } }} flexFlow="column">
          <Flex flexWrap="wrap" gap={3} justifyContent="center">
            {itemData &&
              loadedItems
                .slice(0, 30)
                .map((item) => (
                  <ItemCard
                    disablePrefetch={true}
                    key={item[0]}
                    item={item[1]}
                    quantity={items[item[0]]}
                  />
                ))}
            {!itemData && [...Array(20)].map((_, i) => <ItemCard key={i} />)}
          </Flex>
          {itemData && loadedItems.length > 30 && (
            <Text textAlign="center">
              {t('Lists.import-and-more', { value: loadedItems.length - 30 })}
            </Text>
          )}
        </Flex>
        <Flex flex="1" flexFlow="column" gap={3} alignItems={{ base: 'center', md: 'flex-start' }}>
          <FormControl>
            <FormLabel color="gray.300">{t('Lists.import-target-list')}</FormLabel>
            <ListSelect defaultValue={importInfo.list} onChange={handleListChange} createNew />
          </FormControl>
          <FormControl>
            <FormLabel color="gray.300">{t('General.action')}</FormLabel>
            <Select
              value={importInfo.action}
              variant="filled"
              maxW="220px"
              onChange={handleActionChange}
            >
              <option
                value="add"
                disabled={
                  !!importInfo.list?.dynamicType && importInfo.list?.dynamicType !== 'addOnly'
                }
              >
                {t('Lists.add-these-items')}
              </option>
              <option
                value="remove"
                disabled={
                  !!importInfo.list?.dynamicType && importInfo.list?.dynamicType === 'fullSync'
                }
              >
                {t('Lists.remove-these-items')}
              </option>
              <option value="hide">{t('Lists.mark-as-hidden')}</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel color="gray.300">{t('General.ignore')}</FormLabel>
            <CheckboxGroup
              colorScheme="green"
              value={importInfo.ignore}
              onChange={handleIgnoreChange}
            >
              <VStack justifyContent="flex-start" alignItems="flex-start">
                <Checkbox value="np">{t('General.np-items')}</Checkbox>
                <Checkbox value="nc">{t('General.nc-items')}</Checkbox>
                <Checkbox value="quantity">{t('General.quantities')}</Checkbox>
              </VStack>
            </CheckboxGroup>
          </FormControl>
          <HStack mt={3}>
            <Button onClick={handleImport} isDisabled={!importInfo.list}>
              {t('General.submit')}
            </Button>
            {recomended_list && (
              <>
                <Text>{t('General.or')}</Text>
                <CreateLinkedListButton
                  list={recomended_list}
                  isImport
                  onCreate={handleLinkedList}
                />
              </>
            )}
          </HStack>
        </Flex>
      </Flex>
    </>
  );
};

const ImportInfo = () => {
  const t = useTranslations();
  const [isLargerThanMD] = useMediaQuery('(min-width: 48em)', { fallback: true });

  return (
    <>
      <Heading size="lg">{t('Lists.import-step-by-step')}</Heading>
      {!isLargerThanMD && (
        <Text fontSize="sm" color="red.400">
          {t('Lists.import-this-guide-may-not-work-on-mobile-devices')}
        </Text>
      )}
      <OrderedList spacing={2}>
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
          <Text fontSize="sm">
            <Image src={DynamicIcon} alt="lightning bolt" width={8} style={{ display: 'inline' }} />{' '}
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
        </ListItem>
      </OrderedList>
      <Heading size="md" mt={3}>
        {t('Lists.import-is-it-safe')}
      </Heading>
      <Text>
        {t.rich('Lists.import-text-5', {
          i: (chunk) => <i>{chunk}</i>,
        })}
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
    </>
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
