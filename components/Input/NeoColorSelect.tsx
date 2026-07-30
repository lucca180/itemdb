import React, { useEffect, useMemo, useState } from 'react';
import {
  AutoComplete,
  AutoCompleteInput,
  AutoCompleteItem,
  AutoCompleteList,
  AutoCompleteTag,
} from '@choc-ui/chakra-autocomplete';
import { petpetColors } from '@utils/pet-utils';

type Props = {
  value?: string;
  onChange?: (newVals: string) => void;
  disabled?: boolean;
  placeHolder?: string;
  isMultiple?: boolean;
  isPetpet?: boolean;
  /** Preloaded Neopet color names; when omitted, fetched from /api/pet-colors */
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
    if (isPetpet || colors) return;

    let cancelled = false;
    fetch('/api/pet-colors')
      .then((res) => res.json())
      .then((data: { colors?: Record<string, string> }) => {
        if (cancelled || !data.colors) return;
        setFetchedColors(Object.values(data.colors).sort());
      })
      .catch(() => {
        if (!cancelled) setFetchedColors([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isPetpet, colors]);

  const allColorsSorted = useMemo(() => {
    if (isPetpet) return Object.values(petpetColors).sort();
    if (colors) return [...colors].sort();
    return fetchedColors;
  }, [isPetpet, colors, fetchedColors]);

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
