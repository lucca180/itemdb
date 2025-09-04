import { Center, Flex, Text } from '@chakra-ui/react';
import React, { useMemo } from 'react';
import { ItemData, ItemRecipe } from '../../types';
import CardBase from '../Card/CardBase';
import Color from 'color';
import { useTranslations } from 'next-intl';
import ItemCard from './ItemCard';
import { IconLink } from '../Utils/IconLink';

type Props = {
  item: ItemData;
  recipes: ItemRecipe[];
};

const ItemRecipes = (props: Props) => {
  const t = useTranslations();
  const { item, recipes } = props;
  const color = Color(item.color.hex);

  const recipeType = recipes[0].type;

  const title = useMemo(() => {
    if (recipeType === 'cookingpot') return t('ItemPage.cooking-pot-recipes');
    if (recipeType === 'repair') return t('ItemPage.donnys-toy-repair-shop');
  }, [recipeType]);

  const repairDetails = useMemo(() => {
    if (recipeType !== 'repair') return;

    const details = {
      broken: recipes[0].ingredients[0],
      original: recipes[0].result,
      itemType: item.internal_id === recipes[0].ingredients[0].internal_id ? 'broken' : 'original',
    };

    return details;
  }, [recipeType, item]);

  return (
    <CardBase title={title} color={item.color.rgb}>
      <Flex flexFlow={'column'} gap={3}>
        {recipeType === 'cookingpot' && (
          <>
            <Text
              textAlign={'center'}
              fontSize={'sm'}
              sx={{ a: { color: color.lightness(70).hex() } }}
            >
              {t.rich('ItemPage.cooking-pot-text', {
                Link: (children) => (
                  <IconLink href="http://www.neopets.com/island/cookingpot.phtml" isExternal>
                    {children}
                  </IconLink>
                ),
              })}
            </Text>
            {recipes.map((recipe) => (
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
                    <>
                      <ItemCard
                        uniqueID={`cooking-pot-card-${ingredient.internal_id}`}
                        key={ingredient.internal_id}
                        item={ingredient}
                        small
                      />{' '}
                      {+i !== recipe.ingredients.length - 1 && <Center>+</Center>}
                    </>
                  ))}
                </Center>
              </Center>
            ))}
          </>
        )}
        {recipeType === 'repair' && repairDetails && (
          <>
            <Text
              textAlign={'center'}
              fontSize={'sm'}
              sx={{ a: { color: color.lightness(70).hex() } }}
            >
              {repairDetails.itemType === 'broken' && (
                <>
                  {t.rich('ItemPage.can-be-repaired', {
                    Link: (children) => (
                      <IconLink href="https://www.neopets.com/winter/brokentoys.phtml" isExternal>
                        {children}
                      </IconLink>
                    ),
                  })}
                </>
              )}
              {repairDetails.itemType === 'original' && (
                <>
                  {t.rich('ItemPage.has-broken-version', {
                    Link: (children) => (
                      <IconLink href="https://www.neopets.com/winter/brokentoys.phtml" isExternal>
                        {children}
                      </IconLink>
                    ),
                  })}
                </>
              )}
            </Text>
            {recipes.map((recipe) => (
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
          </>
        )}
      </Flex>
    </CardBase>
  );
};

export default ItemRecipes;
