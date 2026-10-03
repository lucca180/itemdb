import { describe, expect, test } from 'vitest';
import type { DTICanonicalAppearance, DTILayer, DTIPetAppearance } from '@types';
import { pickPetAppearance, resolveItemAppearanceConflicts } from '@utils/item/impress';

const layer = (id: string, zoneId: string): DTILayer =>
  ({
    id,
    bodyId: '0',
    imageUrlV2: `https://example.com/${id}.png`,
    remoteId: id,
    zone: {
      id: zoneId,
      depth: Number(zoneId),
      label: `Zone ${zoneId}`,
    },
  }) as DTILayer;

const appearance = (
  id: string,
  occupiedZoneIds: string[],
  restrictedZoneIds: string[] = []
): DTICanonicalAppearance =>
  ({
    id,
    layers: occupiedZoneIds.map((zoneId) => layer(`${id}-${zoneId}`, zoneId)),
    restrictedZones: restrictedZoneIds.map((zoneId) => ({
      id: zoneId,
      depth: Number(zoneId),
      label: `Zone ${zoneId}`,
    })),
  }) as DTICanonicalAppearance;

describe('resolveItemAppearanceConflicts', () => {
  test('keeps items that use independent zones', () => {
    const first = appearance('first', ['1']);
    const second = appearance('second', ['2']);

    expect(resolveItemAppearanceConflicts([first, second])).toEqual([first, second]);
  });

  test('keeps the later item when both occupy the same zone', () => {
    const first = appearance('first', ['1']);
    const second = appearance('second', ['1']);

    expect(resolveItemAppearanceConflicts([first, second])).toEqual([second]);
  });

  test('keeps the later item when it restricts a zone occupied by an earlier item', () => {
    const first = appearance('first', ['1']);
    const second = appearance('second', ['2'], ['1']);

    expect(resolveItemAppearanceConflicts([first, second])).toEqual([second]);
  });

  test('keeps the later item when an earlier item restricts one of its zones', () => {
    const first = appearance('first', ['1'], ['2']);
    const second = appearance('second', ['2']);

    expect(resolveItemAppearanceConflicts([first, second])).toEqual([second]);
  });
});

const petAppearance = (id: string, pose: string, isGlitched = false): DTIPetAppearance =>
  ({
    id,
    pose,
    isGlitched,
    bodyId: '106',
    layers: [],
    restrictedZones: [],
  }) as unknown as DTIPetAppearance;

describe('pickPetAppearance', () => {
  test('skips glitched appearances in favor of a clean one with the same pose', () => {
    const glitched = petAppearance('glitched', 'HAPPY_MASC', true);
    const clean = petAppearance('clean', 'HAPPY_MASC');
    const other = petAppearance('other', 'HAPPY_FEM');

    expect(pickPetAppearance([glitched, other, clean], 'HAPPY_MASC')).toBe(clean);
  });

  test('falls back to a clean happy pose when the preferred pose is missing', () => {
    const glitched = petAppearance('glitched', 'SAD_MASC', true);
    const sad = petAppearance('sad', 'SAD_FEM');
    const happy = petAppearance('happy', 'HAPPY_FEM');

    expect(pickPetAppearance([glitched, sad, happy], 'SAD_MASC')).toBe(happy);
  });

  test('ignores unknown and unconverted poses when looking for a clean fallback', () => {
    const unknown = petAppearance('unknown', 'UNKNOWN');
    const sad = petAppearance('sad', 'SAD_FEM');

    expect(pickPetAppearance([unknown, sad])).toBe(sad);
  });

  test('returns a glitched happy appearance only when nothing else is available', () => {
    const glitched = petAppearance('glitched', 'HAPPY_MASC', true);

    expect(pickPetAppearance([glitched])).toBe(glitched);
    expect(pickPetAppearance([])).toBeNull();
  });
});
