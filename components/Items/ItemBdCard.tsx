import { Badge, Box, Button, Center, Flex, Text, useDisclosure } from '@chakra-ui/react';
import React, { useMemo } from 'react';
import { BDData, BDIconTypes, ItemData } from '../../types';
import CardBase from '../Card/CardBase';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useAuth } from '@utils/auth';

const EditBdInfoModal = dynamic(() => import('@components/Modal/EditBdInfoModal'));
const Markdown = dynamic(() => import('@components/Utils/Markdown'));
type Props = {
  item: ItemData;
  bdData?: BDData;
};

const iconColorScheme = {
  air: 'blue',
  darkness: 'purple',
  dark: 'purple',
  water: 'cyan',
  earth: 'green',
  fire: 'orange',
  light: 'yellow',
  physical: 'gray',
  hp: 'red',
  freeze: 'cyan',
} as const;

const ItemBdCard = (props: Props) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { item, bdData } = props;
  const color = item.color.rgb;
  const { isOpen, onOpen, onClose } = useDisclosure();

  if (!bdData) return null;
  if (bdData.processing && !user?.isAdmin) return null;

  return (
    <>
      {isOpen && <EditBdInfoModal isOpen={isOpen} onClose={onClose} item={item} bdData={bdData} />}
      <CardBase title={t('General.battledome')} color={color}>
        <Flex
          gap={2}
          wrap="wrap"
          fontSize={'sm'}
          textAlign={'center'}
          alignItems="center"
          flexFlow={'column'}
          justifyContent={'center'}
        >
          {bdData.attack && (
            <BDSection title={t('General.attack')}>
              {bdData.attack.map(({ type, value }, index) => (
                <BDBadge key={index} iconType={type as BDIconTypes} value={value} reverse />
              ))}
            </BDSection>
          )}

          {bdData.defense && (
            <BDSection title={t('General.defense')}>
              {bdData.defense.map(({ type, value }, index) => (
                <BDBadge
                  key={index}
                  iconType={type as BDIconTypes}
                  value={value}
                  reverse
                  isDefend
                />
              ))}
            </BDSection>
          )}

          {bdData.reflect && (
            <BDSection title={t('General.reflect')}>
              {bdData.reflect.map(({ type, value }, index) => (
                <BDBadge key={index} iconType={type as BDIconTypes} value={value} reverse />
              ))}
            </BDSection>
          )}

          {bdData.other && (
            <BDSection title={t('General.others')}>
              {Object.entries(bdData.other).map(([key, value]) => (
                <BDBadge key={key} iconType={key as BDIconTypes} value={value} />
              ))}
            </BDSection>
          )}

          {bdData.notes && (
            <BDSection title={t('ItemPage.notes')}>
              <Text fontSize="xs">
                <Markdown>{bdData.notes}</Markdown>
              </Text>
            </BDSection>
          )}
        </Flex>
        {user?.isAdmin && (
          <Center>
            <Button size="xs" mt={3} onClick={onOpen}>
              {bdData.processing ? 'Manual Check BD Info' : 'Edit'}
            </Button>
          </Center>
        )}
      </CardBase>
    </>
  );
};

export default ItemBdCard;

type BDBadgeProps = {
  iconType: BDIconTypes;
  value: string | number;
  isDefend?: boolean;
  reverse?: boolean;
};

const BDBadge = (props: BDBadgeProps) => {
  const { iconType, value, isDefend, reverse = false } = props;
  return (
    <Badge
      display={'inline-flex'}
      alignItems="center"
      gap={1}
      fontSize={'xs'}
      textTransform={'none'}
      colorScheme={iconColorScheme[iconType]}
      flexFlow={reverse ? 'row-reverse' : 'row'}
    >
      <BDIcon type={iconType} isDefend={isDefend} />
      {isNaN(Number(value)) ? value : `${value}`}
    </Badge>
  );
};

const BDIcon = (props: { type: string; isDefend?: boolean }) => {
  const { type, isDefend } = props;

  const iconData = useMemo(() => {
    if (type === 'freeze') {
      return {
        url: 'https://images.neopets.com/battledome/icons/snowflake_icon.gif',
        bgSize: '20px 20px',
        // pos: { x: 0, y: 0 },
      };
    }

    if (type === 'limit') {
      return {
        url: 'https://images.neopets.com/battledome/icons/equip_one.gif',
        pos: 'center',
        bgSize: '16px 16px',
      };
    }

    if (type === 'use') {
      return {
        url: '',
        pos: 'center',
        bgSize: '16px 16px',
      };
    }

    if (type === 'fragility') {
      return {
        url: 'https://images.neopets.com/themes/016_blu_e56fc/events/battle_reject.png',
        pos: 'center',
        bgSize: '16px 16px',
      };
    }

    const pos = getIconPosition(type as BDIconTypes, isDefend);

    return {
      url: 'https://images.neopets.com/bd2/ui/damage.png',
      pos: `${pos.x}px ${pos.y}px`,
      title: type === 'hp' ? 'Heal' : type.charAt(0).toUpperCase() + type.slice(1),
    };
  }, [type, isDefend]);

  if (!iconData.url) return null;

  return (
    <Box
      as="span"
      height={'20px'}
      width={'20px'}
      backgroundImage={`url(${iconData.url})`}
      backgroundPosition={iconData.pos}
      bgSize={iconData.bgSize}
      bgRepeat={'no-repeat'}
      display={'inline-block'}
      title={iconData.title}
    ></Box>
  );
};

const BDSection = (props: { title: string; children: React.ReactNode }) => {
  const { title, children } = props;
  return (
    <Flex
      flex="1"
      gap={2}
      w={'100%'}
      flexFlow={'column'}
      alignItems={'center'}
      bg="blackAlpha.400"
      p={2}
      borderRadius="lg"
    >
      <Text fontSize="sm" fontWeight="bold" as="h3">
        {title}
      </Text>
      <Flex flex="1" gap={1} flexWrap={'wrap'} justifyContent={'center'}>
        {children}
      </Flex>
    </Flex>
  );
};

function getIconPosition(type: BDIconTypes, isDefend = false) {
  const xMap = {
    air: 0,
    darkness: -20,
    dark: -20,
    earth: -40,
    fire: -60,
    light: -80,
    water: -101,
    hp: -119,
    physical: -140,
  } as const;

  const y = isDefend ? -20 : 0;

  if (!(type in xMap)) {
    throw new Error(`Invalid icon type: ${type}`);
  }

  return {
    x: xMap[type],
    y,
  };
}
