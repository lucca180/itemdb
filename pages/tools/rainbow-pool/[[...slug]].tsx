import {
  Heading,
  Text,
  Center,
  Button,
  Icon,
  useDisclosure,
  Box,
  Flex,
  Select,
  HStack,
  Badge,
  Skeleton,
  Link,
  IconButton,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import { FiSend } from 'react-icons/fi';
import Layout from '../../../components/Layout';
import { FeedbackModalProps } from '../../../components/Modal/FeedbackModal';
import { createTranslator, useFormatter, useTranslations } from 'next-intl';
import NextImage from 'next/image';
import {
  allNeopetsColors,
  allSpecies,
  getPetColorId,
  getSpeciesId,
} from '../../../utils/pet-utils';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ItemData } from '../../../types';
import ItemCard from '../../../components/Items/ItemCard';
import { useRouter } from 'next/router';
import { FaShareAlt } from 'react-icons/fa';
import Image from '../../../components/Utils/Image';
import { getPetColorDataStr } from '../../api/v1/tools/petcolors';
import { IconLink } from '../../../components/Utils/IconLink';
import { PoolBreadcrumbs } from '../../../components/Breadcrumbs/PoolBreadcrumbs';
import { loadTranslation } from '@utils/load-translation';

const FeedbackModal = dynamic<FeedbackModalProps>(
  () => import('../../../components/Modal/FeedbackModal')
);

export type PetColorData = {
  colorId?: number | null;
  speciesId?: number | null;
  speciesName?: string | null;
  colorName?: string | null;
  thumbnail: {
    species: string;
    color: string;
  };
  perfectMatch: ItemData[];
  colorChanges: ItemData[];
  speciesChanges: ItemData[];
  cheapestChange: ItemData[];
};

type SpeciesInfo = {
  name: string;
  img: string;
  mt: string | null;
  limited: boolean;
  restricted: boolean;
  petDate: string;
};

type PetColorToolPageProps = {
  messages: any;
  locale: string;
  species: string;
  color: string;
  petColorData: PetColorData | null;
  speciesInfo: SpeciesInfo | null;
};

