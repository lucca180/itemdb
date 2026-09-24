import Color, { type ColorInstance } from 'color';
import {
  getPalette as getColorThiefPalette,
  getSwatches,
  type Color as ColorThiefColor,
  type SwatchMap,
} from 'colorthief';
import type { Items } from '@prisma/generated/client';
import type { ColorType, ItemData } from '@types';
import prisma from '@utils/prisma';
import { getLabCell } from '@utils/item/labCell';

// Same heuristic as utils/wp/getArticlePalette.ts: only treat a candidate as a distinct
// secondary color when it's actually different enough from the dominant one; otherwise a
// lightened variant of the dominant color is a safer accent than a near-duplicate cluster.
const MIN_HUE_DIFF = 20;
const MIN_LIGHTNESS_DIFF = 20;

// `main`'s background wash needs to stay visible over the card's dark background but not
// blow out to near-white either — clamp its HSL lightness into a legible band.
const MIN_MAIN_LIGHTNESS = 30;
const MAX_MAIN_LIGHTNESS = 75;

const MIN_SATURATION = 0.15; // 15%

function normalizeMainLightness(color: ColorInstance): ColorInstance {
  const lightness = color.lightness();
  const clamped = Math.min(Math.max(lightness, MIN_MAIN_LIGHTNESS), MAX_MAIN_LIGHTNESS);
  return clamped === lightness ? color : color.lightness(clamped);
}

type ItemColorRowType = 'main' | 'secondary' | ColorType;

function toColorRow(
  image_id: string,
  image: string,
  color: ColorInstance,
  type: ItemColorRowType,
  population = 0,
  isMaxPopulation = false
) {
  const lab = color.lab().array();
  const hsv = color.hsv().array();
  const rgb = color.rgb().array();

  return {
    image_id,
    image,

    lab_l: lab[0],
    lab_a: lab[1],
    lab_b: lab[2],
    lab_cell: getLabCell(lab[0], lab[1], lab[2]),

    hsv_h: hsv[0],
    hsv_s: hsv[1],
    hsv_v: hsv[2],

    rgb_r: rgb[0],
    rgb_g: rgb[1],
    rgb_b: rgb[2],

    hex: color.hex(),

    type,
    population,
    isMaxPopulation,
  };
}

async function fetchImageBuffer(imageUrl: string): Promise<Buffer | undefined> {
  const res = await fetch(imageUrl);
  if (!res.ok) return undefined;
  return Buffer.from(await res.arrayBuffer());
}

export type ItemColorRow = ReturnType<typeof toColorRow>;

// `main`/`secondary`: a dominant + a visually distinct accent, used for the card/page wash.
function buildAccentRows(image_id: string, image: string, palette: ColorThiefColor[]) {
  // getPalette() does NOT guarantee population-sorted order — when the image has fewer
  // unique colors than the requested colorCount (common for small item icons), colorthief
  // returns them in first-seen pixel order instead. Pick the true max-population entry.
  const dominant = palette.reduce((max, c) => (c.population > max.population ? c : max));
  const dominantColor = Color.rgb(dominant.array() as number[]);

  const secondaryMatch = palette.find((c) => {
    if (c === dominant) return false;
    const candidate = Color.rgb(c.array() as number[]);
    return (
      Math.abs(candidate.hue() - dominantColor.hue()) > MIN_HUE_DIFF ||
      Math.abs(candidate.lightness() - dominantColor.lightness()) > MIN_LIGHTNESS_DIFF
    );
  });

  const secondaryColor = secondaryMatch
    ? Color.rgb(secondaryMatch.array() as number[])
    : dominantColor.lightness(Math.min(Math.max(dominantColor.lightness() + 25, 65), 90));

  const mainColor = normalizeMainLightness(dominantColor);

  return [
    toColorRow(image_id, image, mainColor, 'main', dominant.population),
    toColorRow(image_id, image, secondaryColor, 'secondary', secondaryMatch?.population ?? 0),
  ];
}

