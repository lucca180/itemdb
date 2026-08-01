import prisma from '@utils/prisma';
import type { PetColorsCatalog } from '@utils/pet-utils';
import { parsePetStyleFromName, type ParsedPetStyle } from '@utils/petStyles';

export type TarnumStyleData = {
  item_id: number;
  name: string;
  image: string;
  species_id?: number;
};

export type PetStyleSyncResult = {
  stylesUpserted: number;
  stylesSkippedNoItem: number;
  availOpened: number;
  availClosed: number;
  needsReview: number;
};

export type MergedPetStyleFields = {
  species_id: number | null;
  series: string;
  color_id: number | null;
  isPrismatic: boolean;
  prismaticVariant: string | null;
  needsReview: boolean;
};

/** Merge parsed Tarnum fields with an existing row without wiping a known color. */
export function mergePetStyleFields(
  parsed: ParsedPetStyle,
  existing?: { color_id: number | null } | null
): MergedPetStyleFields {
  const species_id = parsed.species_id;
  const color_id = parsed.color_id ?? existing?.color_id ?? null;

  return {
    species_id,
    series: parsed.series,
    color_id,
    isPrismatic: parsed.isPrismatic,
    prismaticVariant: parsed.prismaticVariant,
    needsReview: species_id == null || color_id == null,
  };
}

export function diffStyleAvailability(
  snapshotStyleIds: Iterable<number>,
  activeAvailabilityStyleIds: Iterable<number>
): { toOpen: number[]; toClose: number[] } {
  const snapshot = new Set(snapshotStyleIds);
  const active = new Set(activeAvailabilityStyleIds);

  const toOpen: number[] = [];
  for (const styleId of snapshot) {
    if (!active.has(styleId)) toOpen.push(styleId);
  }

  const toClose: number[] = [];
  for (const styleId of active) {
    if (!snapshot.has(styleId)) toClose.push(styleId);
  }

  return { toOpen, toClose };
}

/**
 * Upsert PetStyle rows for Tarnum available-now styles and open/close availability windows by presence.
 * Skips styles whose Items row is not resolved yet (queued for a later sync).
 */
export async function syncPetStylesFromTarnumSnapshot(
  stylesData: TarnumStyleData[],
  colors: PetColorsCatalog,
  now: Date = new Date()
): Promise<PetStyleSyncResult> {
  const itemIds = stylesData.map((style) => style.item_id);

  const [items, existingStyles, activeAvailabilities] = await Promise.all([
    prisma.items.findMany({
      where: { item_id: { in: itemIds } },
      select: { item_id: true, internal_id: true },
    }),
    prisma.petStyle.findMany({
      where: { item_id: { in: itemIds } },
      select: {
        internal_id: true,
        item_id: true,
        item_iid: true,
        color_id: true,
      },
    }),
    prisma.petStyleAvailability.findMany({
      where: { active: true },
      select: { style_id: true },
    }),
  ]);

  const itemByItemId = new Map(
    items.filter((item) => item.item_id != null).map((item) => [item.item_id!, item])
  );
  const styleByItemId = new Map(existingStyles.map((style) => [style.item_id, style]));

  let stylesUpserted = 0;
  let stylesSkippedNoItem = 0;
  let needsReview = 0;
  const snapshotStyleIds = new Set<number>();

  for (const style of stylesData) {
    const dbItem = itemByItemId.get(style.item_id);
    if (!dbItem) {
      stylesSkippedNoItem += 1;
      // Still count as present so we do not close an existing availability while the item is queued.
      const existingStyle = styleByItemId.get(style.item_id);
      if (existingStyle) snapshotStyleIds.add(existingStyle.internal_id);
      continue;
    }

    const parsed = parsePetStyleFromName(style.name, {
      speciesId: style.species_id ?? null,
      colors,
    });
    const existing = styleByItemId.get(style.item_id) ?? null;
    const fields = mergePetStyleFields(parsed, existing);

    if (fields.needsReview) needsReview += 1;

    const upserted = await prisma.petStyle.upsert({
      where: { item_iid: dbItem.internal_id },
      create: {
        item_iid: dbItem.internal_id,
        item_id: style.item_id,
        ...fields,
      },
      update: {
        item_id: style.item_id,
        ...fields,
      },
      select: { internal_id: true },
    });

    snapshotStyleIds.add(upserted.internal_id);
    stylesUpserted += 1;
  }

  const { toOpen, toClose } = diffStyleAvailability(
    snapshotStyleIds,
    activeAvailabilities.map((row) => row.style_id)
  );

  if (toClose.length > 0) {
    await prisma.petStyleAvailability.updateMany({
      where: {
        style_id: { in: toClose },
        active: true,
      },
      data: {
        active: null,
        availableEnd: now,
      },
    });
  }

  if (toOpen.length > 0) {
    await prisma.petStyleAvailability.createMany({
      data: toOpen.map((style_id) => ({
        style_id,
        availableBegin: now,
        availableEnd: null,
        active: true,
      })),
      skipDuplicates: true,
    });
  }

  return {
    stylesUpserted,
    stylesSkippedNoItem,
    availOpened: toOpen.length,
    availClosed: toClose.length,
    needsReview,
  };
}
