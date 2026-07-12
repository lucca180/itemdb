import { NextApiRequest, NextApiResponse } from 'next';
import { getItem } from '.';
import prisma from '../../../../../utils/prisma';
import { getManyItems } from '../many';
import { ItemData, ItemRecipe } from '../../../../../types';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id_name = req.query.id_name as string;
  const id = Number(id_name);

  const itemQuery = isNaN(id) ? id_name : id;

  const item = await getItem(itemQuery);
  if (!item) return res.status(400).json({ error: 'Item not found' });

  const recipes = await getItemRecipes(item.internal_id);

  return res.status(200).json(recipes);
}

export const getItemRecipes = async (iid: number) => {
  const recipes = await prisma.itemRecipes.findMany({
    where: {
      OR: [
        { result_iid: iid },
        {
          ingredients: {
            some: {
              item_iid: iid,
            },
          },
        },
      ],
    },
    select: {
      internal_id: true,
      result_iid: true,
      type: true,
    },
  });

  if (recipes.length === 0) return [];

  const recipeIds = recipes.map((recipe) => recipe.internal_id);
  const ingredients = await prisma.itemIngredients.findMany({
    where: { recipe_id: { in: recipeIds } },
  });

  const ingredientsByRecipeId = new Map<number, typeof ingredients>();
  for (const ingredient of ingredients) {
    const list = ingredientsByRecipeId.get(ingredient.recipe_id) ?? [];
    list.push(ingredient);
    ingredientsByRecipeId.set(ingredient.recipe_id, list);
  }

  const itemIds = new Set<number>();
  for (const recipe of recipes) {
    itemIds.add(recipe.result_iid);
    for (const ingredient of ingredientsByRecipeId.get(recipe.internal_id) ?? []) {
      itemIds.add(ingredient.item_iid);
    }
  }

  const itemData = await getManyItems({
    id: Array.from(itemIds).map((x) => x.toString()),
  });

  const itemRecipes: ItemRecipe[] = [];

  for (const recipe of recipes) {
    const target = itemData[recipe.result_iid];
    if (!target) {
      console.warn('missing target item', recipe.result_iid);
      continue;
    }

    const recipeIngredients = ingredientsByRecipeId.get(recipe.internal_id) ?? [];
    const ingredientItems = recipeIngredients.map((ingredient) => {
      if (!itemData[ingredient.item_iid]) {
        console.warn('missing ingredient item', ingredient.item_iid);
        return null;
      }

      return itemData[ingredient.item_iid];
    });

    if (ingredientItems.some((x) => !x)) {
      console.warn('missing item data', recipe.result_iid, recipeIngredients);
      continue;
    }

    const sortedIngredients = (ingredientItems as ItemData[]).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    itemRecipes.push({
      internal_id: recipe.internal_id,
      result: target,
      ingredients: sortedIngredients,
      type: recipe.type,
    });
  }

  return itemRecipes.sort((a, b) => b.ingredients.length - a.ingredients.length);
};
