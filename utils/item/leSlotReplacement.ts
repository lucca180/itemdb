type OpeningRow = {
  opening_id: string;
  limitedEdition: boolean;
};

/** Openings needed on each side (with and without LE) before comparing their sizes. */
const MIN_OPENINGS_PER_KIND = 3;
/** Share of openings that must have the most common size, so mixed containers are left alone. */
const MIN_MODE_SHARE = 0.9;

/** Most common value and how much of the list it covers, `null` when there is no clear winner. */
const dominantSize = (sizes: number[]) => {
  const counts = new Map<number, number>();
  for (const size of sizes) counts.set(size, (counts.get(size) ?? 0) + 1);

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (!ranked.length || ranked[0][1] === ranked[1]?.[1]) return null;

  return { size: ranked[0][0], share: ranked[0][1] / sizes.length };
};

/**
 * True when LE items are just another outcome of the same roll instead of an extra one.
 *
 * A LE that takes the place of a regular drop leaves openings the same size with or without it
 * (e.g. 1 item either way). A bonus LE roll makes openings that contain it bigger.
 */
export const doesLeReplaceSlot = (rows: OpeningRow[]) => {
  const openings = new Map<string, { size: number; hasLE: boolean }>();

  for (const row of rows) {
    const opening = openings.get(row.opening_id) ?? { size: 0, hasLE: false };
    opening.size++;
    opening.hasLE ||= row.limitedEdition;
    openings.set(row.opening_id, opening);
  }

  const withLE: number[] = [];
  const withoutLE: number[] = [];
  for (const { size, hasLE } of openings.values()) (hasLE ? withLE : withoutLE).push(size);

  if (withLE.length < MIN_OPENINGS_PER_KIND || withoutLE.length < MIN_OPENINGS_PER_KIND)
    return false;

  const regular = dominantSize(withoutLE);
  const limited = dominantSize(withLE);
  if (!regular || !limited) return false;

  return (
    regular.size === limited.size &&
    regular.share >= MIN_MODE_SHARE &&
    limited.share >= MIN_MODE_SHARE
  );
};
