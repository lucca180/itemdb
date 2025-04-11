import React from 'react';
import {
  AutoComplete,
  AutoCompleteInput,
  AutoCompleteItem,
  AutoCompleteList,
  AutoCompleteTag,
} from '@choc-ui/chakra-autocomplete';
import { allSpecies, petpetSpecies } from '../../utils/pet-utils';

type Props = {
  value?: string[] | string;
  onChange?: (newVals: string[] | string) => void;
  disabled?: boolean;
  placeHolder?: string;
  isMultiple?: boolean;
  isPetpet?: boolean;
};

const SpeciesSelect = (props: Props) => {
  const { value: valueProps, onChange, disabled, placeHolder, isMultiple, isPetpet } = props;

  const data = isPetpet ? Object.values(petpetSpecies) : Object.values(allSpecies);

  return (
    <AutoComplete
      defaultValues={
        valueProps ? (Array.isArray(valueProps) ? valueProps : [valueProps]) : undefined
      }
      value={valueProps}
      rollNavigation
      multiple={isMultiple}
      onChange={(vals) => onChange?.(vals)}
    >
      <AutoCompleteInput variant="filled" placeholder={placeHolder} disabled={disabled}>
        {({ tags }) =>
          tags.map((tag, tid) => (
            <AutoCompleteTag key={tid} label={tag.label} onRemove={tag.onRemove} />
          ))
        }
      </AutoCompleteInput>
      <AutoCompleteList>
        {data.map((option, oid) => (
          <AutoCompleteItem
            key={`option-${oid}`}
            value={option}
            label={option}
            textTransform="capitalize"
            _selected={{ bg: 'whiteAlpha.50' }}
            _focus={{ bg: 'whiteAlpha.100' }}
          >
            {option}
          </AutoCompleteItem>
        ))}
      </AutoCompleteList>
    </AutoComplete>
  );
};

export default SpeciesSelect;
