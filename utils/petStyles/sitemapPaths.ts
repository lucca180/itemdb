import { fetchAllNeopetsColors } from '@utils/pet-colors';
import { allSpecies, findPetColorName } from '@utils/pet-utils';
import prisma from '@utils/prisma';
import { UNKNOWN_COLOR_NAME, stylesBrowseHref, stylesComboHref } from '@utils/petStyles/paths';

/**
 * Indexable Pet Styles browse/combo paths with ≥1 style.
 * Hub lives in STATIC_SITEMAP_PATHS.
 */
export async function loadPetStylesSitemapPaths(): Promise<string[]> {
  const colorsCatalog = await fetchAllNeopetsColors();
  const paths = new Set<string>();

  const displayable = { species_id: { not: null }, needsReview: false } as const;

  const speciesRows = await prisma.petStyle.findMany({
    where: displayable,
    distinct: ['species_id'],
    select: { species_id: true },
  });
  for (const row of speciesRows) {
    const name = allSpecies[String(row.species_id)];
    if (name) paths.add(stylesBrowseHref(name));
  }

  const colorRows = await prisma.petStyle.findMany({
    where: { ...displayable, color_id: { not: null } },
    distinct: ['color_id'],
    select: { color_id: true },
  });
  for (const row of colorRows) {
    const name = findPetColorName(row.color_id!, colorsCatalog);
    if (name) paths.add(stylesBrowseHref(name));
  }

  const unknownCount = await prisma.petStyle.count({
    where: { ...displayable, color_id: null },
  });
  if (unknownCount > 0) paths.add(stylesBrowseHref(UNKNOWN_COLOR_NAME));

  const comboRows = await prisma.petStyle.findMany({
    where: { ...displayable, color_id: { not: null } },
    distinct: ['species_id', 'color_id'],
    select: { species_id: true, color_id: true },
  });
  for (const row of comboRows) {
    const speciesName = allSpecies[String(row.species_id)];
    const colorName = findPetColorName(row.color_id!, colorsCatalog);
    if (speciesName && colorName) paths.add(stylesComboHref(speciesName, colorName));
  }

  const unknownCombos = await prisma.petStyle.findMany({
    where: { ...displayable, color_id: null },
    distinct: ['species_id'],
    select: { species_id: true },
  });
  for (const row of unknownCombos) {
    const speciesName = allSpecies[String(row.species_id)];
    if (speciesName) paths.add(stylesComboHref(speciesName, UNKNOWN_COLOR_NAME));
  }

  return [...paths];
}
