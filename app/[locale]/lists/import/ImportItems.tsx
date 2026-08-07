'use client';

import {
  Alert,
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
import { useEffect, useState } from 'react';
import type { UserList, UserListLite } from '@types';
import ItemCardV2 from '@components/Items/v2/ItemCardV2';
import { CreateLinkedListButton } from '@components/DynamicLists/CreateLinkedList';
import { useRouter } from '@i18n/navigation';
import MainLink from '@components/Utils/MainLink';
import { useTranslations } from 'next-intl';
import { dynamicListCan } from '@utils/utils';
import { applyListImport, loadImportPreview } from './actions';
import {
  IMPORT_ERROR,
  MAX_IMPORT_ITEMS,
  type ImportErrorCode,
  type ImportPreviewItem,
} from './importShared';

type ImportItemsExperienceProps = {
  importToken: string;
  itemCount: number;
  recommended_list?: UserList | null;
};

const DefaultImportInfo = {
  list: undefined as UserListLite | undefined,
  ignore: [] as ('np' | 'nc' | 'quantity')[],
  action: 'add' as 'add' | 'remove' | 'hide',
};

const IMPORT_ERROR_CODES = new Set<string>(Object.values(IMPORT_ERROR));

function getImportErrorCode(err: unknown): ImportErrorCode | null {
  if (!(err instanceof Error)) return null;
  return IMPORT_ERROR_CODES.has(err.message) ? (err.message as ImportErrorCode) : null;
}

export function ImportItems({
  importToken,
  itemCount,
  recommended_list,
}: ImportItemsExperienceProps) {
  const t = useTranslations();
  const router = useRouter();
  const toast = useToast();
  const [previewItems, setPreviewItems] = useState<ImportPreviewItem[] | null>(null);
  const [loadError, setLoadError] = useState<ImportErrorCode | 'UNKNOWN' | null>(null);
  const [importInfo, setImportInfo] = useState(DefaultImportInfo);

  const isTooLarge = itemCount > MAX_IMPORT_ITEMS;
  const canSubmit = Boolean(importInfo.list) && !isTooLarge && !loadError;

  const describeImportError = (code: ImportErrorCode | 'UNKNOWN' | null, action: string) => {
    switch (code) {
      case IMPORT_ERROR.TOO_LARGE:
        return t('Lists.import-error-too-large', { count: itemCount, max: MAX_IMPORT_ITEMS });
      case IMPORT_ERROR.EXPIRED:
        return t('Lists.import-error-expired');
      case IMPORT_ERROR.UNAUTHORIZED:
        return t('Lists.import-error-unauthorized');
      case IMPORT_ERROR.FORBIDDEN_ACTION:
        return t('Lists.import-error-forbidden');
      case IMPORT_ERROR.LIST_NOT_FOUND:
        return t('Lists.import-error-list-not-found');
      case IMPORT_ERROR.NO_ITEMS:
      case IMPORT_ERROR.EMPTY:
        return t('Lists.import-error');
      case IMPORT_ERROR.INVALID_TYPE:
        return t('Lists.import-error-invalid');
      default:
        return t('Lists.import-error-action', { action });
    }
  };

  const init = async () => {
    if (isTooLarge) {
      setPreviewItems([]);
      setLoadError(IMPORT_ERROR.TOO_LARGE);
      return;
    }

    try {
      const preview = await loadImportPreview(importToken);
      setPreviewItems(preview.items);
      setLoadError(null);
    } catch (err) {
      console.error(err);
      setPreviewItems([]);
      const code = getImportErrorCode(err) ?? 'UNKNOWN';
      setLoadError(code);
      toast({
        id: 'import-items-load-error',
        title: t('General.error'),
        description:
          code === 'UNKNOWN' ? t('Lists.import-error-load') : describeImportError(code, ''),
        status: 'error',
        duration: 10000,
        isClosable: true,
      });
    }
  };

  const handleImport = async () => {
    if (!importInfo.list || !canSubmit) return;

    const actionLabel =
      importInfo.action === 'add'
        ? t('Lists.toast-importing')
        : importInfo.action === 'hide'
          ? t('Lists.toast-hidding')
          : t('Lists.toast-removing');

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
      const result = await applyListImport({
        importToken,
        listId: importInfo.list.internal_id,
        action: importInfo.action,
        ignore: importInfo.ignore,
      });

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

      if (result.notFoundCount > 0) {
        toast({
          id: 'import-not-found',
          title: t('General.tip'),
          description: t.rich('Lists.import-notFound', {
            notFound: result.notFoundCount,
            b: (chunk) => <b>{chunk}</b>,
          }),
          status: 'warning',
          duration: 12000,
          isClosable: true,
        });
      }

      router.push(result.listPath);
    } catch (e) {
      console.error(e);
      const code = getImportErrorCode(e);
      if (code === IMPORT_ERROR.EXPIRED || code === IMPORT_ERROR.TOO_LARGE) {
        setLoadError(code);
      }
      toast.update(toastInfo, {
        id: toastInfo,
        title: t('General.error'),
        description: describeImportError(code ?? 'UNKNOWN', actionLabel),
        status: 'error',
        duration: null,
        isClosable: true,
      });
    }
  };

  const handleListChange = (list: UserListLite) => {
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
  }, [importToken]);

  return (
    <Flex flexFlow="column" gap={3} css={{ '& a': { color: '#b8e9a9' } }}>
      <Heading size="lg">{t('Lists.importing-x-items', { x: itemCount })}</Heading>

      {isTooLarge && (
        <Alert.Root status="error" variant="surface" maxW="750px">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t('Lists.import-error-too-large-title')}</Alert.Title>
            <Alert.Description>
              {t('Lists.import-error-too-large', {
                count: itemCount,
                max: MAX_IMPORT_ITEMS,
              })}
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      {!isTooLarge && loadError === IMPORT_ERROR.EXPIRED && (
        <Alert.Root status="error" variant="surface" maxW="750px">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t('Lists.import-error-expired-title')}</Alert.Title>
            <Alert.Description>{t('Lists.import-error-expired')}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      {!isTooLarge && loadError && loadError !== IMPORT_ERROR.EXPIRED && (
        <Alert.Root status="error" variant="surface" maxW="750px">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t('General.error')}</Alert.Title>
            <Alert.Description>
              {loadError === 'UNKNOWN'
                ? t('Lists.import-error-load')
                : describeImportError(loadError, '')}
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      <Flex flexFlow={{ base: 'column-reverse', md: 'row' }} gap={6}>
        <Flex flex="2" css={{ '& a': { color: 'initial' } }} flexFlow="column">
          <Flex flexWrap="wrap" gap={3} justifyContent="center">
            {previewItems &&
              previewItems.map(({ key, item, quantity }) => (
                <ItemCardV2
                  uniqueID="import-list"
                  disablePrefetch
                  key={key}
                  item={item}
                  quantity={quantity}
                />
              ))}
            {!previewItems &&
              !isTooLarge &&
              [...Array(20)].map((_, i) => (
                <ItemCardV2 uniqueID={`import-list`} key={i} isLoading />
              ))}
          </Flex>
          {previewItems && itemCount > previewItems.length && (
            <Text textAlign="center">
              {t('Lists.import-and-more', { value: itemCount - previewItems.length })}
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
            <Button onClick={handleImport} disabled={!canSubmit}>
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
