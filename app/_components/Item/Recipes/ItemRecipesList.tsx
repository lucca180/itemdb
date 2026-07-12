'use client';

import { Fragment, useState } from 'react';
import { Button, Center, Flex } from '@chakra-ui/react';
import ItemCard from '@components/Items/ItemCard';
import type { ItemRecipe } from '@types';

const VISIBLE_LIMIT = 3;

type Props = {
  recipes: ItemRecipe[];
  layout: 'combine' | 'transform';
  uniquePrefix: string;
  labels: {
    showMore: string;
    showLess: string;
  };
};

function RecipeRow({
  recipe,
  layout,
  uniquePrefix,
}: {
  recipe: ItemRecipe;
  layout: Props['layout'];
  uniquePrefix: string;
}) {
  const left = layout === 'combine' ? recipe.result : recipe.ingredients[0];
  const right = layout === 'combine' ? recipe.ingredients : [recipe.result];
  const operator = layout === 'combine' ? '=' : '=>';

  return (
    <Center>
      <Center
        bg="gray.700"
        p={3}
        gap={3}
        alignItems={'stretch'}
        borderRadius={'md'}
        flexWrap={'wrap'}
      >
        <ItemCard
          uniqueID={`${uniquePrefix}-${recipe.internal_id}-${left.internal_id}`}
          item={left}
          small
        />
        <Center>{operator}</Center>
        {right.map((entry, i) => (
          <Fragment key={`${recipe.internal_id}-${entry.internal_id}`}>
            <ItemCard
              uniqueID={`${uniquePrefix}-${recipe.internal_id}-${entry.internal_id}`}
              item={entry}
              small
            />
            {i !== right.length - 1 && <Center>+</Center>}
          </Fragment>
        ))}
      </Center>
    </Center>
  );
}

export function ItemRecipesList({ recipes, layout, uniquePrefix, labels }: Props) {
  const [showMore, setShowMore] = useState(false);
  const visible = showMore ? recipes : recipes.slice(0, VISIBLE_LIMIT);

  return (
    <>
      {visible.map((recipe) => (
        <RecipeRow
          key={recipe.internal_id}
          recipe={recipe}
          layout={layout}
          uniquePrefix={uniquePrefix}
        />
      ))}
      {recipes.length > VISIBLE_LIMIT && (
        <Flex justifyContent="center">
          <Button size="sm" onClick={() => setShowMore((current) => !current)}>
            {showMore ? labels.showLess : labels.showMore}
          </Button>
        </Flex>
      )}
    </>
  );
}
