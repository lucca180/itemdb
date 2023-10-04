import { Text, Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import { ItemData } from '../../../types';
import { rarityToCCPoints } from '../../../utils/utils';
import CardBase from '../../Card/CardBase';

type Props = {
  item: ItemData;
};

const FF_PointsCard = (props: Props) => {
  const { item } = props;

  const points = item.rarity ? rarityToCCPoints(item) : 1;

  if (!points) return null;

  return (
    <CardBase
      title={
        <Link as={NextLink} href="/hub/faeriefestival2023">
          Faerie Festival 2023
        </Link>
      }
      color={'#eca5fd'}
    >
      <Text textAlign={'center'}>
        {item.rarity && (
          <Link as={NextLink} href="/hub/faeriefestival2023">
            {points} point{points > 1 ? 's' : ''}
          </Link>
        )}
        {!item.rarity && (
          <Link as={NextLink} href="/contribute">
            <Text fontSize={'sm'}>
              We don&apos;t know this item rarity <br />
              Want to help?
            </Text>
          </Link>
        )}
      </Text>
    </CardBase>
  );
};

export default FF_PointsCard;
