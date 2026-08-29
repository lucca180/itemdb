import React, { useEffect, useMemo, useState } from 'react';
import {
  AutoComplete,
  AutoCompleteInput,
  AutoCompleteItem,
  AutoCompleteList,
  AutoCompleteTag,
} from '@choc-ui/chakra-autocomplete';
import axios from 'axios';
import { allSpecies } from '@utils/pet-utils';

type Props = {
  value?: string[] | string;
  onChange?: (newVals: string[] | string) => void;
  disabled?: boolean;
  placeHolder?: string;
  isMultiple?: boolean;
  isPetpet?: boolean;
  /** Preloaded petpet species names; when omitted with isPetpet, loaded from /api/petpet-catalog */
  species?: string[];
};

const SpeciesSelect = (props: Props) => {
  const {
    value: valueProps,
    onChange,
    disabled,
    placeHolder,
    isMultiple,
    isPetpet,
    species,
  } = props;

  const [fetchedSpecies, setFetchedSpecies] = useState<string[]>([]);

  useEffect(() => {
    if (!isPetpet || species) return;

    let cancelled = false;
    axios
      .get<{ species?: Record<string, string> }>('/api/petpet-catalog')
      .then((res) => {
        if (cancelled || !res.data.species) return;
        setFetchedSpecies(Object.values(res.data.species).sort());
      })
      .catch(() => {
        if (!cancelled) setFetchedSpecies([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isPetpet, species]);

  const data = useMemo(() => {
    if (!isPetpet) return Object.values(allSpecies);
    if (species) return [...species].sort();
    return fetchedSpecies;
  }, [isPetpet, species, fetchedSpecies]);

  return (
    <AutoComplete
      defaultValues={
        valueProps ? (Array.isArray(valueProps) ? valueProps : [valueProps]) : undefined
      }
      value={valueProps}
      rollNavigation
      multiple={isMultiple}
      onChange={(vals: string[] | string) => onChange?.(vals)}
    >
      <AutoCompleteInput variant="subtle" placeholder={placeHolder} disabled={disabled}>
        {({ tags }: { tags: { label: string; onRemove: () => void }[] }) =>
          tags.map((tag: { label: string; onRemove: () => void }, tid: number) => (
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
