'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Flex, Heading, Icon, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { LuRotateCcw } from 'react-icons/lu';
import Pagination from '@components/Input/Pagination';
import { useToast } from '@utils/theme/toast';
import { useRouter } from '@i18n/navigation';
import type { UserList, UserListLite } from '@types';
import { applyListImportV2, loadImportItemsPage } from './actions';
import {
  IMPORT_ERROR,
  IMPORT_V2_PAGE_SIZE,
  MAX_IMPORT_ITEMS,
  type ImportAction,
  type ImportErrorCode,
  type ImportFilterType,
  type ImportIgnore,
  type ImportItemsPageResult,
  type ImportSortDir,
  type ImportSortKey,
} from './importV2Shared';
import { ImportControlsSidebar } from './ImportControlsSidebar';
import { ImportItemTable } from './ImportItemTable';
import { ImportItemsLoadingSkeleton } from './ImportItemsLoadingSkeleton';
import { ImportSessionAlert } from './ImportSessionAlert';
import { ImportSummaryBar } from './ImportSummaryBar';
import { ImportToolbar } from './ImportToolbar';

type ImportItemsV2Props = {
  importToken: string;
  itemCount: number;
  recommended_list?: UserList | null;
};

const IMPORT_ERROR_CODES = new Set<string>(Object.values(IMPORT_ERROR));

function getImportErrorCode(err: unknown): ImportErrorCode | null {
  if (!(err instanceof Error)) return null;
  return IMPORT_ERROR_CODES.has(err.message) ? (err.message as ImportErrorCode) : null;
}

