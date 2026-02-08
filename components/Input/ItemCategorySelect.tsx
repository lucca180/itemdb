import React, { useEffect } from 'react';
import {
  AutoComplete,
  AutoCompleteInput,
  AutoCompleteItem,
  AutoCompleteList,
  Item,
} from '@choc-ui/chakra-autocomplete';
import axios from 'axios';
import { SearchStats } from '../../types';

type Props = {
  value: string;
  name: string;
  color?: string;
  isDisabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const ItemCatSelect = (props: Props) => {
  const { value, onChange, name, color } = props;
  const [options, setOptions] = React.useState<string[]>([]);

  const loadOptions = async () => {
    const res = await axios.get('/api/search/stats');
    const data = res.data as SearchStats;

    setOptions(Object.keys(data.category));
  };

  const onSelectOption = ({ item }: { item: Item }) => {
    onChange({
      target: { name, value: item.value },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOptions();
  }, []);

  return (
    <AutoComplete rollNavigation onSelectOption={onSelectOption}>
      <AutoCompleteInput
        isDisabled={props.isDisabled}
        variant="filled"
        value={value}
        onChange={onChange}
        name={name}
        color={color}
        bg="whiteAlpha.50"
        textTransform="capitalize"
        _hover={{ bg: 'whiteAlpha.100' }}
      />
      <AutoCompleteList>
        {options.map((option, oid) => (
          <AutoCompleteItem
            key={`option-${oid}`}
            value={option}
            label={option}
            textTransform="capitalize"
          >
            {option}
          </AutoCompleteItem>
        ))}
      </AutoCompleteList>
    </AutoComplete>
  );
};

export default ItemCatSelect;
