import { useEffect, useMemo, useState } from 'react';
import {
  AutoComplete,
  AutoCompleteInput,
  AutoCompleteItem,
  AutoCompleteList,
} from '@choc-ui/chakra-autocomplete';
import type { Item } from '@choc-ui/chakra-autocomplete';
import axios from 'axios';
import { Flex, Image, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import type { UserList } from '@types';

type Props = {
  isDisabled?: boolean;
  placeholder?: string;
  onChange?: (list: UserList) => void;
  /** Lists left out of the results (e.g. the ones that already hold the item). */
  excludeListIds?: number[];
  /** Leaves dynamic lists out: they are filled by their query and can't take manual changes. */
  excludeDynamic?: boolean;
};

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Official list picker: searches as the user types (server-side, through the omni search) and
 * shows a handful of results, so it never loads the whole official list catalog.
 */
const OfficialListSelect = (props: Props) => {
  const t = useTranslations();
  const { onChange, excludeListIds, excludeDynamic } = props;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserList[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const search = query.trim();
    if (!search) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await axios.get('/api/v1/search/omni', {
          params: { only: ['officialLists'], s: search },
        });
        if (!cancelled) setResults(res.data.officialLists as UserList[]);
      } catch (err) {
        console.error(err);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const hasQuery = !!query.trim();

  const lists = useMemo(
    () =>
      !hasQuery
        ? []
        : results.filter(
            (list) =>
              list.official &&
              list.visibility === 'public' &&
              !(excludeDynamic && list.dynamicType) &&
              !excludeListIds?.includes(list.internal_id)
          ),
    [hasQuery, results, excludeDynamic, excludeListIds]
  );

  const onSelectOption = ({ item }: { item: Item }) => {
    onChange?.(item.originalValue ?? item.value);
    setQuery('');
  };

  return (
    <>
      <AutoComplete
        rollNavigation
        disableFilter
        isLoading={isLoading}
        onSelectOption={onSelectOption}
      >
        <AutoCompleteInput
          placeholder={props.placeholder ?? t('Search.search')}
          disabled={props.isDisabled}
          variant="subtle"
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          bg="whiteAlpha.50"
          _hover={{ bg: 'whiteAlpha.100' }}
        />
        <AutoCompleteList boxShadow="lg" maxH="240px">
          {lists.map((list) => (
            <AutoCompleteItem key={`list-${list.internal_id}`} value={list} label={list.name}>
              <Flex alignItems="center" gap={2}>
                {list.coverURL && (
                  <Image
                    src={list.coverURL}
                    boxSize="32px"
                    borderRadius="md"
                    objectFit="cover"
                    alt={list.name}
                  />
                )}
                <Text fontSize={{ base: 'sm', md: 'md' }}>{list.name}</Text>
              </Flex>
            </AutoCompleteItem>
          ))}
        </AutoCompleteList>
      </AutoComplete>
      {hasQuery && !isLoading && lists.length === 0 && (
        <Text fontSize="xs" color="gray.400" mt={1}>
          {t('ItemPage.no-lists-found')}
        </Text>
      )}
    </>
  );
};

export default OfficialListSelect;
