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
  stylesSkippedExisting: number;
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
  const colorRest = color_id != null ? null : parsed.colorRest;

  return {
    species_id,
    series: parsed.series,
    color_id,
    isPrismatic: parsed.isPrismatic,
    prismaticVariant: parsed.prismaticVariant,
    // Species missing, or colour token present but unresolved (after merge).
    needsReview: species_id == null || (color_id == null && colorRest != null),
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
 * Sync PetStyle rows for Tarnum available-now styles and open/close availability windows.
 * Creates missing rows only — never updates an existing PetStyle entry.
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
        needsReview: true,
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
  let stylesSkippedExisting = 0;
  let stylesSkippedNoItem = 0;
  let needsReview = 0;
  const snapshotStyleIds = new Set<number>();

  for (const style of stylesData) {
    const existing = styleByItemId.get(style.item_id) ?? null;

    // Already in DB — leave the row untouched; still count for availability.
    if (existing) {
      snapshotStyleIds.add(existing.internal_id);
      stylesSkippedExisting += 1;
      if (existing.needsReview) needsReview += 1;
      continue;
    }

    const dbItem = itemByItemId.get(style.item_id);
    if (!dbItem) {
      stylesSkippedNoItem += 1;
      continue;
    }

    const parsed = parsePetStyleFromName(style.name, {
      speciesId: style.species_id ?? null,
      colors,
    });
    const fields = mergePetStyleFields(parsed, null);

    if (fields.needsReview) needsReview += 1;

    const created = await prisma.petStyle.create({
      data: {
        item_iid: dbItem.internal_id,
        item_id: style.item_id,
        ...fields,
      },
      select: { internal_id: true },
    });

    snapshotStyleIds.add(created.internal_id);
    styleByItemId.set(style.item_id, {
      internal_id: created.internal_id,
      item_id: style.item_id,
      item_iid: dbItem.internal_id,
      color_id: fields.color_id,
      needsReview: fields.needsReview,
    });
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
    stylesSkippedExisting,
    stylesSkippedNoItem,
    availOpened: toOpen.length,
    availClosed: toClose.length,
    needsReview,
  };
}
