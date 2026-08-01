'use client';

import { Button, HStack, NativeSelect, VisuallyHidden } from '@chakra-ui/react';
import { useRouter } from '@i18n/navigation';
import { useId, useState, type ChangeEvent } from 'react';
import { petColorSlug } from '@utils/pet-utils';

const BASE_PATH = '/tools/rainbow-pool';

type RainbowPoolPickerProps = {
  colors: string[];
  species: string[];
  initialColor?: string;
  initialSpecies?: string;
  selectColorLabel: string;
  selectSpeciesLabel: string;
  searchLabel: string;
};

export function RainbowPoolPicker({
  colors,
  species,
  initialColor = '',
  initialSpecies = '',
  selectColorLabel,
  selectSpeciesLabel,
  searchLabel,
}: RainbowPoolPickerProps) {
  const router = useRouter();
  const [color, setColor] = useState(initialColor);
  const [selectedSpecies, setSelectedSpecies] = useState(initialSpecies);
  const colorSelectId = useId();
  const speciesSelectId = useId();

  const canSearch = Boolean(color || selectedSpecies);

  const go = () => {
    if (selectedSpecies && color) {
      router.push(`${BASE_PATH}/${petColorSlug(selectedSpecies)}/${petColorSlug(color)}`);
      return;
    }
    if (selectedSpecies) {
      router.push(`${BASE_PATH}/${petColorSlug(selectedSpecies)}`);
      return;
    }
    if (color) {
      router.push(`${BASE_PATH}/${petColorSlug(color)}`);
    }
  };

  return (
    <HStack mt={1} flexWrap={{ base: 'wrap', sm: 'nowrap' }} justify="center" gap={2}>
      <VisuallyHidden asChild>
        <label htmlFor={colorSelectId}>{selectColorLabel}</label>
      </VisuallyHidden>
      <NativeSelect.Root size="sm" variant="subtle" minW={150} bg="blackAlpha.400">
        <NativeSelect.Field
          id={colorSelectId}
          value={color}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setColor(e.target.value)}
        >
          <option value="">{selectColorLabel}</option>
          {colors.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>

      <VisuallyHidden asChild>
        <label htmlFor={speciesSelectId}>{selectSpeciesLabel}</label>
      </VisuallyHidden>
      <NativeSelect.Root size="sm" variant="subtle" minW={175} bg="blackAlpha.400">
        <NativeSelect.Field
          id={speciesSelectId}
          value={selectedSpecies}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedSpecies(e.target.value)}
        >
          <option value="">{selectSpeciesLabel}</option>
          {species.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>

      <Button size="sm" bg="blackAlpha.500" disabled={!canSearch} onClick={go}>
        {searchLabel}
      </Button>
    </HStack>
  );
}
