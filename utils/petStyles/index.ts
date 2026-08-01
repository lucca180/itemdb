import { allSpecies, findPetColorId, petColorSlug, type PetColorsCatalog } from '@utils/pet-utils';

export type ParsedPetStyle = {
  species_id: number | null;
  series: string;
  color_id: number | null;
  /** Remainder after series token; used for color resolution / debugging. */
  colorRest: string | null;
  isPrismatic: boolean;
  prismaticVariant: string | null;
  needsReview: boolean;
};

export type ParsePetStyleOptions = {
  /** Species from Tarnum when present. */
  speciesId?: number | null;
  /** PetColor catalog for resolving `colorRest` → `color_id`. */
  colors?: PetColorsCatalog;
};

const UNKNOWN_SERIES = 'Unknown';

/**
 * Style item names sometimes use a short colour label that is not the PetColor name.
 * Keys are slugified (`petColorSlug`).
 */
export const PET_STYLE_COLOR_ALIASES: Record<string, string> = {
  anniversary: '25th Anniversary',
};

/** Parse `Prismatic {variant}: {rest}` — variant may be multi-word (e.g. Cookies & Cream). */
export function parsePrismaticPrefix(value: string): {
  isPrismatic: boolean;
  prismaticVariant: string | null;
  rest: string;
} {
  const trimmed = value.trim();
  const match = trimmed.match(/^Prismatic\s+([^:]+):\s*(.+)$/i);
  if (!match) {
    return { isPrismatic: false, prismaticVariant: null, rest: trimmed };
  }
  return {
    isPrismatic: true,
    prismaticVariant: match[1].trim(),
    rest: match[2].trim(),
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripSpeciesSuffix(name: string, speciesId: number): string {
  const speciesName = allSpecies[String(speciesId)];
  if (!speciesName) return name.trim();

  const re = new RegExp(`\\s*${escapeRegExp(speciesName)}$`, 'i');
  return name.replace(re, '').trim();
}

function resolveColorId(colorRest: string | null, colors?: PetColorsCatalog): number | null {
  if (!colorRest || !colors) return null;
  const direct = findPetColorId(colorRest, colors);
  if (direct != null) return direct;

  const aliasTarget = PET_STYLE_COLOR_ALIASES[petColorSlug(colorRest)];
  if (!aliasTarget) return null;
  return findPetColorId(aliasTarget, colors);
}

function canonicalColorRest(
  colorRest: string | null,
  color_id: number | null,
  colors?: PetColorsCatalog
): string | null {
  if (color_id == null || !colors) return colorRest;
  return colors[String(color_id)] ?? colorRest;
}

/**
 * Peel a known PetColor name from the end of a label.
 * Unlike `splitSeriesAndColor`, does not fall back to first-token series —
 * if no color suffix matches, the whole label is the series.
 */
export function peelKnownColorSuffix(
  label: string,
  colors: PetColorsCatalog
): { series: string; colorRest: string | null; color_id: number | null } {
  const trimmed = label.trim();
  if (!trimmed) {
    return { series: UNKNOWN_SERIES, colorRest: null, color_id: null };
  }

  const entries = Object.entries(colors)
    .map(([id, name]) => ({ id: parseInt(id, 10), name: name.trim() }))
    .filter((entry) => entry.name.length > 0 && !Number.isNaN(entry.id))
    .sort((a, b) => b.name.length - a.name.length || a.name.localeCompare(b.name));

  for (const entry of entries) {
    const re = new RegExp(`^(.*)\\s+${escapeRegExp(entry.name)}$`, 'i');
    const match = trimmed.match(re);
    const series = match?.[1]?.trim();
    if (series) {
      return {
        series,
        colorRest: entry.name,
        color_id: entry.id,
      };
    }
  }

  return { series: trimmed, colorRest: null, color_id: null };
}

/**
 * Split `Habbo Hotel Yellow` into series `Habbo Hotel` + color `Yellow`
 * by matching the longest PetColor name as a suffix.
 */
export function splitSeriesAndColor(
  rest: string,
  colors?: PetColorsCatalog
): { series: string; colorRest: string | null; color_id: number | null } {
  const trimmed = rest.trim();
  if (!trimmed) {
    return { series: UNKNOWN_SERIES, colorRest: null, color_id: null };
  }

  if (colors) {
    const peeled = peelKnownColorSuffix(trimmed, colors);
    if (peeled.color_id != null) {
      return peeled;
    }
  }

  // Fallback when no catalog / no suffix color: first token = series, rest = color candidate.
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const series = parts[0] || UNKNOWN_SERIES;
  const colorRestRaw = parts.length > 1 ? parts.slice(1).join(' ') : null;
  const color_id = resolveColorId(colorRestRaw, colors);
  return {
    series,
    colorRest: canonicalColorRest(colorRestRaw, color_id, colors),
    color_id,
  };
}

/**
 * Best-effort parse of a Styling Studio style item name into series / color / prismatic fields.
 * Incomplete fields are allowed; `needsReview` is set when species or color is missing.
 *
 * Series may be multi-word when a PetColor catalog is provided: the longest color-name
 * suffix is peeled off (e.g. `Habbo Hotel Yellow Acara` → series Habbo Hotel, color Yellow).
 */
export function parsePetStyleFromName(
  name: string,
  options: ParsePetStyleOptions = {}
): ParsedPetStyle {
  const trimmed = (name ?? '').trim();
  const colors = options.colors;
  const species_id =
    options.speciesId === undefined || options.speciesId === null ? null : options.speciesId;

  if (!trimmed) {
    return {
      species_id,
      series: UNKNOWN_SERIES,
      color_id: null,
      colorRest: null,
      isPrismatic: false,
      prismaticVariant: null,
      needsReview: true,
    };
  }

  if (/^Treasured\b/i.test(trimmed)) {
    return {
      species_id: null,
      series: 'Treasured',
      color_id: null,
      colorRest: null,
      isPrismatic: false,
      prismaticVariant: null,
      needsReview: true,
    };
  }

  if (/^All-Star Essence\b/i.test(trimmed)) {
    return {
      species_id,
      series: 'All-Star Essence',
      color_id: null,
      colorRest: null,
      isPrismatic: false,
      prismaticVariant: null,
      needsReview: true,
    };
  }

  let rest = species_id != null ? stripSpeciesSuffix(trimmed, species_id) : trimmed;
  const prismatic = parsePrismaticPrefix(rest);
  const isPrismatic = prismatic.isPrismatic;
  const prismaticVariant = prismatic.prismaticVariant;
  rest = prismatic.rest;

  if (!rest) {
    return {
      species_id,
      series: UNKNOWN_SERIES,
      color_id: null,
      colorRest: null,
      isPrismatic,
      prismaticVariant,
      needsReview: true,
    };
  }

  const { series, colorRest, color_id } = splitSeriesAndColor(rest, colors);
  const needsReview = species_id == null || color_id == null;

  return {
    species_id,
    series,
    color_id,
    colorRest,
    isPrismatic,
    prismaticVariant,
    needsReview,
  };
}
