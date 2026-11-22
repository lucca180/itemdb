import prisma from '@utils/prisma';
import { getImageId } from '@utils/item/imageId';
import type { PetpetCatalogEntry } from '@utils/petpet-catalog-match';

/**
 * Petpet Puddle sync (Neopets `pool.php` mode=AllPetpets, via Tarnum `/neopets/pool`).
 *
 * - Catalog: Puddle ids are Neopets ids → matched on `neo_id`, never assumed to be `map_id`.
 *   A neo_id-less row with the same name gets the neo_id; a truly new entry gets
 *   `map_id = Neopets id` when that map_id is free, otherwise it is only reported.
 * - Hidden species: catalog species with a neo_id missing from AllPetpets' speciesList are
 *   fetched one by one (`getAllPetpetColors`) and their combos merged in.
 * - Links (PetpetColors): Puddle combo images are item `image_id`s. Unlinked items get a link.
 *   Paintable = combo is in the Puddle AND a petpet paint brush for that color exists
 *   (ItemEffect type `petpetColor`). Links marked unpaintable that the rule says are paintable
 *   are fixed; everything else that disagrees is only reported.
 */

export type PuddleSpecies = { id: number; name: string; image: string };
export type PuddleColor = { id: number; name: string };
export type PuddleCombo = { colorId: number; colorName: string; image: string };

export type PuddleSnapshot = {
  speciesList: PuddleSpecies[];
  colors: PuddleColor[];
  colorsBySpecies: Record<string, PuddleCombo[]>;
};

export function isPuddleSnapshot(data: unknown): data is PuddleSnapshot {
  const d = data as Partial<PuddleSnapshot> | null;
  return (
    !!d &&
    Array.isArray(d.speciesList) &&
    d.speciesList.length > 0 &&
    Array.isArray(d.colors) &&
    d.colors.length > 0 &&
    !!d.colorsBySpecies &&
    typeof d.colorsBySpecies === 'object'
  );
}

// ------- Hidden species ------- //

/** `getAllPetpetColors` (f_species_id) item: a color of one species. */
export type PuddleSpeciesColor = { id: number; name: string; image: string };

export function isSpeciesColorsResponse(
  data: unknown
): data is { success: true; items: PuddleSpeciesColor[] } {
  const d = data as { success?: unknown; items?: unknown } | null;
  return !!d && d.success === true && Array.isArray(d.items);
}

/**
 * Catalog species with a neo_id that AllPetpets leaves out of `speciesList`
 * (e.g. Tentacle 355, Haseepuss 380) — still answered by `getAllPetpetColors`.
 */
export function findHiddenSpeciesNeoIds(
  species: PetpetCatalogEntry[],
  puddle: PuddleSnapshot
): number[] {
  const listed = new Set(puddle.speciesList.map((s) => s.id));
  return species
    .map((s) => s.neo_id)
    .filter((id): id is number => id != null && !listed.has(id))
    .sort((a, b) => a - b);
}

/** Adds hidden species' colors to `colorsBySpecies` (they stay out of `speciesList`). */
export function mergeHiddenSpeciesCombos(
  puddle: PuddleSnapshot,
  hidden: Record<number, PuddleSpeciesColor[]>
): PuddleSnapshot {
  const colorsBySpecies = { ...puddle.colorsBySpecies };
  for (const [neoId, items] of Object.entries(hidden)) {
    if (colorsBySpecies[neoId]) continue;
    colorsBySpecies[neoId] = items.map((c) => ({
      colorId: c.id,
      colorName: c.name,
      image: c.image,
    }));
  }
  return { ...puddle, colorsBySpecies };
}

// ------- Catalog ------- //

export type CatalogSyncPlan = {
  create: { neo_id: number; map_id: number; name: string }[];
  setNeoId: { internal_id: number; neo_id: number; name: string }[];
  /** Reported only: same neo_id, different name. */
  nameMismatch: { neo_id: number; ours: string; puddle: string }[];
  /** Reported only: new entry whose Neopets id is already used as a map_id. */
  mapIdTaken: { neo_id: number; name: string }[];
  /** Reported only: new entry whose name already exists on a row with another neo_id. */
  nameTaken: { neo_id: number; name: string }[];
};

