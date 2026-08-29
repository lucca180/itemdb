import prisma from '@utils/prisma';

/** Sentinel: unresolved / unknown petpet color (not in catalog). */
export const PETPET_UNKNOWN_COLOR_MAP_ID = 9998;
/** Sentinel: explicit "No Color" (also seeded in catalog). */
export const PETPET_NO_COLOR_MAP_ID = 9999;

const PETPET_COLOR_SENTINEL_NAMES: Record<number, string> = {
  [PETPET_UNKNOWN_COLOR_MAP_ID]: 'Unknown',
  [PETPET_NO_COLOR_MAP_ID]: 'No Color',
};

export type PetpetCatalogEntry = {
  internal_id: number;
  neo_id: number | null;
  map_id: number;
  name: string;
};

/** In-memory indexes for name ↔ map_id lookups (built from fetchAll*). */
export type PetpetCatalogMaps = {
  byMapId: Map<number, PetpetCatalogEntry>;
  /** Lowercased display name → entry (first wins if duplicates). */
  byName: Map<string, PetpetCatalogEntry>;
};

/** Uncached DB read — safe for Pages Router / pages API routes. */
export async function fetchAllPetpetSpecies(): Promise<PetpetCatalogEntry[]> {
  const rows = await prisma.petpetSpecies.findMany({
    select: { internal_id: true, neo_id: true, map_id: true, name: true },
    orderBy: [{ map_id: 'asc' }],
  });
  return rows;
}

/** Uncached DB read — safe for Pages Router / pages API routes. */
export async function fetchAllPetpetColors(): Promise<PetpetCatalogEntry[]> {
  const rows = await prisma.petpetColorCatalog.findMany({
    select: { internal_id: true, neo_id: true, map_id: true, name: true },
    orderBy: [{ map_id: 'asc' }],
  });
  return rows;
}

export function buildPetpetCatalogMaps(entries: PetpetCatalogEntry[]): PetpetCatalogMaps {
  const byMapId = new Map<number, PetpetCatalogEntry>();
  const byName = new Map<string, PetpetCatalogEntry>();

  for (const entry of entries) {
    byMapId.set(entry.map_id, entry);
    const key = entry.name.toLowerCase();
    if (!byName.has(key)) byName.set(key, entry);
  }

  // Ensure sentinels resolve even if not seeded in DB yet.
  for (const [mapId, name] of Object.entries(PETPET_COLOR_SENTINEL_NAMES)) {
    const id = Number(mapId);
    if (!byMapId.has(id)) {
      const sentinel: PetpetCatalogEntry = {
        internal_id: -id,
        neo_id: null,
        map_id: id,
        name,
      };
      byMapId.set(id, sentinel);
      const key = name.toLowerCase();
      if (!byName.has(key)) byName.set(key, sentinel);
    }
  }

  return { byMapId, byName };
}

export async function fetchPetpetSpeciesMaps(): Promise<PetpetCatalogMaps> {
  return buildPetpetCatalogMaps(await fetchAllPetpetSpecies());
}

export async function fetchPetpetColorMaps(): Promise<PetpetCatalogMaps> {
  return buildPetpetCatalogMaps(await fetchAllPetpetColors());
}

export function getPetpetNameByMapId(mapId: number, maps: PetpetCatalogMaps): string | undefined {
  return maps.byMapId.get(mapId)?.name ?? PETPET_COLOR_SENTINEL_NAMES[mapId];
}

export function getPetpetMapIdByName(name: string, maps: PetpetCatalogMaps): number | null {
  if (!name) return null;
  const entry = maps.byName.get(name.toLowerCase());
  return entry?.map_id ?? null;
}

/**
 * Species display name from item name.
 * Multi-word species (e.g. "Baby Space Fungus") must match all tokens — same idea as
 * findPetpetSpeciesMapId. Prefers the longest matching species name.
 */
export function getPetpetSpeciesNameFromItemName(
  itemName: string,
  maps: PetpetCatalogMaps
): string | null {
  if (!itemName) return null;

  const exact = maps.byName.get(itemName.toLowerCase());
  if (exact) return exact.name;

  const tokens = itemName.toLowerCase().split(' ');
  let best: string | null = null;

  for (const entry of maps.byMapId.values()) {
    const speciesWords = entry.name.toLowerCase().split(' ');
    if (!speciesWords.every((word) => tokens.includes(word))) continue;
    if (!best || entry.name.length > best.length) best = entry.name;
  }

  return best;
}

/**
 * Resolve species `map_id` for admin writes (select name or item-name text).
 * Keeps Ultra Pinceron → 297.
 */
export function findPetpetSpeciesMapId(text: string, maps: PetpetCatalogMaps): number | null {
  if (!text) return null;
  if (text.includes('Ultra Pinceron')) return 297;

  const exact = getPetpetMapIdByName(text, maps);
  if (exact != null) return exact;

  const tokens = text.toLowerCase().split(' ');
  for (const entry of maps.byMapId.values()) {
    const speciesArr = entry.name.toLowerCase().split(' ');
    if (speciesArr.every((word) => tokens.includes(word))) return entry.map_id;
  }

  return null;
}

/**
 * Resolve color `map_id` for admin writes (select name or item-name text).
 * Keeps Spoppy II/III, Glowing → Glow (17).
 * Unknown → 9998; explicit "No Color" resolves via catalog/sentinel to 9999.
 */
export function findPetpetColorMapId(text: string, maps: PetpetCatalogMaps): number {
  if (text.includes('Spoppy III')) return 999999;
  if (text.includes('Spoppy II')) return 99999;
  if (text.includes('Glowing')) return 17;

  const exact = getPetpetMapIdByName(text, maps);
  if (exact != null) return exact;

  const tokens = text.toLowerCase().split(' ');
  for (const entry of maps.byMapId.values()) {
    const colorArr = entry.name.toLowerCase().split(' ');
    if (colorArr.every((word) => tokens.includes(word))) return entry.map_id;
  }

  return PETPET_UNKNOWN_COLOR_MAP_ID;
}

/** `map_id` string → name — same shape as PetColorsCatalog for easy injection. */
export function petpetCatalogToNameRecord(entries: PetpetCatalogEntry[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const [id, name] of Object.entries(PETPET_COLOR_SENTINEL_NAMES)) {
    record[id] = name;
  }
  for (const entry of entries) {
    record[String(entry.map_id)] = entry.name;
  }
  return record;
}
