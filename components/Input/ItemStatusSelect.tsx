import React from 'react';
import {
  AutoComplete,
  AutoCompleteInput,
  AutoCompleteItem,
  AutoCompleteList,
  Item,
} from '@choc-ui/chakra-autocomplete';

type Props = {
  value: string;
  name: string;
  color?: string;
  isDisabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const ItemStatusSelect = (props: Props) => {
  const { value, onChange, name, color } = props;
  const options = ['active', 'unreleased', 'no trade'];

  const onSelectOption = ({ item }: { item: Item }) => {
    onChange({
      target: { name, value: item.value },
    } as React.ChangeEvent<HTMLInputElement>);
  };

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

export default ItemStatusSelect;
