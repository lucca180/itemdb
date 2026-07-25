import type { ItemEffect } from '@types';
import { ItemEffect as PrismaItemEffect } from '@prisma/generated/client';
import { allNeopetsColors, allSpecies, petpetColors } from '@utils/pet-utils';

/** Maps a Prisma `ItemEffect` row to the public `ItemEffect` shape. */
export const formatEffect = (effect: PrismaItemEffect): ItemEffect => {
  let colorTarget = null;
  if (effect.colorTarget && effect.type === 'colorSpecies') {
    colorTarget = allNeopetsColors[`${effect.colorTarget}`];
  } else if (effect.colorTarget && effect.type === 'petpetColor') {
    colorTarget = petpetColors[`${effect.colorTarget}`];
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
    colorTarget: colorTarget,
    speciesTarget: effect.speciesTarget ? allSpecies[`${effect.speciesTarget}`] : null,
    text: effect.text,
  };

  return JSON.parse(JSON.stringify(obj)) as ItemEffect;
};
