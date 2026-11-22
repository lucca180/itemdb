import { describe, expect, test } from 'vitest';
import {
  findHiddenSpeciesNeoIds,
  mergeHiddenSpeciesCombos,
  planCatalogSync,
  planLinkSync,
  type LinkSyncInput,
  type PetpetLinkRow,
  type PuddleSnapshot,
} from '@utils/petpet-sync';
import {
  petpetCatalogToNameRecord,
  petpetNameRecordToEntries,
  suggestPetpetFromItemName,
  type PetpetCatalogEntry,
} from '@utils/petpet-catalog-match';

const img = (file: string) => `https://images.neopets.com/items/${file}.gif`;

function entry(map_id: number, name: string, neo_id: number | null = map_id): PetpetCatalogEntry {
  return { internal_id: map_id + 10000, neo_id, map_id, name };
}

describe('planCatalogSync', () => {
  test('matches on neo_id and only reports name differences', () => {
    const plan = planCatalogSync(
      [entry(1, 'Acko'), entry(2, 'Airax')],
      [
        { id: 1, name: 'Acko' },
        { id: 2, name: 'Airax Renamed' },
      ]
    );
    expect(plan.create).toEqual([]);
    expect(plan.nameMismatch).toEqual([{ neo_id: 2, ours: 'Airax', puddle: 'Airax Renamed' }]);
  });

  test('never assumes neo_id = map_id for existing rows', () => {
    // neo 5 is stored under map_id 1050 → not "new", no create.
    const plan = planCatalogSync([entry(1050, 'Kora', 5)], [{ id: 5, name: 'Kora' }]);
    expect(plan.create).toEqual([]);
    expect(plan.setNeoId).toEqual([]);
  });

  test('fills neo_id on a neo_id-less row with the same name', () => {
    const memow = entry(1118, 'Memow', null);
    const plan = planCatalogSync([memow], [{ id: 399, name: 'memow' }]);
    expect(plan.setNeoId).toEqual([{ internal_id: memow.internal_id, neo_id: 399, name: 'Memow' }]);
    expect(plan.create).toEqual([]);
  });

  test('creates with map_id = Neopets id when free, reports when taken', () => {
    const plan = planCatalogSync(
      [entry(1, 'Acko'), entry(1001, 'Chatter', null)],
      [
        { id: 401, name: 'Geodite' },
        { id: 1001, name: 'Wickid' },
      ]
    );
    expect(plan.create).toEqual([{ neo_id: 401, map_id: 401, name: 'Geodite' }]);
    expect(plan.mapIdTaken).toEqual([{ neo_id: 1001, name: 'Wickid' }]);
  });

  test('reports a new id whose name already belongs to another neo_id', () => {
    const plan = planCatalogSync(
      [entry(51, 'Chocolate')],
      [
        { id: 51, name: 'Chocolate' },
        { id: 60, name: 'Chocolate' },
      ]
    );
    expect(plan.create).toEqual([]);
    expect(plan.nameTaken).toEqual([{ neo_id: 60, name: 'Chocolate' }]);
  });
});

