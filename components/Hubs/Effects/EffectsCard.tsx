import {
  Badge,
  Box,
  Divider,
  Flex,
  HStack,
  Icon,
  Text,
  Tooltip,
  useMediaQuery,
  Link,
} from '@chakra-ui/react';
import { ItemData, ItemEffect } from '../../../types';
import Image from 'next/image';
import { AiFillWarning } from 'react-icons/ai';
import { useFormatter, useTranslations } from 'next-intl';
import { EffectText, EffectTypes } from '../../Items/ItemEffectsCard';
import Color from 'color';
import ItemCtxMenu, { CtxTrigger } from '../../Menus/ItemCtxMenu';
import MainLink from '../../Utils/MainLink';
import { ItemImage } from '@components/Items/ItemCard';

type EffectsCardProps = {
  item: ItemData & { effects?: ItemEffect[] };
  uniqueID: string;
};

export const EffectsCard = (props: EffectsCardProps) => {
  const t = useTranslations();
  const format = useFormatter();
  const { item } = props;
  const color = Color(item.color.hex);
  const rgb = color.rgb().array();
  const [isMobile] = useMediaQuery('(hover: none)');

  return (
    <Flex
      p={2}
      w={400}
      bg="gray.700"
      boxShadow={'lg'}
      bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]},${rgb[1]}, ${rgb[2]},.45) 0%)`}
      borderRadius={'md'}
      flexFlow={'column'}
    >
      <ItemCtxMenu menuId={props.uniqueID + item.internal_id.toString()} item={item} />
      <CtxTrigger
        id={props.uniqueID + item.internal_id.toString()}
        //@ts-ignore
        disableWhileShiftPressed
        disable={isMobile ? true : undefined}
      >
        <Link
          as={MainLink}
          prefetch={false}
          href={'/item/' + (item.slug ?? item.internal_id)}
          _hover={{ textDecoration: 'none' }}
          color="white"
        >
          <Flex gap={2}>
            <Box w="50px" h="50px">
              <ItemImage item={item} width={50} height={50} />
            </Box>
            <Flex flexFlow={'column'} gap={1}>
              <Text fontSize={'sm'}>{item.name}</Text>
              <Flex gap={1}>
                {item.status === 'no trade' && <Badge fontSize={'xs'}>No Trade</Badge>}

                {item.price.value && !item.price.inflated && (
                  <Badge whiteSpace="normal">{format.number(item.price.value)} NP</Badge>
                )}

                {item.price.value && item.price.inflated && (
                  <Tooltip
                    label={t('General.inflation')}
                    aria-label="Inflation Tooltip"
                    placement="top"
                  >
                    <Badge colorScheme="red" whiteSpace="normal">
                      <Icon as={AiFillWarning} verticalAlign="middle" />{' '}
                      {format.number(item.price.value)} NP
                    </Badge>
                  </Tooltip>
                )}

                {item.isNC && <Badge colorScheme="purple">NC</Badge>}

                {item.type === 'pb' && <Badge colorScheme="yellow">PB</Badge>}
              </Flex>
            </Flex>
          </Flex>
        </Link>
      </CtxTrigger>
      {item.effects && item.effects.length > 0 && (
        <>
          <Divider my={3} />
          <Flex flexFlow={'column'} gap={2} sx={{ a: { color: color.lightness(70).hex() } }}>
            {item.effects.map((effect) => (
              <HStack
                key={effect.internal_id}
                gap={2}
                bg="blackAlpha.300"
                p={1}
                borderRadius={'md'}
              >
                <Box w={'20px'} h="20px" flex="0 0 auto" overflow={'hidden'} borderRadius={'sm'}>
                  <Image
                    width={20}
                    height={20}
                    src={EffectTypes[effect.type].img}
                    alt={effect.name}
                    quality={100}
                  />
                </Box>
                <Text
                  fontSize="xs"
                  color="whiteAlpha.800"
                  sx={{ 'b, strong': { color: 'white' } }}
                  as="div"
                >
                  <EffectText effect={effect} />
                </Text>
              </HStack>
            ))}
          </Flex>
        </>
      )}
    </Flex>
  );
};
