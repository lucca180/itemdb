import { Suspense } from 'react';
import { Flex, Text } from '@chakra-ui/react';
import Color from 'color';
import CardBase from '@components/Card/CardBase';
import { IconLink } from '@components/Utils/IconLink';
import { needsRecipes } from '@app/_components/Item/itemPageGates';
import { loadItemRecipes } from '@app/_components/Item/loadUtils';
import { ItemRecipesList } from '@app/_components/Item/Recipes/ItemRecipesList';
import { getTranslations } from 'next-intl/server';
import type { ItemData, ItemRecipe } from '@types';
import type { ReactNode } from 'react';

type Props = {
  item: ItemData;
};

type RecipeTypeConfig = {
  titleKey: string;
  href: string;
  /** Intro text with `<Link>` — used when viewing any related item */
  textKey?: string;
  /** Intro when the current item is an ingredient (e.g. broken toy) */
  textKeyWhenIngredient?: string;
  /** Intro when the current item is the result (e.g. repaired toy) */
  textKeyWhenResult?: string;
  /** `combine`: result = a + b | `transform`: a => result */
  layout: 'combine' | 'transform';
};

const RECIPE_TYPES: Record<string, RecipeTypeConfig> = {
  cookingpot: {
    titleKey: 'ItemPage.cooking-pot-recipes',
    textKey: 'ItemPage.cooking-pot-text',
    href: 'http://www.neopets.com/island/cookingpot.phtml',
    layout: 'combine',
  },
  repair: {
    titleKey: 'ItemPage.donnys-toy-repair-shop',
    textKeyWhenIngredient: 'ItemPage.can-be-repaired',
    textKeyWhenResult: 'ItemPage.has-broken-version',
    href: 'https://www.neopets.com/winter/brokentoys.phtml',
    layout: 'transform',
  },
  tangor: {
    titleKey: 'ItemPage.tangor-recipes',
    textKey: 'ItemPage.tangor-text',
    href: 'https://www.neopets.com/magma/workshop.phtml',
    layout: 'combine',
  },
};

function richIconLink(href: string, linkColor: string) {
  const RichLink = (children: ReactNode) => (
    <IconLink href={href} isExternal color={linkColor}>
      {children}
    </IconLink>
  );
  RichLink.displayName = 'RichIconLink';
  return RichLink;
}

function getIntroText(
  config: RecipeTypeConfig,
  item: ItemData,
  recipes: ItemRecipe[],
  t: Awaited<ReturnType<typeof getTranslations>>,
  linkColor: string
): ReactNode {
  const Link = richIconLink(config.href, linkColor);

  if (config.textKeyWhenIngredient && config.textKeyWhenResult) {
    const isIngredient = recipes.some((r) =>
      r.ingredients.some((i) => i.internal_id === item.internal_id)
    );
    return t.rich(isIngredient ? config.textKeyWhenIngredient : config.textKeyWhenResult, {
      Link,
    });
  }

  if (config.textKey) return t.rich(config.textKey, { Link });
  return null;
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
  const config = RECIPE_TYPES[recipeType];
  if (!config) return null;

  const linkColor = Color(item.color.hex).lightness(70).hex();
  const introText = getIntroText(config, item, recipes, t, linkColor);

  return (
    <CardBase title={t(config.titleKey)} color={item.color.rgb}>
      <Flex flexFlow={'column'} gap={3}>
        {introText && (
          <Text textAlign={'center'} fontSize={'sm'} css={{ '& a': { color: linkColor } }}>
            {introText}
          </Text>
        )}
        <ItemRecipesList
          recipes={recipes}
          layout={config.layout}
          uniquePrefix={`${recipeType}-card`}
          labels={{
            showMore: t('ItemPage.show-more'),
            showLess: t('ItemPage.show-less'),
          }}
        />
      </Flex>
    </CardBase>
  );
}

export default ItemRecipesCard;