describe('planLinkSync', () => {
  // Pepito: neo 207 → map 207. Colors: Blue 2, Red 31, Darigan 9, Chocolate 51 (no brush).
  const species = [entry(207, 'Pepito'), entry(1050, 'Kora', null)];
  const colors = [entry(2, 'Blue'), entry(9, 'Darigan'), entry(31, 'Red'), entry(51, 'Chocolate')];

  const puddle: PuddleSnapshot = {
    speciesList: [{ id: 207, name: 'Pepito', image: img('isl_petpet4') }],
    colors: [
      { id: 2, name: 'Blue' },
      { id: 9, name: 'Darigan' },
      { id: 51, name: 'Chocolate' },
    ],
    colorsBySpecies: {
      '207': [
        { colorId: 2, colorName: 'Blue', image: img('isl_petpet4') },
        { colorId: 9, colorName: 'Darigan', image: img('pepito_darigan') },
        { colorId: 51, colorName: 'Chocolate', image: img('pepito_chocolate') },
      ],
    },
  };

  const item = (internal_id: number, name: string, image_id: string | null) => ({
    internal_id,
    name,
    slug: name.toLowerCase().replace(/ /g, '-'),
    image_id,
  });

  const link = (overrides: Partial<PetpetLinkRow> & { item_iid: number }): PetpetLinkRow => ({
    petpet_id: 207,
    color_id: 2,
    isUnpaintable: false,
    isCanonical: null,
    ...overrides,
  });

  const base = (overrides: Partial<LinkSyncInput> = {}): LinkSyncInput => ({
    puddle,
    species,
    colors,
    links: [],
    items: [],
    brushColorIds: new Set([2, 9, 31]),
    ...overrides,
  });

  test('creates links for unlinked items; canonical = species image; paintable needs a brush', () => {
    const plan = planLinkSync(
      base({
        items: [
          item(1, 'Pepito', 'isl_petpet4'),
          item(2, 'Darigan Pepito', 'PEPITO_DARIGAN'),
          item(3, 'Chocolate Pepito', 'pepito_chocolate'),
        ],
      })
    );

    expect(
      plan.create.map(({ item_iid, petpet_id, color_id, isUnpaintable, isCanonical }) => ({
        item_iid,
        petpet_id,
        color_id,
        isUnpaintable,
        isCanonical,
      }))
    ).toEqual([
      { item_iid: 1, petpet_id: 207, color_id: 2, isUnpaintable: false, isCanonical: true },
      { item_iid: 2, petpet_id: 207, color_id: 9, isUnpaintable: false, isCanonical: null },
      { item_iid: 3, petpet_id: 207, color_id: 51, isUnpaintable: true, isCanonical: null },
    ]);
  });

  test('does not add a second canonical for a species that already has one', () => {
    const plan = planLinkSync(
      base({
        items: [item(1, 'Pepito', 'isl_petpet4')],
        links: [link({ item_iid: 99, color_id: 31, isCanonical: true, isUnpaintable: true })],
      })
    );
    expect(plan.create[0].isCanonical).toBeNull();
  });

  test('marks unpaintable links paintable when in Puddle with a brush', () => {
    const plan = planLinkSync(
      base({
        items: [
          item(2, 'Darigan Pepito', 'pepito_darigan'),
          item(3, 'Chocolate Pepito', 'pepito_chocolate'),
        ],
        links: [
          link({ item_iid: 2, color_id: 9, isUnpaintable: true }),
          link({ item_iid: 3, color_id: 51, isUnpaintable: true }),
        ],
      })
    );
    expect(plan.markPaintable.map((l) => l.item_iid)).toEqual([2]);
    expect(plan.create).toEqual([]);
  });

  test('reports wrong links and taken combos', () => {
    const plan = planLinkSync(
      base({
        items: [
          item(2, 'Darigan Pepito', 'pepito_darigan'),
          item(3, 'Chocolate Pepito', 'pepito_chocolate'),
        ],
        links: [
          // linked with the wrong color
          link({ item_iid: 2, color_id: 31, isUnpaintable: true }),
          // Chocolate combo already on another item
          link({ item_iid: 50, color_id: 51, isUnpaintable: true }),
        ],
      })
    );

    expect(plan.report.wrongLink).toEqual([
      expect.objectContaining({ item_iid: 2, ours: [207, 31], puddle: [207, 9] }),
    ]);
    expect(plan.report.comboTaken).toEqual([
      expect.objectContaining({ item_iid: 3, petpet_id: 207, color_id: 51, takenBy: 50 }),
    ]);
    expect(plan.create).toEqual([]);
  });

  test('reports a paintable link whose combo is not in the Puddle', () => {
    const plan = planLinkSync(
      base({
        links: [link({ item_iid: 4, color_id: 31 })],
        items: [item(4, 'Red Pepito', 'pepito_red')],
      })
    );
    expect(plan.report.paintableAgainstRule).toEqual([
      expect.objectContaining({ item_iid: 4, inPuddle: false, hasBrush: true }),
    ]);
    expect(plan.markPaintable).toEqual([]);
  });

  test('skips images with no item or several items, and unmapped combos', () => {
    const plan = planLinkSync(
      base({
        colors: colors.filter((c) => c.map_id !== 51),
        items: [
          item(5, 'Darigan Pepito', 'pepito_darigan'),
          item(6, 'Darigan Pepito', 'pepito_darigan'),
        ],
      })
    );
    expect(plan.report.noItem).toEqual([
      { species: 'Pepito', color: 'Blue', image: 'isl_petpet4' },
    ]);
    expect(plan.report.multipleItems).toEqual([
      expect.objectContaining({ image: 'pepito_darigan' }),
    ]);
    expect(plan.report.unmappedCombos).toEqual([
      { speciesNeoId: 207, colorNeoId: 51, image: 'pepito_chocolate' },
    ]);
    expect(plan.create).toEqual([]);
  });
});

