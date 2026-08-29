import type { ItemEffect } from '@types';
import { ItemEffect as PrismaItemEffect } from '@prisma/generated/client';
import { allSpecies, findPetColorName, type PetColorsCatalog } from '@utils/pet-utils';

/** Maps a Prisma `ItemEffect` row to the public `ItemEffect` shape. */
export const formatEffect = (
  effect: PrismaItemEffect,
  colors: PetColorsCatalog = {},
  /** map_id → name from PetpetColorCatalog */
  petpetColorNames: Record<string, string> = {}
): ItemEffect => {
  let colorTarget: string | null = null;
  let colorTargetId: number | null = null;

  if (effect.colorTarget && effect.type === 'colorSpecies') {
    colorTargetId = effect.colorTarget;
    colorTarget = findPetColorName(effect.colorTarget, colors) ?? null;
  } else if (effect.colorTarget && effect.type === 'petpetColor') {
    colorTargetId = effect.colorTarget;
    colorTarget = petpetColorNames[`${effect.colorTarget}`] ?? null;
  }

  const obj: ItemEffect = {
    internal_id: effect.internal_id,
    type: effect.type as ItemEffect['type'],
    name: effect.name,
    species: effect.species?.split(',') ?? null,
    isChance: effect.isChance,
    minVal: effect.minVal,
    maxVal: effect.maxVal,
    strVal: effect.strVal,
    colorTarget,
    colorTargetId,
    speciesTarget: effect.speciesTarget ? allSpecies[`${effect.speciesTarget}`] : null,
    text: effect.text,
  };

  return JSON.parse(JSON.stringify(obj)) as ItemEffect;
};