const PetColorToolPage = (props: PetColorToolPageProps) => {
  const t = useTranslations();
  const router = useRouter();
  const toast = useToast();
  const [species, setSpecies] = useState<string>(props.species);
  const [color, setColor] = useState<string>(props.color);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [petColorData, setPetColorData] = useState<PetColorData | null>(props.petColorData);
  const [error, setError] = useState<string>('');
  const [isImgLoading, setIsImgLoading] = useState<boolean>(false);
  const [speciesInfo, setSpeciesInfo] = useState<SpeciesInfo | null>(props.speciesInfo);

  const isPerfectCheapest = useMemo(() => {
    if (!petColorData) return false;
    const perfectMatchIds = petColorData.perfectMatch.map((item) => item.internal_id);
    const cheapestChangeIds = petColorData.cheapestChange.map((item) => item.internal_id);

    return cheapestChangeIds.every((id) => perfectMatchIds.includes(id));
  }, [petColorData]);

  const title = useMemo(() => {
    if (!petColorData?.speciesName && !petColorData?.colorName) return '';

    if (petColorData?.speciesName && !petColorData?.colorName) {
      return `${t('PetColors.species-title', { 0: petColorData?.speciesName })}`;
    }

    if (!petColorData?.speciesName && petColorData?.colorName) {
      return `${t('PetColors.how-to-get-title', { 0: color })}`;
    }

    if (petColorData?.speciesName && petColorData?.colorName) {
      return `${t('PetColors.species-color-title', {
        0: petColorData?.colorName,
        1: petColorData?.speciesName,
      })}`;
    }
  }, [petColorData]);

  useEffect(() => {
    setError('');
  }, [species, color]);

  useEffect(() => {
    parseRoute();
  }, [router.query]);

  const doSearch = async (newSpecies?: string, newColor?: string) => {
    try {
      setIsLoading(true);
      setPetColorData(null);
      setIsImgLoading(true);
      const res = await axios.get(`/api/v1/tools/petcolors`, {
        params: {
          speciesTarget: newSpecies ?? species,
          colorTarget: newColor ?? color,
        },
      });

      if (!newSpecies && !newColor) changeRoute();

      if (newSpecies || species) {
        const speciesInfo = await getSpeciesInfo(newSpecies ?? species);
        setSpeciesInfo(speciesInfo);
      } else setSpeciesInfo(null);

      setPetColorData(res.data);
      setIsLoading(false);
    } catch (e: any) {
      if (e.response && e.response.data.error === 'pet_color_not_found') {
        setError(t('PetColors.combination-error'));
      }
      setIsLoading(false);
    }
  };

  const parseRoute = () => {
    let querySpecies = '';
    let queryColor = '';

    const slugs = router.query.slug ?? [];

    if (slugs.length === 2) {
      querySpecies = slugs[0];
      queryColor = slugs[1];
    }

    if (slugs.length === 1) {
      if (getSpeciesId(slugs[0])) {
        querySpecies = slugs[0];
      } else {
        queryColor = slugs[0];
      }
    }

    let hasChanged = false;

    let newSpecies;
    let newColor;

    if (species) {
      newSpecies = allSpecies[getSpeciesId(querySpecies as string) ?? ''];
      if (newSpecies && newSpecies !== species) {
        setSpecies(newSpecies);
        hasChanged = true;
      }
    }
    if (color) {
      newColor = allNeopetsColors[getPetColorId(queryColor as string) ?? ''];
      if (newColor && newColor !== color) {
        setColor(newColor);
        hasChanged = true;
      }
    }

    if (!querySpecies && species) {
      newSpecies = '';
      setSpecies('');
      hasChanged = true;
    }

    if (!queryColor && color) {
      newColor = '';
      setColor('');
      hasChanged = true;
    }

    if (hasChanged) doSearch(newSpecies, newColor);
  };

  const changeRoute = () => {
    const speciesQuery = species ? `${species.toLowerCase()}/` : '';
    const colorQuery = color ? `${color.toLowerCase()}` : '';

    router.push('/tools/rainbow-pool' + `/${speciesQuery}${colorQuery}`, undefined, {
      shallow: true,
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}${router.asPath}`);

    toast({
      title: t('General.link-copied'),
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <>
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(117, 182, 164, 0.9) 70%)`}
        zIndex={-1}
      />
      <FeedbackModal isOpen={isOpen} onClose={onClose} />
      <Box mt={2}>
        <PoolBreadcrumbs petColorData={petColorData} />
      </Box>
      <Center mt={8} flexFlow="column" gap={2} textAlign="center">
        <Image
          src={'https://images.neopets.com/caption/caption_997.gif'}
          // w={600}
          width={400}
          height={200}
          objectFit={'cover'}
          borderRadius={'md'}
          boxShadow={'md'}
          quality={100}
          objectPosition={'top'}
          alt="happy zafara painting a picture"
        />
        <Heading as="h1">{t('PetColors.pet-color-tool')}</Heading>
        <Text maxW={'700px'} textAlign={'center'} sx={{ textWrap: 'pretty' }}>
          {t('PetColors.cta')}
        </Text>
        <Text size="sm" color="red.300">
          {error}
        </Text>
        <HStack mt={3} flexWrap={{ base: 'wrap', sm: 'initial' }}>
          <Select
            variant="filled"
            minW={150}
            bg={'blackAlpha.400'}
            size="sm"
            onChange={(e) => setColor(e.target.value)}
            value={color}
          >
            <option value="">{t('PetColors.select-color')}</option>
            {Object.values(allNeopetsColors)
              .sort()
              .map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
          </Select>
          <Select
            variant="filled"
            minW={175}
            bg={'blackAlpha.400'}
            size="sm"
            onChange={(e) => setSpecies(e.target.value)}
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
        </HStack>
        <Button
          size="sm"
          bg={'blackAlpha.400'}
          isDisabled={!color && !species}
          onClick={() => doSearch()}
          isLoading={isLoading}
        >
          {t('Search.search')}
        </Button>
        {petColorData && (
          <Flex
            flex={1}
            w="100%"
            h="100%"
            mt={8}
            gap={3}
            p={2}
            bg="blackAlpha.300"
            flexFlow={'column'}
            alignItems={'center'}
            justifyContent={'center'}
            borderRadius={'md'}
          >
            <HStack>
              <Heading fontSize="md" as="h2">
                {title}
              </Heading>
              <IconButton
                onClick={copyLink}
                data-umami-event="copy-link"
                bg="blackAlpha.300"
                size="xs"
                aria-label={t('Layout.copy-link')}
                icon={
                  <Tooltip hasArrow label={t('Layout.copy-link')} placement="top">
                    <span>
                      <FaShareAlt />
                    </span>
                  </Tooltip>
                }
              />
            </HStack>
            {speciesInfo && (
              <Text fontSize="sm">
                <SpeciesInfoText speciesInfo={speciesInfo} />
              </Text>
            )}
            <Flex gap={3} mt={3} flexWrap={'wrap'} justifyContent={'center'}>
              <Flex
                justifyContent={'center'}
                alignItems={'center'}
                borderRadius={'md'}
                bg={isImgLoading ? undefined : 'blackAlpha.400'}
              >
                <Skeleton isLoaded={!isImgLoading} borderRadius={'md'}>
                  <NextImage
                    src={`/api/cache/preview/color/${petColorData.thumbnail.species ?? ''}_${
                      petColorData.thumbnail.color ?? ''
                    }.png`}
                    width={'150'}
                    height={'150'}
                    alt={`${species} ${color}`}
                    unoptimized
                    onLoadStart={() => setIsImgLoading(true)}
                    onLoad={() => setIsImgLoading(false)}
                  />
                  <Text fontSize="xs">
                    {t('ItemPage.powered-by')}
                    <br />
                    <Link href="https://impress.openneo.net/" isExternal fontWeight="bold">
                      Dress To Impress
                    </Link>
                  </Text>
                </Skeleton>
              </Flex>
              {!!petColorData.perfectMatch.length && (
                <Flex
                  flexFlow={'column'}
                  // justifyContent={'center'}
                  gap={2}
                  alignItems={'center'}
                  bg="blackAlpha.400"
                  borderRadius={'md'}
                  p={3}
                >
                  <Badge colorScheme="green">{t('PetColors.perfect-match')}</Badge>
                  {isPerfectCheapest && (
                    <Badge colorScheme="orange">{t('PetColors.cheapest-way')}</Badge>
                  )}
                  <Flex flexWrap={'wrap'} gap={2} justifyContent={'center'} flex={1}>
                    {petColorData.perfectMatch.map((item) => (
                      <ItemCard uniqueID="perfect" small key={item.internal_id} item={item} />
                    ))}
                  </Flex>
                </Flex>
              )}
              {!!petColorData.cheapestChange.length && !isPerfectCheapest && (
                <Flex
                  flexFlow={'column'}
                  alignItems={'center'}
                  gap={2}
                  bg="blackAlpha.400"
                  borderRadius={'md'}
                  p={3}
                >
                  <Badge colorScheme="orange">{t('PetColors.cheapest-way')}</Badge>
                  <Flex flexWrap={'wrap'} gap={2} justifyContent={'center'} flex={1}>
                    {petColorData.cheapestChange.map((item) => (
                      <ItemCard uniqueID="cheapest" small key={item.internal_id} item={item} />
                    ))}
                  </Flex>
                </Flex>
              )}
              {!!petColorData.colorId && (
                <Flex
                  flexFlow={'column'}
                  alignItems={'center'}
                  gap={2}
                  bg="blackAlpha.400"
                  borderRadius={'md'}
                  p={3}
                >
                  <Badge colorScheme="blue">{t('PetColors.color-change')}</Badge>
                  {!!petColorData.colorChanges.length && (
                    <Flex flexWrap={'wrap'} gap={2} justifyContent={'center'} flex={1}>
                      {petColorData.colorChanges.map((item) => (
                        <ItemCard uniqueID="color" small key={item.internal_id} item={item} />
                      ))}
                    </Flex>
                  )}
                  {!petColorData.colorChanges.length && (
                    <Text fontSize={'xs'} maxW="200px" textAlign={'center'}>
                      {t('PetColors.no-color-1')}
                      <br />
                      <br />
                      {t('PetColors.no-color-2')}
                    </Text>
                  )}
                </Flex>
              )}
              {!!petColorData.speciesChanges.length && (
                <Flex
                  flexFlow={'column'}
                  alignItems={'center'}
                  gap={2}
                  bg="blackAlpha.400"
                  borderRadius={'md'}
                  p={3}
                >
                  <Badge colorScheme="purple">{t('PetColors.species-change')}</Badge>
                  <Flex flexWrap={'wrap'} gap={2} justifyContent={'center'} flex={1}>
                    {petColorData.speciesChanges.map((item) => (
                      <ItemCard uniqueID="species" small key={item.internal_id} item={item} />
                    ))}
                  </Flex>
                </Flex>
              )}
            </Flex>
          </Flex>
        )}
        <Button variant="outline" size="sm" onClick={onOpen} mt={5}>
          <Icon as={FiSend} mr={1} /> {t('Button.feedback')}
        </Button>
      </Center>
    </>
  );
};

export default PetColorToolPage;

export async function getStaticProps(context: any) {
  const slugs = context.params.slug ?? [];

  let species = '';
  let color = '';

  if (slugs.length === 2) {
    species = slugs[0];
    color = slugs[1];
  }

  if (slugs.length === 1) {
    if (getSpeciesId(slugs[0])) {
      species = slugs[0];
    } else {
      color = slugs[0];
    }
  }

  let preloadData: PetColorData | null = null;
  if (species || color) {
    preloadData = await getPetColorDataStr(color, species)
      .then((d) => d)
      .catch(() => null);

    if (!preloadData) {
      return {
        redirect: {
          destination: '/tools/rainbow-pool',
        },
      };
    }

    if (
      (species && preloadData.speciesName?.toLowerCase() !== species) ||
      (color && preloadData.colorName?.toLowerCase() !== color)
    ) {
      return {
        redirect: {
          destination: `/tools/rainbow-pool/${
            (preloadData.speciesName?.toLowerCase() ?? '') + '/'
          }${preloadData.colorName?.toLowerCase() ?? ''}`,
        },
      };
    }
  }

  let speciesInfo = null;

  if (species) speciesInfo = await getSpeciesInfo(species);

  return {
    props: {
      speciesInfo,
      species: preloadData ? preloadData.speciesName : '',
      color: preloadData ? preloadData.colorName : '',
      petColorData: preloadData,
      messages: await loadTranslation(context.locale as string, 'tools/rainbow-pool/[[...slug]]'),
      locale: context.locale,
    },
  };
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  };
}

