import prisma from '@utils/prisma';
import { getManyItems } from '@pages/api/v1/items/many';
import type { ItemData } from '@types';
import {
  allSpecies,
  getSpeciesFromString,
  getSpeciesId,
  type PetColorsCatalog,
} from '@utils/pet-utils';

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

function textHasAlias(text: string, alias: string): boolean {
  const normalizedText = text.normalize('NFKC');
  const aliasPattern = alias.normalize('NFKC').trim().split(/\s+/).map(escapeRegExp).join('\\s+');
  if (!aliasPattern) return false;

  // The boundaries must be non-alphanumeric, so "Baby" matches "Baby Acara"
  // but not "Superbaby Acara". Spaces inside multi-word aliases stay flexible.
  return new RegExp(`(^|[^\\p{L}\\p{N}])${aliasPattern}(?=$|[^\\p{L}\\p{N}])`, 'iu').test(
    normalizedText
  );
}

function textHasAnyAlias(text: string, aliases: string[]): boolean {
  return aliases.some((alias) => textHasAlias(text, alias));
}

/** Display / REGEXP aliases for matching PB wearable colour names. */
export function getPbColorNameAliases(colorName: string): string[] {
  return uniqueAliases(colorName, PB_COLOR_NAME_ALIASES[normalizeKey(colorName)]);
}

/** Display / REGEXP aliases for matching PB wearable species names. */
export function getPbSpeciesNameAliases(speciesName: string): string[] {
  return uniqueAliases(speciesName, PB_SPECIES_NAME_ALIASES[normalizeKey(speciesName)]);
}

export type PbOutfitCombo = {
  speciesId: number;
  speciesName: string;
  colorId: number;
  colorName: string;
};

export type PbOutfitWearableSpecies = {
  canonicalSpecies?: string | null;
  speciesNames?: readonly string[];
};

export function isPbWearableItem(item: Pick<ItemData, 'type' | 'isWearable'>): boolean {
  return item.type === 'pb' && item.isWearable;
}

function resolveSpeciesName(value: string): string | null {
  const speciesId = getSpeciesId(value);
  return speciesId ? allSpecies[String(speciesId)] : null;
}

/**
 * Extracts plausible colour × species pairs from a PB item's name and wearable metadata.
 *
 * This parser intentionally does not decide that a pair is correct. Item names are legacy,
 * free-form data and can contain more than one colour/species-looking token. The server loader
 * validates these candidates against both ColorSpecies and the actual PB outfit membership.
 */
export function parsePbOutfitComboCandidates(
  itemName: string,
  wearableSpecies: PbOutfitWearableSpecies,
  colors: PetColorsCatalog
): PbOutfitCombo[] {
  if (!itemName.trim()) return [];

  const speciesCandidates = [
    // Prefer structured wearable data, then preserve the existing item-name fallback.
    wearableSpecies.canonicalSpecies ?? '',
    ...(wearableSpecies.speciesNames ?? []),
    getSpeciesFromString(itemName) ?? '',
  ];
  const uniqueSpecies = new Map<number, string>();

  for (const candidate of speciesCandidates) {
    const speciesName = resolveSpeciesName(candidate);
    // Even structured wearable species must occur in the item name. This avoids assigning a
    // shared/malformed wearable row to a combo that the PB item itself does not describe.
    if (!speciesName || !textHasAnyAlias(itemName, getPbSpeciesNameAliases(speciesName))) continue;

    const speciesId = getSpeciesId(speciesName);
    if (speciesId) uniqueSpecies.set(speciesId, speciesName);
  }

  // Colours have no direct relation on Items/WearableData, so compare the item name against
  // every catalog colour. Longer aliases are evaluated first to keep compound names intact.
  const colorCandidates = Object.entries(colors)
    .map(([id, colorName]) => ({
      colorId: Number(id),
      colorName,
      aliases: getPbColorNameAliases(colorName).sort((a, b) => b.length - a.length),
    }))
    .filter((candidate) => Number.isInteger(candidate.colorId) && candidate.colorId > 0)
    .filter((candidate) => textHasAnyAlias(itemName, candidate.aliases))
    .sort((a, b) => b.aliases[0].length - a.aliases[0].length);

  // Return every plausible pair. Ambiguity is useful here: the loader can validate all pairs
  // and fail closed if more than one survives.
  const candidates: PbOutfitCombo[] = [];
  for (const [speciesId, speciesName] of uniqueSpecies) {
    for (const { colorId, colorName } of colorCandidates) {
      candidates.push({ speciesId, speciesName, colorId, colorName });
    }
  }

  return candidates;
}

export function selectUniquePbOutfitCombo(
  candidates: readonly PbOutfitCombo[]
): PbOutfitCombo | null {
  // Multiple rows may describe the same semantic pair; dedupe those, but reject genuinely
  // conflicting pairs instead of guessing which Rainbow Pool route is correct.
  const uniqueCandidates = new Map(
    candidates.map((candidate) => [`${candidate.speciesId}:${candidate.colorId}`, candidate])
  );
  return uniqueCandidates.size === 1 ? [...uniqueCandidates.values()][0] : null;
}

/**
 * Inverse lookup for a colour × species combo: returns the PB wearable item IDs belonging to it.
 *
 * There is no database FK from a PB wearable to ColorSpecies. The relation is reconstructed from
 * the item name plus WearableData.species_name. Two queries are unioned because some legacy
 * wearable rows have no species_name even though the species is present in the item name.
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

  // Legacy fallback: recover wearable PB rows whose WearableData species field is missing.
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
