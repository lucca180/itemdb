import { Center, Flex, Text } from '@chakra-ui/react';
import React from 'react';
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
  return (
    <CardBase title={t('ItemPage.cooking-pot-recipes')} color={item.color.rgb}>
      <Flex flexFlow={'column'} gap={3}>
        <Text textAlign={'center'} fontSize={'sm'} sx={{ a: { color: color.lightness(70).hex() } }}>
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
              <ItemCard key={recipe.result.internal_id} item={recipe.result} small />
              <Center>=</Center>
              {recipe.ingredients.map((ingredient, i) => (
                <>
                  <ItemCard key={ingredient.internal_id} item={ingredient} small />{' '}
                  {+i !== recipe.ingredients.length - 1 && <Center>+</Center>}
                </>
              ))}
            </Center>
          </Center>
        ))}
      </Flex>
    </CardBase>
  );
};

export default ItemRecipes;