PetColorToolPage.getLayout = function getLayout(page: ReactElement, props: any) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });

  let title = t('PetColors.pet-color-tool');
  let description = t('PetColors.cta');
  if (props.species && !props.color) {
    title = `${t('PetColors.species-title', { 0: props.species })} - ${title}`;
    description = `${t('PetColors.species-description', { 0: props.species })} - ${description}`;
  }

  if (!props.species && props.color) {
    title = `${t('PetColors.how-to-get-title', { 0: props.color })} - ${title}`;
    description = `${t('PetColors.paint-description', { 0: props.color })} - ${description}`;
  }

  if (props.species && props.color) {
    title = `${t('PetColors.species-color-title', {
      0: props.color,
      1: props.species,
    })} - ${title}`;
    description = `${t('PetColors.species-color-description', {
      0: props.color,
      1: props.species,
    })} - ${description}`;
  }

  return (
    <Layout
      SEO={{
        title: title,
        description: description,
        themeColor: '#75b6a4',
        twitter: {
          cardType: 'summary_large_image',
        },
        openGraph: {
          images: [
            {
              url: `https://itemdb.com.br/pet-color-hub.png`,
              width: 600,
              height: 200,
              alt: 'happy zafara painting a picture',
            },
          ],
        },
      }}
      mainColor="#75b6a48c"
    >
      {page}
    </Layout>
  );
};

