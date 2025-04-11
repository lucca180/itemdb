import React, { useMemo } from 'react';
import {
  AutoComplete,
  AutoCompleteInput,
  AutoCompleteItem,
  AutoCompleteList,
  AutoCompleteTag,
} from '@choc-ui/chakra-autocomplete';
import { allNeopetsColors, petpetColors } from '../../utils/pet-utils';

type Props = {
  value?: string;
  onChange?: (newVals: string) => void;
  disabled?: boolean;
  placeHolder?: string;
  isMultiple?: boolean;
  isPetpet?: boolean;
};

const NeoColorSelect = (props: Props) => {
  const { value: valueProps, onChange, disabled, placeHolder, isMultiple, isPetpet } = props;

  const allColorsSorted = useMemo(
    () => Object.values(!isPetpet ? allNeopetsColors : petpetColors).sort(),
    []
  );

  return (
    <AutoComplete
      defaultValues={Array.isArray(valueProps) ? valueProps : [valueProps]}
      value={valueProps}
      openOnFocus
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
        {allColorsSorted.map((option, oid) => (
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

export default NeoColorSelect;
