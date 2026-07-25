'use client';

import {
  Flex,
  Heading,
  Link,
  Text,
  Field,
  NativeSelect,
  Checkbox,
  VStack,
  Button,
  HStack,
} from '@chakra-ui/react';
import { useToast } from '@utils/theme/toast';
import ListSelect from '@components/UserLists/ListSelect';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import type { ItemV2For, UserList } from '@types';
import ItemCardV2 from '@components/Items/v2/ItemCardV2';
import { useAuth } from '@utils/auth';
import { CreateLinkedListButton } from '@components/DynamicLists/CreateLinkedList';
import { useRouter } from '@i18n/navigation';
import MainLink from '@components/Utils/MainLink';
import { useTranslations } from 'next-intl';
import { dynamicListCan } from '@utils/utils';
import { fetchManyItems } from '@app/server/items/actions';

/** Mirrors `encodeNameImageKey` in `@app/server/items/v2` (client-safe copy). */
function encodeNameImageKey(name: string, imageId: string): string {
  return `${encodeURI(name.toLowerCase())}_${imageId}`;
}

type LookupType = 'id' | 'item_id' | 'name_image_id' | 'image_id' | 'name' | 'slug';

type ImportItemsExperienceProps = {
  items: { [item_id: number | string]: number };
  indexType: string;
  recommended_list?: UserList | null;
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

function npPriceValue(item: ItemV2For<'full'> | ItemV2For<'card'>): number {
  return item.price?.type === 'np' ? item.price.value : 0;
}

/** Resolve how many of this item were in the import payload. */
function importQuantity(
  items: { [key: number | string]: number },
  item: ItemV2For<'full'>,
  responseKey: string
): number {
  return (
    items[responseKey] ??
    items[item.item_id ?? -1] ??
    items[item.name] ??
    items[item.image.id] ??
    items[`${item.name},${item.image.id}`] ??
    1
  );
}

function isLookupType(value: string): value is LookupType {
  return (
    value === 'id' ||
    value === 'item_id' ||
    value === 'name_image_id' ||
    value === 'image_id' ||
    value === 'name' ||
    value === 'slug'
  );
}

export function ImportItems({ items, indexType, recommended_list }: ImportItemsExperienceProps) {
  const t = useTranslations();
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [itemData, setItemData] = useState<Record<string, ItemV2For<'full'>> | null>(null);
  const [notFound, setNotFound] = useState<number>(0);
  const [importInfo, setImportInfo] = useState(DefaultImportInfo);

  useEffect(() => {
    return () => toast.closeAll();
  }, [toast]);

  const loadedItems = useMemo(
    () => Object.entries(itemData ?? {}).sort((a, b) => npPriceValue(b[1]) - npPriceValue(a[1])),
    [itemData]
  );

  const init = async () => {
    if (!isLookupType(indexType)) {
      console.error('Invalid import indexType:', indexType);
      setItemData({});
      setNotFound(Object.keys(items).length);
      return;
    }

    const query =
      indexType === 'name_image_id'
        ? {
            type: 'name_image_id' as const,
            data: Object.keys(items).map((key) => {
              const parts = key.split(/,(?=[^,]*$)/);
              return [parts[0] ?? '', parts[1] ?? ''] as [string, string];
            }),
          }
        : {
            type: indexType,
            data: Object.keys(items),
          };

    try {
      const data = await fetchManyItems(query, { intent: 'full' });

      const notFoundItems = Object.keys(items).filter((key) => {
        if (indexType === 'name_image_id') {
          const params = key.split(/,(?=[^,]*$)/);
          return !data[encodeNameImageKey(params[0] ?? '', params[1] ?? '')];
        }
        return !data[key];
      });

      if (notFoundItems.length > 0) console.error('not found items:', notFoundItems);

      setNotFound(Object.keys(items).length - Object.keys(data).length);
      setItemData(data);
    } catch (err) {
      console.error(err);
      setItemData({});
      setNotFound(Object.keys(items).length);
      toast({
        id: 'import-items-load-error',
        title: t('General.error'),
        description: t('Lists.import-error'),
        status: 'error',
        duration: 10000,
        isClosable: true,
      });
    }
  };

  const handleImport = async () => {
    if (!itemData || !user || !importInfo.list) return;
    const canonicalAmount = {} as { [canonical_id: number]: number };
    const importData: {
      item_iid: number;
      capValue?: number;
      amount?: number;
      imported: boolean;
    }[] = Object.entries(itemData)
      .filter(([, item]) => {
        if (item == null) return false;
        if (importInfo.ignore.includes('np') && item.type === 'np') return false;
        if (importInfo.ignore.includes('nc') && item.type === 'nc') return false;

        if (item.canonical_id) {
          canonicalAmount[item.canonical_id] = (canonicalAmount[item.canonical_id] ?? 0) + 1;
        }

        return true;
      })
      .map(([responseKey, item]) => {
        const importedItem = importQuantity(items, item, responseKey);

        return {
          item_iid: item.canonical_id ?? item.internal_id,
          amount: importInfo.ignore.includes('quantity')
            ? 1
            : item.canonical_id
              ? canonicalAmount[item.canonical_id]
              : importedItem,
          imported: true,
        };
      });

    if (!importData.length) {
      toast({
        id: 'import-list-no-data',
        title: t('General.error'),
        description: t('Lists.import-error'),
        status: 'error',
        duration: 10000,
      });

      return;
    }

    const toastInfo = toast({
      id: 'import-list',
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
      status: 'loading',
      duration: Infinity,
    });

    try {
      if (importInfo.action === 'add') {
        await axios.put(`/api/v1/lists/${user.username}/${importInfo.list.internal_id}/`, {
          items: importData,
        });
      }

      if (importInfo.action === 'remove' || importInfo.action === 'hide') {
        await axios.delete(`/api/v1/lists/${user.username}/${importInfo.list.internal_id}/`, {
          data: {
            item_iid: importData.map((item) => item.item_iid),
          },
          params: {
            hide: importInfo.action === 'hide',
          },
        });
      }

      toast.update(toastInfo, {
        id: toastInfo,
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
        id: toastInfo,
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

  const toggleIgnore = (value: 'np' | 'nc' | 'quantity') => {
    const ignore = importInfo.ignore.includes(value)
      ? importInfo.ignore.filter((item) => item !== value)
      : [...importInfo.ignore, value];

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void init();
  }, [items, indexType]);

  return (
    <Flex flexFlow="column" gap={3} css={{ '& a': { color: '#b8e9a9' } }}>
      <Heading size="lg">
        {t('Lists.importing-x-items', { x: Object.values(itemData ?? items).length })}
      </Heading>
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
        <Flex flex="2" css={{ '& a': { color: 'initial' } }} flexFlow="column">
          <Flex flexWrap="wrap" gap={3} justifyContent="center">
            {itemData &&
              loadedItems
                .slice(0, 30)
                .map(([key, item]) => (
                  <ItemCardV2
                    uniqueID={`import-list`}
                    disablePrefetch={true}
                    key={key}
                    item={item}
                    quantity={importQuantity(items, item, key)}
                  />
                ))}
            {!itemData &&
              [...Array(20)].map((_, i) => (
                <ItemCardV2 uniqueID={`import-list`} key={i} isLoading />
              ))}
          </Flex>
          {itemData && loadedItems.length > 30 && (
            <Text textAlign="center">
              {t('Lists.import-and-more', { value: loadedItems.length - 30 })}
            </Text>
          )}
        </Flex>
        <Flex flex="1" flexFlow="column" gap={5} alignItems={{ base: 'center', md: 'flex-start' }}>
          <Field.Root>
            <Field.Label color="gray.300">{t('Lists.import-target-list')}</Field.Label>
            <Flex gap={2} flexFlow="column" flexWrap="wrap" alignItems={'flex-start'}>
              <ListSelect
                defaultValue={importInfo.list}
                onChange={handleListChange}
                createNew
                recommended_id={recommended_list?.internal_id}
              />
              {recommended_list && (
                <>
                  <Text fontSize={'xs'} color="gray.300">
                    {t('General.or')}
                  </Text>
                  <CreateLinkedListButton
                    list={recommended_list}
                    isImport
                    onCreate={handleLinkedList}
                  />
                </>
              )}
            </Flex>
          </Field.Root>
          <Field.Root>
            <Field.Label color="gray.300">{t('General.action')}</Field.Label>
            <NativeSelect.Root variant="subtle" maxW="220px">
              <NativeSelect.Field value={importInfo.action} onChange={handleActionChange}>
                <option value="add" disabled={!dynamicListCan(importInfo.list, 'add')}>
                  {t('Lists.add-these-items')}
                </option>
                <option value="remove" disabled={!dynamicListCan(importInfo.list, 'remove')}>
                  {t('Lists.remove-these-items')}
                </option>
                <option value="hide">{t('Lists.mark-as-hidden')}</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
          <Field.Root>
            <Field.Label color="gray.300">{t('General.ignore')}</Field.Label>
            <VStack justifyContent="flex-start" alignItems="flex-start">
              {(['np', 'nc', 'quantity'] as const).map((value) => (
                <Checkbox.Root
                  key={value}
                  colorPalette="green"
                  checked={importInfo.ignore.includes(value)}
                  onCheckedChange={() => toggleIgnore(value)}
                >
                  <Checkbox.HiddenInput value={value} />
                  <Checkbox.Control />
                  <Checkbox.Label>
                    {value === 'np'
                      ? t('General.np-items')
                      : value === 'nc'
                        ? t('General.nc-items')
                        : t('General.quantities')}
                  </Checkbox.Label>
                </Checkbox.Root>
              ))}
            </VStack>
          </Field.Root>
          <HStack mt={3}>
            <Button onClick={handleImport} disabled={!importInfo.list}>
              {t('General.submit')}
            </Button>
          </HStack>
          <Flex bg="whiteAlpha.300" p={3} borderRadius={'md'} maxW="1000px" my={3}>
            <Text fontSize={'sm'} textAlign={'center'}>
              {t.rich('Lists.adv-import-cta', {
                b: (chunk) => <b>{chunk}</b>,
                Link: (chunk) => (
                  <Link asChild>
                    <MainLink href={'/lists/import/advanced'} prefetch={false}>
                      {chunk}
                    </MainLink>
                  </Link>
                ),
              })}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}
