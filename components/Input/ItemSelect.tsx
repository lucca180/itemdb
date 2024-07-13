import React, { useEffect } from 'react';
import {
  AutoComplete,
  AutoCompleteInput,
  AutoCompleteItem,
  AutoCompleteList,
  Item,
} from '@choc-ui/chakra-autocomplete';
import axios from 'axios';
import { ItemData, SearchResults } from '../../types';
import { Image } from '@chakra-ui/react';

type Props = {
  color?: string;
  isDisabled?: boolean;
  placeholder?: string;
  onChange: (item: ItemData) => void;
};

const ItemSelect = (props: Props) => {
  const [query, setQuery] = React.useState('');
  const { onChange, color } = props;
  const [items, setItems] = React.useState<ItemData[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  useEffect(() => {
    if (!query) return;
    setIsLoading(true);

    const timer = setTimeout(() => loadItems(), 300);

    return () => clearTimeout(timer);
  }, [query]);

  const loadItems = async () => {
    const res = await axios.get('/api/v1/search?s=' + query + '&limit=5' + '&skipStats=true');
    const data = res.data as SearchResults;
    setItems(data.content);
    setIsLoading(false);
  };

  const onSelectOption = ({ item }: { item: Item }) => {
    onChange(item.originalValue as ItemData);
    setQuery('');
  };

  return (
    <AutoComplete
      rollNavigation
      onSelectOption={onSelectOption}
      isLoading={isLoading}
      disableFilter
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
      <AutoCompleteList>
        {items.map((option) => {
          return (
            <AutoCompleteItem
              key={`option-${option.internal_id}`}
              value={option}
              label={option.name}
              textTransform="capitalize"
            >
              <Image src={option.image} boxSize="30px" mr="2" alt={option.description} />
              {option.name}
            </AutoCompleteItem>
          );
        })}
      </AutoCompleteList>
    </AutoComplete>
  );
};

export default ItemSelect;
