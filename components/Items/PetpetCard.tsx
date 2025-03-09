import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Center,
  Flex,
  Text,
} from '@chakra-ui/react';
import React from 'react';
import { ItemData, ItemPetpetData } from '../../types';
import CardBase from '../Card/CardBase';
import ItemCard from './ItemCard';
import { useTranslations } from 'next-intl';
import { IconLink } from '../Utils/IconLink';
import Color from 'color';

type Props = {
  item: ItemData;
  petpetData: ItemPetpetData;
};

const PetpetCard = (props: Props) => {
  const t = useTranslations();
  const { item, petpetData } = props;
  const color = Color(item.color.hex);

  return (
    <CardBase title={t('ItemPage.petpet-puddle')} color={item.color.hex}>
      <Flex gap={3} wrap="wrap" alignItems="center" flexFlow={'column'}>
        {petpetData.isUnpaintable && (
          <Text fontSize={'sm'} textAlign={'center'}>
            {t('ItemPage.unpaintable-p2')}
          </Text>
        )}
        {petpetData.isCanonical && (
          <Text fontSize={'sm'} textAlign={'center'}>
            {t.rich('ItemPage.color-is-base-color', {
              b: (chunk) => <b>{chunk}</b>,
              color: petpetData.color.name,
              species: petpetData.species.name,
            })}

            <br />
            {!petpetData.isUnpaintable &&
              t.rich('ItemPage.p2-p2-at-puddle', {
                b: (chunk) => <b>{chunk}</b>,
                Link: (chunk) => (
                  <IconLink
                    href={`https://www.neopets.com/pool/petpet_colors.phtml?f_species=${petpetData.species.id}`}
                    isExternal
                    color={color.lightness(70).hex()}
                  >
                    {chunk}
                  </IconLink>
                ),
              })}
          </Text>
        )}
        {petpetData.cheapest && (
          <>
            <Text fontSize={'sm'} textAlign={'center'}>
              {t('ItemPage.cheapest-way-to-get-this-petpet')}
            </Text>
            <Flex
              minW={'50%'}
              wrap="wrap"
              gap={2}
              justifyContent={'center'}
              bg="blackAlpha.600"
              p={3}
              borderRadius={'md'}
            >
              {petpetData.cheapest.items.map((i, index) => (
                <>
                  <ItemCard uniqueID={'cheapest'} key={i.internal_id} item={i} small />
                  {index + 1 < petpetData.cheapest!.items.length && <Center>+</Center>}
                </>
              ))}
            </Flex>
          </>
        )}
        {petpetData.toCanonical && (
          <>
            <Text fontSize={'sm'} textAlign={'center'}>
              {t.rich('ItemPage.p2-paint-base-color', {
                name: petpetData.toCanonical.pb.name,
                b: (chunk) => <b>{chunk}</b>,
                Link: (chunk) => (
                  <IconLink
                    href="https://www.neopets.com/pool/puddle.phtml"
                    isExternal
                    color={color.lightness(70).hex()}
                  >
                    {chunk}
                  </IconLink>
                ),
              })}
            </Text>
            <Flex
              minW={'50%'}
              wrap="wrap"
              gap={2}
              alignItems="stretch"
              justifyContent={'center'}
              bg="blackAlpha.600"
              p={3}
              borderRadius={'md'}
            >
              <ItemCard uniqueID={'toCanonical'} item={petpetData.petpet} small />
              <Center>+</Center>
              <ItemCard uniqueID={'toCanonical'} item={petpetData.toCanonical.pb} small />
              <Center>=</Center>
              <ItemCard uniqueID={'toCanonical'} item={petpetData.toCanonical.p2} small />
            </Flex>
          </>
        )}
        {petpetData.alternativeWays && !!petpetData.alternativeWays.length && (
          <>
            <Accordion allowToggle minW={'70%'} variant={'filled'}>
              <AccordionItem bg="blackAlpha.300">
                <AccordionButton>
                  <Box as="span" flex="1" fontSize={'sm'} textAlign="left">
                    {t('ItemPage.other-ways-of-getting-this-petpet')}
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <Flex flexFlow={'column'} gap={5}>
                    {petpetData.alternativeWays.map((way, i) => (
                      <Flex
                        key={i}
                        minW={'50%'}
                        wrap="wrap"
                        gap={2}
                        justifyContent={'center'}
                        bg="blackAlpha.600"
                        p={3}
                        borderRadius={'md'}
                      >
                        {way.map((i, index) => (
                          <>
                            <ItemCard
                              uniqueID={'alternatives_' + i}
                              key={i.internal_id}
                              item={i}
                              small
                            />
                            {index + 1 < way.length && <Center>+</Center>}
                          </>
                        ))}
                      </Flex>
                    ))}
                  </Flex>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </>
        )}
      </Flex>
    </CardBase>
  );
};

export default PetpetCard;
