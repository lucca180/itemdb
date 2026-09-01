import { describe, expect, test } from 'vitest';
import {
  isPbWearableItem,
  parsePbOutfitComboCandidates,
  selectUniquePbOutfitCombo,
} from '@utils/pbOutfits';
import type { PetColorsCatalog } from '@utils/pet-utils';

const COLORS: PetColorsCatalog = {
  '26': 'Faerie',
  '54': 'Pirate',
  '63': 'Royalboy',
  '98': 'Elderlygirl',
  '103': 'Baby',
  '114': '25th Anniversary',
};

describe('parsePbOutfitComboCandidates', () => {
  test('parses a simple colour and wearable species', () => {
    const candidates = parsePbOutfitComboCandidates(
      'Faerie Acara Wings',
      { canonicalSpecies: 'Acara', speciesNames: ['Acara'] },
      COLORS
    );

    expect(candidates).toContainEqual({
      speciesId: 1,
      speciesName: 'Acara',
      colorId: 26,
      colorName: 'Faerie',
    });
  });

  test('supports Royal Boy and Elderly Female colour aliases', () => {
    const royal = parsePbOutfitComboCandidates(
      'Royal Boy Acara Cape',
      { speciesNames: ['Acara'] },
      COLORS
    );
    const elderly = parsePbOutfitComboCandidates(
      'Elderly Female Aisha Dress',
      { speciesNames: ['Aisha'] },
      COLORS
    );

    expect(royal[0]).toMatchObject({ speciesName: 'Acara', colorName: 'Royalboy' });
    expect(elderly[0]).toMatchObject({ speciesName: 'Aisha', colorName: 'Elderlygirl' });
  });

  test('supports the JubJub species alias', () => {
    const candidates = parsePbOutfitComboCandidates(
      'Faerie Jubjub Shoes',
      { speciesNames: ['JubJub'] },
      COLORS
    );

    expect(candidates[0]).toMatchObject({ speciesId: 21, speciesName: 'JubJub' });
  });

  test('matches multi-word colour names', () => {
    const candidates = parsePbOutfitComboCandidates(
      '25th Anniversary Acara Headband',
      { speciesNames: ['Acara'] },
      COLORS
    );

    expect(candidates[0]).toMatchObject({ colorId: 114, colorName: '25th Anniversary' });
  });

  test('does not match a colour inside another word', () => {
    const candidates = parsePbOutfitComboCandidates(
      'Superbaby Acara Cape',
      { speciesNames: ['Acara'] },
      COLORS
    );

    expect(candidates).toEqual([]);
  });

  test('falls back to a species found in the item name', () => {
    const candidates = parsePbOutfitComboCandidates(
      'Pirate Acara Jacket',
      { speciesNames: [] },
      COLORS
    );

    expect(candidates[0]).toMatchObject({
      speciesId: 1,
      speciesName: 'Acara',
      colorId: 54,
      colorName: 'Pirate',
    });
  });

  test('rejects ambiguous validated matches', () => {
    const candidates = parsePbOutfitComboCandidates(
      'Faerie Pirate Acara Jacket',
      { speciesNames: ['Acara'] },
      COLORS
    );

    expect(candidates).toHaveLength(2);
    expect(selectUniquePbOutfitCombo(candidates)).toBeNull();
  });
});

describe('isPbWearableItem', () => {
  test('only accepts wearable PB items', () => {
    expect(isPbWearableItem({ type: 'pb', isWearable: true })).toBe(true);
    expect(isPbWearableItem({ type: 'pb', isWearable: false })).toBe(false);
    expect(isPbWearableItem({ type: 'np', isWearable: true })).toBe(false);
    expect(isPbWearableItem({ type: 'nc', isWearable: true })).toBe(false);
  });
});
