import { Box, Center, Heading, Divider, Text, Flex, Select, Link } from '@chakra-ui/react';
import Layout from '@components/Layout';
import { createTranslator, useTranslations } from 'next-intl';
import Color from 'color';
import { ReactElement } from 'react';
import ItemCard from '@components/Items/ItemCard';
import { ItemData } from '@types';
import { getSpeciesOutfits } from '../../api/v1/tools/outfits';
import Image from '@components/Utils/Image';
import { allSpecies, getSpeciesId } from '@utils/pet-utils';
import { useRouter } from 'next/router';
import { SkeletonImage } from '@components/Utils/SkeletonImage';
import NextLink from 'next/link';
import { loadTranslation } from '@utils/load-translation';

type OutfitPageProps = {
  outfits: { [key: string]: ItemData[] };
  species: string;
};

const OutfitPage = (props: OutfitPageProps) => {
  const { outfits, species } = props;
  const t = useTranslations();
  const router = useRouter();
  const color = Color('#94aefa').rgb().array();

  const changeSpecies = (selectedSpecies: string) => {
    if (selectedSpecies === '') return;
    router.push(`/hub/outfits/${selectedSpecies.toLowerCase()}`);
  };

  return (
    <>
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${color[0]},${color[1]},${color[2]},.7) 70%)`}
        zIndex={-1}
      />
      <Center my={6} flexFlow="column" gap={2}>
        <NavArrows species={species} />
        <Image
          borderRadius="md"
          boxShadow={'md'}
          width={'600'}
          height={'200'}
          quality={90}
          w={'100%'}
          maxW={'600px'}
          h="auto"
          priority
          src="https://images.neopets.com/ncmall/shopkeepers/cashshop_fashionshow.png"
          alt={t('OutfitPage.exclusive-clothes-guide')}
        />
        <Heading as="h1" fontWeight={'bold'} textAlign="center" color="white">
          {t('OutfitPage.exclusive-species-clothes', {
            species,
          })}
        </Heading>
        <Text maxW="900px" textAlign={'center'}>
          {t('OutfitPage.description', { specie: species })}
        </Text>
        <Select
          mt={3}
          variant="filled"
          minW={175}
          maxW={200}
          bg={'blackAlpha.400'}
          size="sm"
          onChange={(e) => changeSpecies(e.target.value)}
          value={species}
        >
          <option value="">{t('PetColors.select-species')}</option>
          {Object.values(allSpecies)
            .sort()
            .map((species) => (
              <option key={species} value={species}>
                {species}
              </option>
            ))}
        </Select>
      </Center>
      <Divider my={3} />
      <Flex flexFlow={'column'} alignItems="center" gap={7} mt={5}>
        {Object.entries(outfits).map(([line, outfit], i) => {
          return (
            <Flex
              flexFlow="column"
              gap={3}
              bg={'blackAlpha.600'}
              p={2}
              borderRadius="lg"
              key={i}
              w={{ base: '100%', lg: '900px' }}
              alignItems={'center'}
              py={5}
            >
              <Text as="h2" textTransform={'capitalize'} fontWeight={'bold'} mb={3} fontSize={'lg'}>
                {line}
              </Text>
              <Flex
                gap={3}
                flexFlow={{ base: 'column', md: 'row' }}
                justifyContent={'center'}
                alignItems={'center'}
              >
                <Flex flexFlow={'column'}>
                  <SkeletonImage
                    url={getPreviewUrl(outfit)}
                    loadkey={line}
                    width={300}
                    height={300}
                  />
                </Flex>

                <Flex flexWrap={'wrap'} justifyContent={'center'} gap={2} flex={1}>
                  {outfit.map((item) => (
                    <ItemCard key={item.internal_id} item={item} />
                  ))}
                </Flex>
              </Flex>
            </Flex>
          );
        })}
        <Text fontSize={'xs'} textAlign={'center'} color="whiteAlpha.500">
          Outfit previews powered by Dress to Impress
        </Text>
      </Flex>
    </>
  );
};

export default OutfitPage;

export async function getStaticPaths() {
  const paths = Object.values(allSpecies)
    .splice(0, 5)
    .map((species) => ({
      params: { species: species.toLowerCase() },
    }));

  return { paths, fallback: 'blocking' };
}

export async function getStaticProps(context: any) {
  const outfits = await getSpeciesOutfits(context.params.species);
  return {
    props: {
      outfits,
      species: capitalize(context.params.species),
      messages: await loadTranslation(context.locale as string, 'hub/outfits/[species]'),
      locale: context.locale,
    },
    revalidate: 600,
  };
}

OutfitPage.getLayout = function getLayout(page: ReactElement, props: any) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });

  const canonical =
    props.locale === 'en'
      ? `https://itemdb.com.br/hub/outfits/${props.species.toLowerCase()}`
      : `https://itemdb.com.br/${props.locale}/hub/outfits/${props.species.toLowerCase()}`;

  return (
    <Layout
      SEO={{
        canonical: canonical,
        title: t('OutfitPage.exclusive-species-clothes', {
          species: props.species,
        }),
        twitter: {
          cardType: 'summary_large_image',
        },
        openGraph: {
          images: [
            {
              url: 'https://images.neopets.com/ncmall/shopkeepers/cashshop_fashionshow.png',
              width: 600,
              height: 200,
              alt: t('OutfitPage.exclusive-clothes-guide'),
            },
          ],
        },
        description: t('OutfitPage.description', { specie: props.species }),
        themeColor: '#94aefa',
      }}
      mainColor="#94aefaca"
    >
      {page}
    </Layout>
  );
};

const getPreviewUrl = (items: ItemData[]) => {
  let url = '/api/cache/preview/outfit?';

  items.forEach((item) => {
    url += `iid[]=${item.internal_id}&`;
  });

  return url;
};

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

type NavArrowsProps = {
  species: string;
};

const NavArrows = (props: NavArrowsProps) => {
  const speciesId = getSpeciesId(props.species);

  if (!speciesId) return null;

  const nextSpecies = allSpecies[speciesId + 1] ?? allSpecies[1];
  const prevSpecies = allSpecies[speciesId - 1] ?? allSpecies[56];

  return (
    <Center gap={8} fontSize={'xs'}>
      <Link as={NextLink} href={`/hub/outfits/${prevSpecies.toLowerCase()}`}>
        ← {prevSpecies}
      </Link>
      <Link as={NextLink} href={`/hub/outfits/${nextSpecies.toLowerCase()}`}>
        {nextSpecies} →
      </Link>
    </Center>
  );
};
