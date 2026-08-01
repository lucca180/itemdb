import prisma from '@utils/prisma';
import { getManyItems } from '@pages/api/v1/items/many';
import type { ItemData } from '@types';

/** Item-name spellings that differ from PetColor catalog names. */
const PB_COLOR_NAME_ALIASES: Record<string, string[]> = {
  royalboy: ['Royal Boy', 'Royalboy'],
  royalgirl: ['Royal Girl', 'Royalgirl'],
  elderlyboy: ['Elderly Boy', 'Elderly Male', 'ElderlyBoy'],
  elderlygirl: ['Elderly Girl', 'Elderly Female', 'Elderlygirl'],
};

/** Species spellings that differ between catalog and item names. */
const PB_SPECIES_NAME_ALIASES: Record<string, string[]> = {
  jubjub: ['JubJub', 'Jubjub'],
};

function normalizeKey(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function uniqueAliases(primary: string, extras?: string[]): string[] {
  const list = [primary, ...(extras ?? [])];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of list) {
    const key = entry.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }
  return out;
}

function buildNamePattern(aliases: string[]): string {
  return aliases.map(escapeRegExp).join('|');
}

/** Display / REGEXP aliases for matching PB wearable colour names. */
export function getPbColorNameAliases(colorName: string): string[] {
  return uniqueAliases(colorName, PB_COLOR_NAME_ALIASES[normalizeKey(colorName)]);
}

/** Display / REGEXP aliases for matching PB wearable species names. */
export function getPbSpeciesNameAliases(speciesName: string): string[] {
  return uniqueAliases(speciesName, PB_SPECIES_NAME_ALIASES[normalizeKey(speciesName)]);
}

/**
 * Paint Brush (type=`pb`) wearable internal_ids for a colour × species combo.
 * Matching uses item name + WearableData.species_name (no DB FK).
 */
export async function getComboPbOutfitIds(
  colorName: string,
  speciesName: string
): Promise<number[]> {
  if (!colorName || !speciesName) return [];

  const colorPattern = buildNamePattern(getPbColorNameAliases(colorName));
  const speciesPattern = buildNamePattern(getPbSpeciesNameAliases(speciesName));
  const speciesLower = speciesName.toLowerCase();

  const bySpeciesName = (await prisma.$queryRaw`
    SELECT w.item_iid
    FROM wearabledata w
    JOIN items i ON w.item_iid = i.internal_id
    WHERE i.type = 'pb'
      AND i.internal_id > 0
      AND LOWER(w.species_name) = ${speciesLower}
      AND i.name REGEXP ${`\\b(${colorPattern})(\\b|\\s)`}
      AND i.name REGEXP ${`\\b(${speciesPattern})(\\b|\\s)`}
    GROUP BY w.item_iid
  `) as { item_iid: number }[];

  // Some PB rows lack WearableData.species_name — also match by item name and union both sets.
  const byItemName = (await prisma.$queryRaw`
    SELECT i.internal_id AS item_iid
    FROM items i
    WHERE i.type = 'pb'
      AND i.isWearable = 1
      AND i.internal_id > 0
      AND i.name REGEXP ${`\\b(${colorPattern})(\\b|\\s)`}
      AND i.name REGEXP ${`\\b(${speciesPattern})(\\b|\\s)`}
  `) as { item_iid: number }[];

  return [...new Set([...bySpeciesName, ...byItemName].map((row) => row.item_iid))];
}

/**
 * PB outfit items hydrated via v1 many API (Pages / legacy callers).
 * App Router rainbow-pool should use `getComboPbOutfitIds` + ItemService instead.
 */
export async function getComboPbOutfit(
  colorName: string,
  speciesName: string
): Promise<ItemData[]> {
  const ids = await getComboPbOutfitIds(colorName, speciesName);
  if (!ids.length) return [];

  const itemData = await getManyItems({
    id: ids.map((id) => id.toString()),
  });

  return Object.values(itemData).sort((a, b) => a.name.localeCompare(b.name));
}

export { buildOutfitPreviewUrl as buildPbOutfitPreviewUrl } from '@utils/outfitPreviewUrl';
