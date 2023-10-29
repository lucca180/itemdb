import { Center, Flex, HStack, Image, Tag, Text, Link } from '@chakra-ui/react';
import React from 'react';
import { ItemData, ItemLastSeen } from '../../types';
import {
  categoryToShopID,
  faerielandShops,
  getRestockPrice,
  halloweenShops,
  tyrannianShops,
} from '../../utils/utils';
import CardBase from '../Card/CardBase';

type Props = {
  item: ItemData;
  lastSeen: ItemLastSeen | null;
};

const intl = new Intl.NumberFormat();

const ItemRestock = (props: Props) => {
  const { item, lastSeen } = props;
  const [specialDay, setSpecialDay] = React.useState('');

  React.useEffect(() => {
    if (!item.category) return;
    const todayNST = new Date();

    if (todayNST.getDate() === 3) setSpecialDay('hpd');
    else if (
      todayNST.getMonth() === 4 &&
      todayNST.getDate() === 12 &&
      tyrannianShops.map((x) => x.toLowerCase()).includes(item.category.toLowerCase())
    )
      setSpecialDay('tyrannia');

    if (
      todayNST.getMonth() === 7 &&
      todayNST.getDate() === 20 &&
      item.category.toLowerCase() === 'usuki doll'
    )
      setSpecialDay('usukicon');

    if (
      todayNST.getMonth() === 8 &&
      todayNST.getDate() === 20 &&
      faerielandShops.map((x) => x.toLowerCase()).includes(item.category.toLowerCase())
    )
      setSpecialDay('festival');

    if (
      todayNST.getMonth() === 9 &&
      todayNST.getDate() === 31 &&
      halloweenShops.map((x) => x.toLowerCase()).includes(item.category.toLowerCase())
    )
      setSpecialDay('halloween');
  }, []);

  const restockPrice = getRestockPrice(item);
  if (!item.category || !item.estVal || !restockPrice) return null;

  return (
    <CardBase title="Restock Info" color={item.color.rgb}>
      <Flex flexFlow={'column'} gap={2}>
        <Center flexFlow="column" gap={2}>
          <Link href={item.findAt.restockShop ?? ''} isExternal>
            <Image
              src={`https://images.neopets.com/shopkeepers/w${
                categoryToShopID[item.category.toLowerCase()]
              }.gif`}
              alt={item.name}
              maxH={'95px'}
            />
          </Link>
          {specialDay === 'hpd' && <Tag colorScheme={'green'}>Half Price Day - 50% off</Tag>}
          {specialDay === 'tyrannia' && (
            <Tag colorScheme={'orange'}>Tyrannian Victory Day - 80% off</Tag>
          )}
          {specialDay === 'usukicon' && <Tag colorScheme={'pink'}>Usuki Day - 66.6% off</Tag>}
          {specialDay === 'festival' && <Tag colorScheme={'purple'}>Faerie Festival - 50% off</Tag>}
          {specialDay === 'halloween' && <Tag colorScheme={'orange'}>Halloween - 50% off</Tag>}
        </Center>
        <HStack>
          <Tag size="md" fontWeight="bold" as="h3">
            Est. Profit
          </Tag>
          <Text flex="1" fontSize="xs" textAlign="right">
            {!item.price.value && '???'}
            {item.price.value && <>{intl.format(item.price.value - restockPrice[0])} NP</>}
          </Text>
        </HStack>
        <HStack>
          <Tag size="md" fontWeight="bold" as="h3">
            Restock Price
          </Tag>
          <Text flex="1" fontSize="xs" textAlign="right">
            {intl.format(restockPrice[0])} NP{' '}
            {restockPrice[0] !== restockPrice[1] ? `- ${intl.format(restockPrice[1])} NP` : ''}
          </Text>
        </HStack>
        <HStack>
          <Tag size="md" fontWeight="bold" as="h3">
            Latest Restock
          </Tag>
          <Text flex="1" fontSize="xs" textAlign="right">
            {lastSeen?.restock && (
              <>
                {new Date(lastSeen?.restock).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                })}
              </>
            )}
            {!lastSeen?.restock && '???'}
          </Text>
        </HStack>
      </Flex>
    </CardBase>
  );
};

export default ItemRestock;
