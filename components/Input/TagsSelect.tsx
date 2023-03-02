import React, { useEffect, useCallback } from 'react';
import {
  AutoComplete,
  AutoCompleteInput,
  AutoCompleteItem,
  AutoCompleteList,
  AutoCompleteTag,
  AutoCompleteCreatable,
} from '@choc-ui/chakra-autocomplete';

import axios from 'axios';
import { ItemTag } from '../../types';
import debounce from 'lodash/debounce';

type Props = {
  value: string[];
  type: 'tags' | 'categories';
  onChange: (newVals: string[]) => void;
  disabled?: boolean;
};

const TagSelect = (props: Props) => {
  const { value: valueProps, onChange, type, disabled } = props;
  const [inputVal, setInputVal] = React.useState<string>('');
  const [options, setOptions] = React.useState<string[]>([]);

  useEffect(() => {
    debouncedLoad(inputVal);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setInputVal(value);

    debouncedLoad(value);
  };

  const loadOptions = async (search: string) => {
    const res = await axios.get(`/api/search/tags`, {
      params: {
        s: search,
        type: type === 'categories' ? 'category' : 'tag',
      },
    });

    const data = res.data as ItemTag[];
    const newOptions = data.map((d) => d.name);
    setOptions(newOptions);
  };

  const debouncedLoad = useCallback(debounce(loadOptions, 250), []);

  return (
    <AutoComplete defaultValues={valueProps} multiple onChange={(vals) => onChange(vals)} creatable>
      <AutoCompleteInput
        variant="filled"
        value={inputVal}
        onChange={onInputChange}
        bg="whiteAlpha.50"
        _hover={{ bg: 'whiteAlpha.100' }}
        disabled={disabled}
      >
        {({ tags }) =>
          tags.map((tag, tid) => (
            <AutoCompleteTag key={tid} label={tag.label} onRemove={tag.onRemove} />
          ))
        }
      </AutoCompleteInput>
      <AutoCompleteList>
        {options.map((option, oid) => (
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

        {!options.filter((x) => x.toLowerCase() === inputVal.toLowerCase()).length &&
          inputVal.length >= 3 && (
            <AutoCompleteCreatable>
              {({ value }) => (
                <span>
                  Create <b>{value}</b> {type === 'tags' ? 'tag' : 'category'}
                </span>
              )}
            </AutoCompleteCreatable>
          )}
      </AutoCompleteList>
    </AutoComplete>
  );
};

export default TagSelect;
