import { Flex, Link, Text, Image, Box, Badge } from '@chakra-ui/react';
import React from 'react';
import { ItemData, ItemEffect } from '../../types';
import CardBase from '../Card/CardBase';
import dynamic from 'next/dynamic';
import Color from 'color';
import { useLocale, useTranslations } from 'next-intl';
import { getDiseaseTranslation } from '../../utils/utils';
import NextImage from 'next/image';
import { getPetpetColorId } from '../../utils/pet-utils';

const Markdown = dynamic(() => import('../Utils/Markdown'));

type Props = {
  item: ItemData;
  effects: ItemEffect[];
};

const ItemEffectsCard = (props: Props) => {
  const t = useTranslations();
  const { item, effects } = props;
  const color = Color(item.color.hex);
  return (
    <CardBase title={t('ItemPage.item-effects')} color={color.hex()}>
      <Flex
        gap={3}
        flexFlow="row"
        justifyContent="center"
        flexWrap={'wrap'}
        sx={{ a: { color: color.lightness(70).hex() } }}
      >
        {effects.map((effect, i) => (
          <EffectCard key={i} effect={effect} />
        ))}
      </Flex>
    </CardBase>
  );
};

export default ItemEffectsCard;

export const EffectTypes = {
  disease: {
    name_en: 'Disease',
    name_pt: 'Doença',
    img: '/icons/effects-disease.gif',
  },
  cureDisease: {
    name_en: 'Cure',
    name_pt: 'Cura',
    img: '/icons/effects-cure.gif',
  },
  heal: {
    name_en: 'Heal',
    name_pt: 'Cura',
    img: '/icons/effects-health.png',
  },
  stats: {
    name_en: 'Stats Change',
    name_pt: 'Alteração de Stats',
    img: '/icons/effects-shield.png',
  },
  other: {
    name_en: 'Other',
    name_pt: 'Outro',
    img: '/icons/effects-other.gif',
  },
  colorSpecies: {
    name_en: 'Color/Species Change',
    name_pt: 'Troca de Cor/Espécie',
    img: '/icons/effects-color.png',
  },
  petpetColor: {
    name_en: 'Petpet Color Change',
    name_pt: 'Troca de Cor de Petpet',
    img: '/icons/effects-petpet-color.png',
  },
};

type EffectCardProps = {
  effect: ItemEffect;
};

export const EffectCard = (props: EffectCardProps) => {
  const effectType = props.effect.type;
  const locale = useLocale();
  //@ts-expect-error ts is dumb
  const name = EffectTypes[effectType][`name_${locale}`];
  return (
    <Flex
      py={2}
      px={3}
      bg="blackAlpha.500"
      flexFlow={'column'}
      mt="13px"
      w="200px"
      borderRadius={'md'}
      gap={1}
      boxShadow={'sm'}
    >
      <Flex mt="-20px" justifyContent={'center'}>
        <Flex width={'32px'} height={'32px'} bg="white" borderRadius={'lg'} overflow={'hidden'}>
          <NextImage
            width={32}
            height={32}
            src={EffectTypes[effectType].img}
            alt={name}
            quality={100}
          />
        </Flex>
      </Flex>
      <Text textAlign="center" fontSize="sm" fontWeight="bold">
        {name}
      </Text>
      <Text
        textAlign="center"
        fontSize="sm"
        color="whiteAlpha.800"
        sx={{ 'b, strong': { color: 'white' } }}
        as="div"
      >
        <EffectText effect={props.effect} />
      </Text>
    </Flex>
  );
};

type EffectTextProps = {
  effect: ItemEffect;
};

