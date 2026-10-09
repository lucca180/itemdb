import { cache } from 'react';
import { cacheLife } from 'next/cache';
import { ItemService } from '@services/ItemService';
import { getCachedItem } from '@app/_components/Item/loadUtils';
import { applyItemSectionCacheTags } from '@utils/item/applyItemCacheTags';
import { getMMEData, isMME } from '@pages/api/v1/items/[id_name]/mme';
import { getDyeworksData } from '@pages/api/v1/items/[id_name]/dyeworks';
import { getItemRecipes } from '@pages/api/v1/items/[id_name]/recipes';
import type { ItemV2For } from '@types';

/*
 * Related-item sections (MME, dyeworks, recipes) are split in two caches:
 * - structure (which items relate, by `internal_id`): rarely changes → `itemStatic`
 * - card data (name/image/price) via `loadItemCards`: price-sensitive → `itemMedium`
 */

export type ItemCardData = ItemV2For<'card'>;

export type ItemMMEDataV2 = {
  name: string;
  isMini: boolean;
  initial: ItemCardData;
  bonus: ItemCardData;
  trails: { [trailName: string]: ItemCardData[] };
};

export type DyeworksDataV2 = {
  originalItem: ItemCardData;
  dyes: ItemCardData[];
};

export type ItemRecipeV2 = {
  internal_id: number;
  result: ItemCardData;
  ingredients: ItemCardData[];
  type: string;
};

type MMEStructure = {
  name: string;
  isMini: boolean;
  initial: number;
  bonus: number;
  trails: { [trailName: string]: number[] };
};

type DyeStructure = { originalItem: number; dyes: number[] };

type RecipeStructure = { internal_id: number; type: string; result: number; ingredients: number[] };

const toCardIds = (ids: number[]) => [...new Set(ids)].sort((a, b) => a - b);

/** Card payloads keyed by `internal_id`. Callers pass sorted unique ids so related items share entries. */
const loadItemCards = cache(async (iids: number[]): Promise<Record<string, ItemCardData>> => {
  'use cache';
  cacheLife('itemMedium');
  if (iids.length === 0) return {};
  return ItemService.getManyItems(
    { type: 'id', data: iids },
    { intent: 'card', cached: false, limit: iids.length }
  );
});

const loadMMEStructure = cache(async (internalId: number): Promise<MMEStructure | null> => {
  'use cache';
  applyItemSectionCacheTags(internalId, 'mme');
  cacheLife('itemStatic');
  const cachedItem = await getCachedItem(internalId, true);
  if (!cachedItem || !isMME(cachedItem.name)) return null;
  const data = await getMMEData(cachedItem);
  if (!data) return null;
  return {
    name: data.name,
    isMini: data.isMini,
    initial: data.initial.internal_id,
    bonus: data.bonus.internal_id,
    trails: Object.fromEntries(
      Object.entries(data.trails).map(([trail, items]) => [trail, items.map((i) => i.internal_id)])
    ),
  };
});

export const loadMMEData = cache(async (internalId: number): Promise<ItemMMEDataV2 | null> => {
  const structure = await loadMMEStructure(internalId);
  if (!structure) return null;

  const trailIds = Object.values(structure.trails).flat();
  const cards = await loadItemCards(toCardIds([structure.initial, structure.bonus, ...trailIds]));
  const initial = cards[structure.initial];
  const bonus = cards[structure.bonus];
  if (!initial || !bonus) return null;

  return {
    name: structure.name,
    isMini: structure.isMini,
    initial,
    bonus,
    trails: Object.fromEntries(
      Object.entries(structure.trails).map(([trail, ids]) => [
        trail,
        ids.map((id) => cards[id]).filter((card): card is ItemCardData => !!card),
      ])
    ),
  };
});

const loadDyeStructure = cache(async (internalId: number): Promise<DyeStructure | null> => {
  'use cache';
  applyItemSectionCacheTags(internalId, 'dye');
  cacheLife('itemStatic');
  const cachedItem = await getCachedItem(internalId, true);
  if (!cachedItem?.isNC || !cachedItem.isWearable) return null;
  const data = await getDyeworksData(cachedItem);
  if (!data) return null;
  return {
    originalItem: data.originalItem.internal_id,
    dyes: data.dyes.map((dye) => dye.internal_id),
  };
});

export const loadDyeData = cache(async (internalId: number): Promise<DyeworksDataV2 | null> => {
  const structure = await loadDyeStructure(internalId);
  if (!structure) return null;

  const cards = await loadItemCards(toCardIds([structure.originalItem, ...structure.dyes]));
  const originalItem = cards[structure.originalItem];
  if (!originalItem) return null;

  const dyes = structure.dyes.map((id) => cards[id]).filter((card): card is ItemCardData => !!card);
  if (dyes.length === 0) return null;

  return { originalItem, dyes };
});

const loadItemRecipesStructure = cache(async (internalId: number): Promise<RecipeStructure[]> => {
  'use cache';
  applyItemSectionCacheTags(internalId, 'recipes');
  cacheLife('itemStatic');
  const cachedItem = await getCachedItem(internalId, true);
  if (!cachedItem || cachedItem.isNC) return [];
  const recipes = await getItemRecipes(cachedItem.internal_id);
  return recipes.map((recipe) => ({
    internal_id: recipe.internal_id,
    type: recipe.type,
    result: recipe.result.internal_id,
    ingredients: recipe.ingredients.map((ingredient) => ingredient.internal_id),
  }));
});

export const loadItemRecipes = cache(async (internalId: number): Promise<ItemRecipeV2[]> => {
  const structure = await loadItemRecipesStructure(internalId);
  if (structure.length === 0) return [];

  const cards = await loadItemCards(
    toCardIds(structure.flatMap((recipe) => [recipe.result, ...recipe.ingredients]))
  );

  return structure.flatMap((recipe) => {
    const result = cards[recipe.result];
    const ingredients = recipe.ingredients.map((id) => cards[id]);
    if (!result || ingredients.some((ingredient) => !ingredient)) return [];
    return [
      {
        internal_id: recipe.internal_id,
        type: recipe.type,
        result,
        ingredients: ingredients as ItemCardData[],
      },
    ];
  });
});
