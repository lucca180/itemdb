import { describe, expect, test } from 'vitest';
import type { DTICanonicalAppearance, DTILayer } from '@types';
import { resolveItemAppearanceConflicts } from '@utils/item/impress';

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
