import { Text } from '@chakra-ui/react';
import { ItemData } from '../../../types';
import { rarityToCCPoints } from '../../../utils/utils';
import CardBase from '../../Card/CardBase';
import Link from '@components/Utils/MainLink';
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
        <Link href="/hub/faeriefestival" trackEvent="ff-card">
          Faerie Festival
        </Link>
      }
      color={'#eca5fd'}
    >
      <Text textAlign={'center'}>
        {item.rarity && (
          <Link href="/hub/faeriefestival" trackEvent="ff-card">
            {points} point{points > 1 ? 's' : ''}
          </Link>
        )}
        {!item.rarity && (
          <Link href="/contribute" trackEvent="ff-card">
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
