'use client';

import { NativeSelect } from '@chakra-ui/react';
import { useRouter } from '@i18n/navigation';
import { allSpecies } from '@utils/pet-utils';
import type { ChangeEvent } from 'react';

type OutfitSpeciesSelectProps = {
  species: string;
  selectSpeciesLabel: string;
};

export function OutfitSpeciesSelect({ species, selectSpeciesLabel }: OutfitSpeciesSelectProps) {
  const router = useRouter();

  const changeSpecies = (selectedSpecies: string) => {
    if (selectedSpecies === '') return;
    router.push(`/hub/outfits/${selectedSpecies.toLowerCase()}`);
  };

  return (
    <NativeSelect.Root mt={3} variant="subtle" minW={175} maxW={200} bg="blackAlpha.400" size="sm">
      <NativeSelect.Field
        onChange={(event: ChangeEvent<HTMLSelectElement>) => changeSpecies(event.target.value)}
        value={species}
      >
        <option value="">{selectSpeciesLabel}</option>
        {Object.values(allSpecies)
          .sort()
          .map((speciesOption) => (
            <option key={speciesOption} value={speciesOption}>
              {speciesOption}
            </option>
          ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  );
}