type SpeciesInfoTextProps = {
  speciesInfo: SpeciesInfo;
};

const SpeciesInfoText = (props: SpeciesInfoTextProps) => {
  const { speciesInfo } = props;
  const formatter = useFormatter();
  const t = useTranslations();

  let textTag = 'species-info-default';

  if (speciesInfo.limited) {
    textTag = 'species-info-limited';
  }

  let link = '';
  if (speciesInfo.restricted) {
    if (speciesInfo.name === 'Grundo') textTag = 'species-info-grundo';
    if (speciesInfo.name === 'Krawk') {
      textTag = 'species-info-krawk';
      link = 'https://itemdb.com.br/search?s=&petpetSpecies[]=154';
    }
    if (speciesInfo.name === 'Draik') {
      textTag = 'species-info-draik';
      link = 'https://itemdb.com.br/search?s=draik%20egg&category[]=Medieval%20Food';
    }
  }

  return (
    <>
      {t.rich('PetColors.' + textTag, {
        b: (chunk) => <b>{chunk}</b>,
        species: speciesInfo.name,
        speciesDate: formatter.dateTime(convertDate(speciesInfo.petDate), {
          day: '2-digit',
          month: 'long',
        }),
        CreateLink: (chunk) => (
          <IconLink color="#9ee1cf" href="https://www.neopets.com/reg/page4.phtml" isExternal>
            {chunk}
          </IconLink>
        ),
        Link: (chunk) => (
          <IconLink color="#9ee1cf" href={link} isExternal>
            {chunk}
          </IconLink>
        ),
      })}
    </>
  );
};

// convert from dd-mm to date
function convertDate(dateString: string) {
  const [day, month] = dateString.split('-').map(Number);
  const year = new Date().getFullYear();
  return new Date(year, month - 1, day);
}

const getSpeciesInfo = async (species: string) => {
  let speciesInfo = null;
  const petData = (await import(`../../../utils/petDays.json`)).default;
  const petDataEntries = Object.entries(petData);
  const petDataFiltered = petDataEntries.find(
    ([, value]) => value.name.toLowerCase() === species.toLowerCase()
  );
  if (petDataFiltered) {
    speciesInfo = {
      ...petDataFiltered[1],
      petDate: petDataFiltered[0],
    };
  }

  return speciesInfo;
};