export function planCatalogSync(
  rows: PetpetCatalogEntry[],
  puddle: PuddleColor[]
): CatalogSyncPlan {
  const plan: CatalogSyncPlan = {
    create: [],
    setNeoId: [],
    nameMismatch: [],
    mapIdTaken: [],
    nameTaken: [],
  };

  const byNeoId = new Map(rows.filter((r) => r.neo_id != null).map((r) => [r.neo_id!, r]));
  const usedMapIds = new Set(rows.map((r) => r.map_id));
  const claimedRows = new Set<number>();

  for (const entry of puddle) {
    const existing = byNeoId.get(entry.id);
    if (existing) {
      if (existing.name !== entry.name) {
        plan.nameMismatch.push({ neo_id: entry.id, ours: existing.name, puddle: entry.name });
      }
      continue;
    }

    const sameName = rows.filter((r) => r.name.toLowerCase() === entry.name.toLowerCase());
    const unclaimed = sameName.find((r) => r.neo_id == null && !claimedRows.has(r.internal_id));
    if (unclaimed) {
      claimedRows.add(unclaimed.internal_id);
      plan.setNeoId.push({
        internal_id: unclaimed.internal_id,
        neo_id: entry.id,
        name: unclaimed.name,
      });
      continue;
    }

    if (sameName.length > 0) {
      plan.nameTaken.push({ neo_id: entry.id, name: entry.name });
      continue;
    }

    if (usedMapIds.has(entry.id)) {
      plan.mapIdTaken.push({ neo_id: entry.id, name: entry.name });
      continue;
    }

    usedMapIds.add(entry.id);
    plan.create.push({ neo_id: entry.id, map_id: entry.id, name: entry.name });
  }

  return plan;
}

// ------- Links ------- //

export type PetpetLinkRow = {
  item_iid: number;
  petpet_id: number;
  color_id: number;
  isUnpaintable: boolean;
  isCanonical: boolean | null;
};

export type PetpetSyncItem = {
  internal_id: number;
  name: string;
  slug: string | null;
  image_id: string | null;
};

export type LinkSyncInput = {
  puddle: PuddleSnapshot;
  species: PetpetCatalogEntry[];
  colors: PetpetCatalogEntry[];
  links: PetpetLinkRow[];
  /** Items whose image_id is one of the Puddle combo images. */
  items: PetpetSyncItem[];
  /** Color map_ids that have at least one petpet paint brush (ItemEffect petpetColor). */
  brushColorIds: Set<number>;
};

type ItemRef = { item_iid: number; name: string; slug: string | null };

export type LinkSyncPlan = {
  create: (PetpetLinkRow & { name: string; slug: string | null })[];
  /** Links marked unpaintable that the rule says are paintable → set isUnpaintable = false. */
  markPaintable: ItemRef[];
  report: {
    /** Puddle combos whose species/color has no catalog row with that neo_id. */
    unmappedCombos: { speciesNeoId: number; colorNeoId: number; image: string }[];
    noItem: { species: string; color: string; image: string }[];
    multipleItems: { image: string; items: ItemRef[] }[];
    /** Item linked to a different species/color than the Puddle says. */
    wrongLink: (ItemRef & { ours: [number, number]; puddle: [number, number] })[];
    /** Unlinked item whose species/color is already linked to another item. */
    comboTaken: (ItemRef & { petpet_id: number; color_id: number; takenBy: number })[];
    /** Links marked paintable that the rule says are unpaintable. */
    paintableAgainstRule: (ItemRef & { inPuddle: boolean; hasBrush: boolean })[];
  };
};

const comboKey = (petpetId: number, colorId: number) => `${petpetId}:${colorId}`;

export function puddleImageId(url: string): string {
  return (getImageId(url) ?? url).toLowerCase();
}

