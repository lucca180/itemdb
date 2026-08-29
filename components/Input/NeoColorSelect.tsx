import React, { useEffect, useMemo, useState } from 'react';
import {
  AutoComplete,
  AutoCompleteInput,
  AutoCompleteItem,
  AutoCompleteList,
  AutoCompleteTag,
} from '@choc-ui/chakra-autocomplete';
import axios from 'axios';

type Props = {
  value?: string;
  onChange?: (newVals: string) => void;
  disabled?: boolean;
  placeHolder?: string;
  isMultiple?: boolean;
  isPetpet?: boolean;
  /** Preloaded color names; when omitted, loaded from API */
  colors?: string[];
};

const NeoColorSelect = (props: Props) => {
  const {
    value: valueProps,
    onChange,
    disabled,
    placeHolder,
    isMultiple,
    isPetpet,
    colors,
  } = props;

  const [fetchedColors, setFetchedColors] = useState<string[]>([]);

  useEffect(() => {
    if (colors) return;

    let cancelled = false;
    const url = isPetpet ? '/api/petpet-catalog' : '/api/pet-colors';

    axios
      .get<{ colors?: Record<string, string> }>(url)
      .then((res) => {
        if (cancelled || !res.data.colors) return;
        setFetchedColors(Object.values(res.data.colors).sort());
      })
      .catch(() => {
        if (!cancelled) setFetchedColors([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isPetpet, colors]);

  const allColorsSorted = useMemo(() => {
    if (colors) return [...colors].sort();
    return fetchedColors;
  }, [colors, fetchedColors]);

  return (
    <AutoComplete
      defaultValues={Array.isArray(valueProps) ? valueProps : [valueProps]}
      value={valueProps}
      rollNavigation
      multiple={isMultiple}
      onChange={(vals: string[] | string) =>
        onChange?.(Array.isArray(vals) ? (vals[0] ?? '') : vals)
      }
    >
      <AutoCompleteInput variant="subtle" placeholder={placeHolder} disabled={disabled}>
        {({ tags }: { tags: { label: string; onRemove: () => void }[] }) =>
          tags.map((tag: { label: string; onRemove: () => void }, tid: number) => (
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
