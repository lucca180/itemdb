import { allSpecies, findPetColorId, findPetColorName, getSpeciesId } from '@utils/pet-utils';
import type { PetColorsCatalog } from '@utils/pet-utils';

type Translator = (key: string, values?: Record<string, string | number>) => string;

/** English indefinite article based on the leading letter (good enough for colour/species names). */
export function indefiniteArticle(word: string): 'a' | 'an' {
  const first = word.trim().charAt(0).toLowerCase();
  return 'aeiou'.includes(first) ? 'an' : 'a';
}

export function howToGetComboTitle(t: Translator, color: string, species: string): string {
  return t('PetColors.species-color-title', {
    article: indefiniteArticle(color),
    0: color,
    1: species,
  });
}

export function howToGetComboSeoTitle(t: Translator, color: string, species: string): string {
  return t('PetColors.species-color-seo-title', {
    article: indefiniteArticle(color),
    0: color,
    1: species,
  });
}

export function browseSpeciesTitle(t: Translator, species: string): string {
  return t('PetColors.species-title', { article: indefiniteArticle(species), 0: species });
}

export function browseColorTitle(t: Translator, color: string): string {
  return t('PetColors.how-to-get-title', { 0: color });
}

export function capitalizeSlug(value: string): string {
  return value
    .split('-')
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part))
    .join(' ');
}

/** Resolve the canonical display name for a browse slug, preferring the real catalog casing. */
export function resolveBrowseName(
  slug: string,
  kind: 'species' | 'color',
  colors: PetColorsCatalog
): string {
  if (kind === 'species') {
    const speciesId = getSpeciesId(slug);
    return (speciesId && allSpecies[speciesId]) || capitalizeSlug(slug);
  }

  const colorId = findPetColorId(slug, colors);
  return (colorId && findPetColorName(colorId, colors)) || capitalizeSlug(slug);
}