export function planLinkSync(input: LinkSyncInput): LinkSyncPlan {
  const { puddle, species, colors, links, items, brushColorIds } = input;

  const speciesMapId = new Map(species.filter((r) => r.neo_id != null).map((r) => [r.neo_id!, r]));
  const colorMapId = new Map(colors.filter((r) => r.neo_id != null).map((r) => [r.neo_id!, r]));

  const itemsByImage = new Map<string, PetpetSyncItem[]>();
  for (const item of items) {
    if (!item.image_id) continue;
    const key = item.image_id.toLowerCase();
    itemsByImage.set(key, [...(itemsByImage.get(key) ?? []), item]);
  }
  const itemById = new Map(items.map((i) => [i.internal_id, i]));
  const ref = (iid: number, fallback?: PetpetSyncItem): ItemRef => {
    const item = itemById.get(iid) ?? fallback;
    return { item_iid: iid, name: item?.name ?? `#${iid}`, slug: item?.slug ?? null };
  };

  const linkByItem = new Map(links.map((l) => [l.item_iid, l]));
  const linkByCombo = new Map(links.map((l) => [comboKey(l.petpet_id, l.color_id), l]));
  const canonicalSpecies = new Set(links.filter((l) => l.isCanonical).map((l) => l.petpet_id));

  const plan: LinkSyncPlan = {
    create: [],
    markPaintable: [],
    report: {
      unmappedCombos: [],
      noItem: [],
      multipleItems: [],
      wrongLink: [],
      comboTaken: [],
      paintableAgainstRule: [],
    },
  };

  const puddleCombos = new Set<string>();
  const speciesImageByNeoId = new Map(
    puddle.speciesList.map((s) => [s.id, puddleImageId(s.image)])
  );

  for (const [speciesNeoIdRaw, combos] of Object.entries(puddle.colorsBySpecies)) {
    const speciesNeoId = Number(speciesNeoIdRaw);
    const speciesRow = speciesMapId.get(speciesNeoId);

    for (const combo of combos ?? []) {
      const colorRow = colorMapId.get(combo.colorId);
      const image = puddleImageId(combo.image);

      if (!speciesRow || !colorRow) {
        plan.report.unmappedCombos.push({ speciesNeoId, colorNeoId: combo.colorId, image });
        continue;
      }

      const petpet_id = speciesRow.map_id;
      const color_id = colorRow.map_id;
      puddleCombos.add(comboKey(petpet_id, color_id));

      const matches = itemsByImage.get(image) ?? [];
      if (matches.length === 0) {
        plan.report.noItem.push({ species: speciesRow.name, color: colorRow.name, image });
        continue;
      }
      if (matches.length > 1) {
        plan.report.multipleItems.push({
          image,
          items: matches.map((m) => ref(m.internal_id, m)),
        });
        continue;
      }

      const item = matches[0];
      const existing = linkByItem.get(item.internal_id);
      if (existing) {
        if (existing.petpet_id !== petpet_id || existing.color_id !== color_id) {
          plan.report.wrongLink.push({
            ...ref(item.internal_id, item),
            ours: [existing.petpet_id, existing.color_id],
            puddle: [petpet_id, color_id],
          });
        }
        continue;
      }

      const taken = linkByCombo.get(comboKey(petpet_id, color_id));
      if (taken) {
        plan.report.comboTaken.push({
          ...ref(item.internal_id, item),
          petpet_id,
          color_id,
          takenBy: taken.item_iid,
        });
        continue;
      }

      const isCanonical =
        speciesImageByNeoId.get(speciesNeoId) === image && !canonicalSpecies.has(petpet_id);
      if (isCanonical) canonicalSpecies.add(petpet_id);

      const row: PetpetLinkRow = {
        item_iid: item.internal_id,
        petpet_id,
        color_id,
        isUnpaintable: !brushColorIds.has(color_id),
        isCanonical: isCanonical ? true : null,
      };
      linkByItem.set(row.item_iid, row);
      linkByCombo.set(comboKey(petpet_id, color_id), row);
      plan.create.push({ ...row, name: item.name, slug: item.slug });
    }
  }

  for (const link of links) {
    const inPuddle = puddleCombos.has(comboKey(link.petpet_id, link.color_id));
    const hasBrush = brushColorIds.has(link.color_id);
    const paintable = inPuddle && hasBrush;

    if (paintable && link.isUnpaintable) plan.markPaintable.push(ref(link.item_iid));
    if (!paintable && !link.isUnpaintable) {
      plan.report.paintableAgainstRule.push({ ...ref(link.item_iid), inPuddle, hasBrush });
    }
  }

  return plan;
}

// ------- DB reads ------- //

export async function loadLinkSyncInput(
  puddle: PuddleSnapshot
): Promise<Omit<LinkSyncInput, 'puddle'>> {
  const images = [
    ...new Set(
      Object.values(puddle.colorsBySpecies)
        .flat()
        .map((combo) => puddleImageId(combo.image))
    ),
  ];

  const [species, colors, links, brushes, items] = await Promise.all([
    prisma.petpetSpecies.findMany({
      select: { internal_id: true, neo_id: true, map_id: true, name: true },
    }),
    prisma.petpetColorCatalog.findMany({
      select: { internal_id: true, neo_id: true, map_id: true, name: true },
    }),
    prisma.petpetColors.findMany({
      select: {
        item_iid: true,
        petpet_id: true,
        color_id: true,
        isUnpaintable: true,
        isCanonical: true,
      },
    }),
    prisma.itemEffect.findMany({
      where: { type: 'petpetColor', colorTarget: { not: null } },
      select: { colorTarget: true },
      distinct: ['colorTarget'],
    }),
    prisma.items.findMany({
      where: { image_id: { in: images } },
      select: { internal_id: true, name: true, slug: true, image_id: true },
    }),
  ]);

  // Names for linked items outside the Puddle image set (used in reports).
  const knownIds = new Set(items.map((i) => i.internal_id));
  const missingIds = links.map((l) => l.item_iid).filter((iid) => !knownIds.has(iid));
  const linkedItems = missingIds.length
    ? await prisma.items.findMany({
        where: { internal_id: { in: missingIds } },
        select: { internal_id: true, name: true, slug: true, image_id: true },
      })
    : [];

  return {
    species,
    colors,
    links,
    // Linked-only items keep a null image so they never match a Puddle combo by mistake.
    items: [...items, ...linkedItems.map((i) => ({ ...i, image_id: null }))],
    brushColorIds: new Set(brushes.map((b) => b.colorTarget!)),
  };
}
