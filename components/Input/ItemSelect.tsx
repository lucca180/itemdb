import React, { useEffect } from 'react';
import {
  AutoComplete,
  AutoCompleteCreatable,
  AutoCompleteInput,
  AutoCompleteItem,
  AutoCompleteList,
  Item,
} from '@choc-ui/chakra-autocomplete';
import axios from 'axios';
import { ItemData, SearchFilters, SearchResults } from '../../types';
import { Flex, Image } from '@chakra-ui/react';
import { ItemCardBadge } from '../Items/ItemCard';
import { useTranslations } from 'next-intl';

type Props = {
  color?: string;
  isDisabled?: boolean;
  placeholder?: string;
  onChange?: (item: ItemData) => void;
  searchFilter?: Partial<SearchFilters>;
  creatable?: boolean;
  limit?: number;
};

const ItemSelect = (props: Props) => {
  const t = useTranslations();
  const [query, setQuery] = React.useState('');
  const { onChange, color, creatable, limit } = props;
  const [items, setItems] = React.useState<ItemData[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  useEffect(() => {
    if (!query) return;
    setIsLoading(true);

    const timer = setTimeout(() => loadItems(), 300);

    return () => clearTimeout(timer);
  }, [query]);

  const loadItems = async () => {
    const res = await axios.get('/api/v1/search', {
      params: {
        ...props.searchFilter,
        limit: limit || 5,
        skipStats: true,
        s: query,
        sortBy: 'match',
      },
    });
    const data = res.data as SearchResults;
    setItems(data.content);
    setIsLoading(false);
  };

  const onSelectOption = ({ item }: { item: Item }) => {
    onChange?.(item.originalValue ?? item.value);
    setQuery('');
  };

  return (
    <AutoComplete
      rollNavigation
      onSelectOption={onSelectOption}
      isLoading={isLoading}
      disableFilter
      creatable={creatable}
    >
      <AutoCompleteInput
        placeholder={props.placeholder ?? 'Add Item'}
        isDisabled={props.isDisabled}
        variant="filled"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        color={color}
        bg="whiteAlpha.50"
        textTransform="capitalize"
        _hover={{ bg: 'whiteAlpha.100' }}
      />
      <AutoCompleteList boxShadow={'lg'}>
        {items.map((option) => (
          <AutoCompleteItem
            key={`option-${option.internal_id}`}
            value={option}
            label={option.name}
            textTransform="capitalize"
          >
            <Flex alignItems={'center'}>
              <Image src={option.image} boxSize="40px" mr="2" alt={option.description} />
              <Flex
                flexFlow="column"
                alignItems={'flex-start'}
                justifyContent={'center'}
                textAlign={'left'}
                fontSize={{ base: 'sm', md: 'md' }}
              >
                {option.name}
                <ItemCardBadge item={option} />
              </Flex>
            </Flex>
          </AutoCompleteItem>
        ))}
        {creatable && (
          <AutoCompleteCreatable>
            {({ value }) => <span>{t('ItemPage.add-x', { x: value })}</span>}
          </AutoCompleteCreatable>
        )}
      </AutoCompleteList>
    </AutoComplete>
  );
};

export default ItemSelect;
