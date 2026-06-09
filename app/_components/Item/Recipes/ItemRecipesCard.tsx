import { Fragment, Suspense } from 'react';
import { Center, Flex, Text } from '@chakra-ui/react';
import Color from 'color';
import CardBase from '@components/Card/CardBase';
import ItemCard from '@components/Items/ItemCard';
import { IconLink } from '@components/Utils/IconLink';
import { needsRecipes } from '@app/_components/Item/itemPageGates';
import { loadItemRecipes } from '@app/_components/Item/loadUtils';
import { getTranslations } from 'next-intl/server';
import type { ItemData, ItemRecipe } from '@types';
import type { ReactNode } from 'react';

type Props = {
  item: ItemData;
};

type RepairRecipeDetails = {
  broken: ItemData;
  original: ItemData;
  itemType: 'broken' | 'original';
};

function getRepairRecipeDetails(item: ItemData, recipes: ItemRecipe[]): RepairRecipeDetails | null {
  const recipe = recipes[0];
  if (!recipe || recipe.type !== 'repair') return null;

  return {
    broken: recipe.ingredients[0],
    original: recipe.result,
    itemType: item.internal_id === recipe.ingredients[0].internal_id ? 'broken' : 'original',
  };
}

function richIconLink(href: string, linkColor: string) {
  const RichLink = (children: ReactNode) => (
    <IconLink href={href} isExternal color={linkColor}>
      {children}
    </IconLink>
  );
  RichLink.displayName = 'RichIconLink';
  return RichLink;
}

export async function ItemRecipesCard({ item }: Props) {
  if (!needsRecipes(item)) return null;

  return (
    <Suspense fallback={null}>
      <ItemRecipesCardContent item={item} />
    </Suspense>
  );
}

async function ItemRecipesCardContent({ item }: Props) {
  const [recipes, t] = await Promise.all([loadItemRecipes(item.internal_id), getTranslations()]);
  if (recipes.length === 0) return null;

  const recipeType = recipes[0].type;
  const linkColor = Color(item.color.hex).lightness(70).hex();
  const repairDetails = getRepairRecipeDetails(item, recipes);

  const title =
    recipeType === 'cookingpot'
      ? t('ItemPage.cooking-pot-recipes')
      : recipeType === 'repair'
        ? t('ItemPage.donnys-toy-repair-shop')
        : undefined;

  let introText: ReactNode = null;

  if (recipeType === 'cookingpot') {
    introText = t.rich('ItemPage.cooking-pot-text', {
      Link: richIconLink('http://www.neopets.com/island/cookingpot.phtml', linkColor),
    });
  } else if (recipeType === 'repair' && repairDetails) {
    introText =
      repairDetails.itemType === 'broken'
        ? t.rich('ItemPage.can-be-repaired', {
            Link: richIconLink('https://www.neopets.com/winter/brokentoys.phtml', linkColor),
          })
        : t.rich('ItemPage.has-broken-version', {
            Link: richIconLink('https://www.neopets.com/winter/brokentoys.phtml', linkColor),
          });
  }

  return (
    <CardBase title={title} color={item.color.rgb}>
      <Flex flexFlow={'column'} gap={3}>
        {introText && (
          <Text textAlign={'center'} fontSize={'sm'} css={{ '& a': { color: linkColor } }}>
            {introText}
          </Text>
        )}
        {recipeType === 'cookingpot' &&
          recipes.map((recipe) => (
            <Center key={recipe.internal_id}>
              <Center
                bg="gray.700"
                p={3}
                gap={3}
                alignItems={'stretch'}
                borderRadius={'md'}
                flexWrap={'wrap'}
              >
                <ItemCard
                  uniqueID={`cooking-pot-card-${recipe.result.internal_id}`}
                  key={recipe.result.internal_id}
                  item={recipe.result}
                  small
                />
                <Center>=</Center>
                {recipe.ingredients.map((ingredient, i) => (
                  <Fragment key={ingredient.internal_id}>
                    <ItemCard
                      uniqueID={`cooking-pot-card-${ingredient.internal_id}`}
                      item={ingredient}
                      small
                    />
                    {i !== recipe.ingredients.length - 1 && <Center>+</Center>}
                  </Fragment>
                ))}
              </Center>
            </Center>
          ))}
        {recipeType === 'repair' &&
          repairDetails &&
          recipes.map((recipe) => (
            <Center key={recipe.internal_id}>
              <Center
                bg="gray.700"
                p={3}
                gap={3}
                alignItems={'stretch'}
                borderRadius={'md'}
                flexWrap={'wrap'}
              >
                <ItemCard
                  uniqueID={`repair-card-${repairDetails.broken.internal_id}`}
                  key={repairDetails.broken.internal_id}
                  item={repairDetails.broken}
                  small
                />
                <Center>{'=>'}</Center>
                <ItemCard
                  uniqueID={`repair-card-${repairDetails.original.internal_id}`}
                  key={repairDetails.original.internal_id}
                  item={repairDetails.original}
                  small
                />
              </Center>
            </Center>
          ))}
      </Flex>
    </CardBase>
  );
}

export default ItemRecipesCard;