export const EffectText = (props: EffectTextProps) => {
  const {
    name,
    type,
    species,
    isChance,
    text,
    strVal,
    minVal,
    maxVal,
    speciesTarget,
    colorTarget,
  } = props.effect;
  const t = useTranslations();
  const locale = useLocale() as 'en' | 'pt';

  if (text) return <Markdown>{text}</Markdown>;

  return (
    <>
      {['disease', 'cureDisease'].includes(type) &&
        t.rich(`Effects.effects-${type === 'disease' ? 'disease' : 'cure-disease'}`, {
          b: (chunk) => <b>{chunk}</b>,
          Disease: () => (
            <Link href="https://www.neopets.com/hospital.phtml" whiteSpace={'pre'} isExternal>
              {getDiseaseTranslation(name, locale)}
              <NextImage
                src={'/icons/neopets.png'}
                width={16}
                height={16}
                style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.2rem' }}
                alt="link icon"
              />
            </Link>
          ),
          random: Boolean(isChance).toString(),
          species: species && species.length > 0 ? 'true' : 'false',
          Neopet: () => (
            <>
              {species?.map((a, i) => (
                <PetImage pet={a} key={a} comma={i !== species.length - 1} />
              ))}
            </>
          ),
        })}

      {['heal', 'stats'].includes(type) && (
        <>
          {t.rich(`Effects.effects-${type}`, {
            b: (chunk) => <b>{chunk}</b>,
            Name: () => <Badge>{name}</Badge>,
            minVal: minVal ?? 0,
            maxVal: maxVal ?? 0,
            StrVal: () => (strVal ? <b>{strVal}</b> : <></>),
            random: Boolean(isChance).toString(),
            species: species && species.length > 0 ? 'true' : 'false',
            Neopet: () => (
              <>
                {species?.map((a, i) => (
                  <PetImage pet={a} key={a} comma={i !== species.length - 1} />
                ))}
              </>
            ),
          })}
        </>
      )}
      {type === 'colorSpecies' && (
        <>
          {t.rich('Effects.effects-colorSpecies', {
            b: (chunk) => <b>{chunk}</b>,
            isAll: Boolean(!!speciesTarget && !!colorTarget).toString(),
            random: Boolean(isChance).toString(),
            species: species && species.length > 0 ? 'true' : 'false',
            TargetType: () => (
              <>
                {speciesTarget && !colorTarget && t('General.species')}
                {!speciesTarget && colorTarget && t('ItemPage.color')}
              </>
            ),
            Target1: () => (
              <>
                {colorTarget && (
                  <Link href={`/tools/rainbow-pool/${colorTarget.toLowerCase()}`} isExternal>
                    {colorTarget}
                  </Link>
                )}
              </>
            ),
            Target2: () => (
              <>
                {speciesTarget && (
                  <Link href={`/tools/rainbow-pool/${speciesTarget.toLowerCase()}`}>
                    {speciesTarget}
                  </Link>
                )}
              </>
            ),
            Neopet: () => (
              <>
                {species?.map((a, i) => (
                  <PetImage pet={a} key={a} comma={i !== species.length - 1} />
                ))}
              </>
            ),
          })}
        </>
      )}
      {type === 'petpetColor' && (
        <>
          {t.rich('Effects.effects-petpetColor', {
            b: (chunk) => <b>{chunk}</b>,
            random: Boolean(isChance).toString(),
            Target1: () => (
              <>
                {colorTarget && (
                  <Link
                    href={`/search?s=&petpetColor[]=${getPetpetColorId(
                      colorTarget
                    )}&p2OnlyPaintable=true`}
                  >
                    {colorTarget}
                  </Link>
                )}
              </>
            ),
          })}
        </>
      )}
    </>
  );
};

const PetImage = ({ pet, comma }: { pet: string; comma?: boolean }) => {
  return (
    <Box display={'inline'} textTransform={'capitalize'} whiteSpace={'pre'}>
      <b>{pet}</b>{' '}
      <Image
        verticalAlign={'sub'}
        display="inline"
        src={`https://images.neopets.com/community/hub/calendar/events/${pet.toLowerCase()}.png`}
        width={'18px'}
        height={'18px'}
        alt={pet}
      />
      {comma && ','}
    </Box>
  );
};