export function ImportItemsV2({ importToken, itemCount, recommended_list }: ImportItemsV2Props) {
  const t = useTranslations();
  const router = useRouter();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<ImportSortKey>('price_qty');
  const [sortDir, setSortDir] = useState<ImportSortDir>('desc');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ImportFilterType>('all');
  const [result, setResult] = useState<ImportItemsPageResult | null>(null);
  const [loadError, setLoadError] = useState<ImportErrorCode | 'UNKNOWN' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [list, setList] = useState<UserListLite | undefined>();
  const [action, setAction] = useState<ImportAction>('add');
  const [ignore, setIgnore] = useState<ImportIgnore[]>([]);

  const requestId = useRef(0);
  const isTooLarge = itemCount > MAX_IMPORT_ITEMS;
  const canSubmit = Boolean(list) && !isTooLarge && !loadError && !isSubmitting;

  const describeImportError = (code: ImportErrorCode | 'UNKNOWN' | null, actionLabel: string) => {
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
        return t('Lists.import-error-action', { action: actionLabel });
    }
  };

  const fetchPage = useCallback(async () => {
    if (isTooLarge) {
      setLoadError(IMPORT_ERROR.TOO_LARGE);
      setResult(null);
      setIsLoading(false);
      return;
    }

    const id = ++requestId.current;
    setIsLoading(true);
    try {
      const next = await loadImportItemsPage({
        importToken,
        page,
        pageSize: IMPORT_V2_PAGE_SIZE,
        sortBy,
        sortDir,
        search,
        filter,
      });
      if (id !== requestId.current) return;
      setResult(next);
      setLoadError(null);
      if (next.page !== page) setPage(next.page);
    } catch (err) {
      if (id !== requestId.current) return;
      console.error(err);
      const code = getImportErrorCode(err) ?? 'UNKNOWN';
      setLoadError(code);
      setResult(null);
      toast({
        id: 'import-v2-load-error',
        title: t('General.error'),
        description:
          code === 'UNKNOWN' ? t('Lists.import-error-load') : describeImportError(code, ''),
        status: 'error',
        duration: 10000,
        isClosable: true,
      });
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, [importToken, page, sortBy, sortDir, search, filter, isTooLarge, t, toast]);

  useEffect(() => {
    void fetchPage();
  }, [fetchPage]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearch((prev) => {
        if (prev === searchInput) return prev;
        setPage(1);
        return searchInput;
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const handleSortChange = (key: ImportSortKey, dir: ImportSortDir) => {
    setSortBy(key);
    setSortDir(dir);
    setPage(1);
  };

  const handleFilterChange = (next: ImportFilterType) => {
    setFilter(next);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearch('');
    setFilter('all');
    setPage(1);
  };

  const handleListChange = (next: UserListLite) => {
    let nextAction = action;
    if (next.dynamicType === 'fullSync' && ['remove', 'add'].includes(action)) {
      nextAction = 'hide';
    }
    if (next.dynamicType && next.dynamicType !== 'addOnly' && action === 'add') {
      nextAction = 'hide';
    }
    setAction(nextAction);
    setList(next);
  };

  const handleLinkedList = (next: UserList) => {
    setAction('hide');
    setList(next);
  };

  const toggleIgnore = (value: ImportIgnore) => {
    setIgnore((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleImport = async () => {
    if (!list || !canSubmit) return;

    const actionLabel =
      action === 'add'
        ? t('Lists.toast-importing')
        : action === 'hide'
          ? t('Lists.toast-hidding')
          : t('Lists.toast-removing');

    setIsSubmitting(true);
    const toastInfo = toast({
      id: 'import-list-v2',
      title: t('Lists.import-toast-title', {
        action: action === 'add' ? t('General.importing') : t('General.removing'),
      }),
      description: t('Lists.import-please-wait', {
        action:
          action === 'add'
            ? t('Lists.toast-import')
            : action === 'hide'
              ? t('Lists.toast-hide')
              : t('Lists.toast-remove'),
      }),
      status: 'loading',
      duration: Infinity,
    });

    try {
      const applyResult = await applyListImportV2({
        importToken,
        listId: list.internal_id,
        action,
        ignore,
      });

      toast.update(toastInfo, {
        id: toastInfo,
        title: t('General.success'),
        description: t('Lists.import-success', {
          action:
            action === 'add'
              ? t('Lists.toast-imported')
              : action === 'hide'
                ? t('Lists.toast-hidden')
                : t('Lists.toast-removed'),
        }),
        status: 'success',
        duration: 10000,
        isClosable: true,
      });

      if (applyResult.notFoundCount > 0) {
        toast({
          id: 'import-v2-not-found',
          title: t('General.tip'),
          description: t.rich('Lists.import-notFound', {
            notFound: applyResult.notFoundCount,
            b: (chunk) => <b>{chunk}</b>,
          }),
          status: 'warning',
          duration: 12000,
          isClosable: true,
        });
      }

      router.push(applyResult.listPath);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasActiveFilters = Boolean(searchInput.trim() || filter !== 'all');
  const isInitialLoading = isLoading && !result && !loadError && !isTooLarge;

  return (
    <Flex flexFlow="column" gap={4} css={{ '& a': { color: '#b8e9a9' } }}>
      {isTooLarge && (
        <Alert.Root status="error" variant="surface" maxW="750px">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t('Lists.import-error-too-large-title')}</Alert.Title>
            <Alert.Description>
              {t('Lists.import-error-too-large', { count: itemCount, max: MAX_IMPORT_ITEMS })}
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      {!isTooLarge && loadError === IMPORT_ERROR.EXPIRED && (
        <ImportSessionAlert variant="expired" />
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

      {isInitialLoading && <ImportItemsLoadingSkeleton />}

      {!isInitialLoading && !loadError && !isTooLarge && (
        <>
          {result && (
            <ImportSummaryBar
              summary={result.summary}
              totalCount={result.totalCount}
              notFoundCount={result.notFoundCount}
            />
          )}

          {result && (
            <ImportToolbar
              searchQuery={searchInput}
              onSearchChange={setSearchInput}
              filterType={filter}
              onFilterChange={handleFilterChange}
              sortBy={sortBy}
              sortDir={sortDir}
              onSortChange={handleSortChange}
              filterCounts={result.filterCounts}
              page={result.page}
              pageSize={result.pageSize}
              totalFiltered={result.totalFiltered}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={handleResetFilters}
            />
          )}

          <Flex direction={{ base: 'column', lg: 'row' }} gap={5} align="flex-start" w="100%">
            <Box flex="1" minW={0} w="100%" css={{ '& a': { color: 'initial' } }}>
              {result && result.items.length === 0 && !isLoading ? (
                <Box
                  p={10}
                  bg="gray.900"
                  borderWidth="1px"
                  borderColor="whiteAlpha.200"
                  borderRadius="lg"
                  textAlign="center"
                >
                  <Heading size="sm" color="whiteAlpha.800" mb={2}>
                    {t('Lists.importV2-empty-title')}
                  </Heading>
                  <Text fontSize="sm" color="whiteAlpha.600" mb={4}>
                    {t('Lists.importV2-empty-desc')}
                  </Text>
                  <Button size="sm" colorPalette="teal" onClick={handleResetFilters}>
                    <Icon as={LuRotateCcw} mr={1} />
                    {t('Lists.importV2-reset-filters')}
                  </Button>
                </Box>
              ) : (
                <>
                  <ImportItemTable
                    items={result?.items ?? []}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSortChange={handleSortChange}
                    isLoading={isLoading}
                  />
                  {result && result.totalPages > 1 && (
                    <Pagination
                      currentPage={result.page}
                      totalPages={result.totalPages}
                      setPage={setPage}
                      mt={4}
                    />
                  )}
                </>
              )}
            </Box>

            <Box
              w={{ base: '100%', lg: '300px', xl: '320px' }}
              flexShrink={0}
              position={{ base: 'static', lg: 'sticky' }}
              top="24px"
            >
              <ImportControlsSidebar
                list={list}
                onListChange={handleListChange}
                recommended_list={recommended_list}
                onLinkedList={handleLinkedList}
                action={action}
                onActionChange={setAction}
                ignore={ignore}
                onToggleIgnore={toggleIgnore}
                onSubmit={handleImport}
                isSubmitting={isSubmitting}
                canSubmit={canSubmit}
                itemCount={result?.totalCount ?? itemCount}
              />
            </Box>
          </Flex>
        </>
      )}
    </Flex>
  );
}