// The 6 named roles the ColorInfoCard palette displays (Vibrant/Muted/DarkVibrant/...),
// replacing node-vibrant's swatch classifier with colorthief's own OKLCH-based one. A role
// colorthief couldn't confidently match falls back to the same white/population-0 placeholder
// node-vibrant used, so `FullItemColors` always has all 6 keys and "invisible item" detection
// (ColorInfoCardPalette) keeps working unchanged.
function buildSwatchRows(image_id: string, image: string, swatches: SwatchMap) {
  const rows = Object.entries(swatches).map(([role, swatch]) => {
    const color = swatch ? Color.rgb(swatch.color.array() as number[]) : Color.rgb([255, 255, 255]);
    const population = swatch?.color.population ?? 0;
    return toColorRow(image_id, image, color, role.toLowerCase() as ColorType, population);
  });

  if (rows.length > 0) {
    let maxIndex = 0;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].population > rows[maxIndex].population) maxIndex = i;
    }
    rows[maxIndex].isMaxPopulation = true;
  }

  return rows;
}

// Just the 6 named swatches — used by the ColorInfoCard full-palette (force-)refresh, which
// is independent of the main/secondary accent pair.
export async function getColorThiefSwatchRows(item: Items | ItemData) {
  try {
    if (!item.image || !item.image_id) return undefined;
    const { image, image_id } = item;

    const buffer = await fetchImageBuffer(image);
    if (!buffer) return undefined;

    const swatches = await getSwatches(buffer, {
      ignoreWhite: true,
      minSaturation: MIN_SATURATION,
    });
    return buildSwatchRows(image_id, image, swatches);
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

// Full set (main/secondary + the 6 named swatches) from an already-fetched image buffer —
// used both by getColorThiefItemColors below and by the batch backfill script, which fetches
// the buffer itself (CDN-first, falling back to Neopets) instead of via fetchImageBuffer.
export async function getColorThiefColorsFromBuffer(
  image_id: string,
  image: string,
  buffer: Buffer
): Promise<ItemColorRow[] | undefined> {
  const [palette, swatches] = await Promise.all([
    getColorThiefPalette(buffer, { ignoreWhite: true, minSaturation: MIN_SATURATION }),
    getSwatches(buffer, { ignoreWhite: true, minSaturation: MIN_SATURATION }),
  ]);

  if (!palette || palette.length === 0) return undefined;

  return [
    ...buildAccentRows(image_id, image, palette),
    ...buildSwatchRows(image_id, image, swatches),
  ];
}

// Full set for an item: `main`/`secondary` (card/page accent) + the 6 named swatches
// (ColorInfoCard). Fetches the image once and reuses the buffer for both extractions.
export async function getColorThiefItemColors(item: Items | ItemData) {
  try {
    if (!item.image || !item.image_id) return undefined;
    const { image, image_id } = item;

    const buffer = await fetchImageBuffer(image);
    if (!buffer) return undefined;

    return await getColorThiefColorsFromBuffer(image_id, image, buffer);
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

// Upserts a set of rows (from getColorThiefItemColors/getColorThiefColorsFromBuffer) into
// ItemColor. Upsert (not delete-then-createMany) so concurrent writers for the same
// [image_id, type] never race each other into a unique-constraint error.
export async function upsertColorRows(rows: ItemColorRow[]) {
  await Promise.all(
    rows.map((row) =>
      prisma.itemColor.upsert({
        where: { image_id_type: { image_id: row.image_id, type: row.type } },
        create: row,
        update: row,
      })
    )
  );
}

// Generates (and persists) an item's colors only when `main` doesn't exist yet — a live
// safety net for items the batch backfill hasn't reached, not the primary population path.
export async function getOrCreateColorThiefColors(
  item: Items | ItemData
): Promise<ItemData['color'] | null> {
  try {
    const rows = await getColorThiefItemColors(item);
    if (!rows) return null;

    await upsertColorRows(rows);

    const main = rows.find((row) => row.type === 'main');
    if (!main) return null;

    return {
      hsv: [main.hsv_h, main.hsv_s, main.hsv_v],
      rgb: [main.rgb_r, main.rgb_g, main.rgb_b],
      lab: [main.lab_l, main.lab_a, main.lab_b],
      hex: main.hex,
      type: 'main',
      population: main.population,
    };
  } catch (e) {
    // Another request may have inserted the same [image_id, type] row concurrently, or the
    // extraction failed — either way, degrade to "no color yet" rather than 500 the item page.
    console.error(e);
    return null;
  }
}