describe('suggestPetpetFromItemName', () => {
  const speciesRecord = petpetCatalogToNameRecord([
    entry(207, 'Pepito'),
    entry(18, 'Baby Space Fungus'),
    entry(211, 'Pinceron'),
    entry(297, 'Ultra Pinceron'),
    entry(1050, 'Kora', null),
  ]);
  const colorRecord = petpetCatalogToNameRecord([
    entry(2, 'Blue'),
    entry(17, 'Glow'),
    entry(29, 'Purple'),
    entry(31, 'Red'),
    entry(2001, 'Birthday', null),
  ]);
  const suggest = (name: string) =>
    suggestPetpetFromItemName(
      name,
      petpetNameRecordToEntries(speciesRecord),
      petpetNameRecordToEntries(colorRecord)
    );

  test('splits species and color', () => {
    expect(suggest('Red Pepito')).toEqual({ species: 'Pepito', color: 'Red' });
    expect(suggest('Purple Baby Space Fungus')).toEqual({
      species: 'Baby Space Fungus',
      color: 'Purple',
    });
    expect(suggest('Birthday Kora')).toEqual({ species: 'Kora', color: 'Birthday' });
  });

  test('prefers the longest species and keeps Glowing → Glow', () => {
    expect(suggest('Ultra Pinceron')).toEqual({ species: 'Ultra Pinceron', color: null });
    expect(suggest('Glowing Pepito')).toEqual({ species: 'Pepito', color: 'Glow' });
  });

  test('returns nulls when nothing in the name matches', () => {
    expect(suggest('Pepito')).toEqual({ species: 'Pepito', color: null });
    expect(suggest('Geodite')).toEqual({ species: null, color: null });
    // sentinel names in the species record are never suggested as species
    expect(suggest('No Color').species).toBeNull();
  });
});

describe('hidden species', () => {
  const puddle: PuddleSnapshot = {
    speciesList: [{ id: 207, name: 'Pepito', image: img('isl_petpet4') }],
    colors: [{ id: 47, name: 'Woodland' }],
    colorsBySpecies: { '207': [{ colorId: 2, colorName: 'Blue', image: img('isl_petpet4') }] },
  };

  test('lists catalog species with a neo_id that the Puddle leaves out', () => {
    const species = [entry(207, 'Pepito'), entry(355, 'Tentacle'), entry(1050, 'Kora', null)];
    expect(findHiddenSpeciesNeoIds(species, puddle)).toEqual([355]);
  });

  test('merges their colors as combos and keeps them out of speciesList', () => {
    const merged = mergeHiddenSpeciesCombos(puddle, {
      355: [{ id: 47, name: 'Woodland', image: img('tentacle_woodland') }],
    });
    expect(merged.colorsBySpecies['355']).toEqual([
      { colorId: 47, colorName: 'Woodland', image: img('tentacle_woodland') },
    ]);
    expect(merged.colorsBySpecies['207']).toEqual(puddle.colorsBySpecies['207']);
    expect(merged.speciesList).toBe(puddle.speciesList);
    expect(puddle.colorsBySpecies['355']).toBeUndefined();
  });
});
