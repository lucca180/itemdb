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
import Layout from '../../components/Layout';
import { FeedbackModalProps } from '../../components/Modal/FeedbackModal';
import { useTranslations } from 'next-intl';
import NextImage from 'next/image';
import PetColorImg from '../../public/pet-color-hub.png';
import { allNeopetsColors, allSpecies, getPetColorId, getSpeciesId } from '../../utils/utils';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ItemData } from '../../types';
import ItemCard from '../../components/Items/ItemCard';
import { useRouter } from 'next/router';
import { FaShareAlt } from 'react-icons/fa';

const FeedbackModal = dynamic<FeedbackModalProps>(
  () => import('../../components/Modal/FeedbackModal'),
);

type PetColorData = {
  colorId?: number;
  speciesId?: number;
  speciesName?: string;
  colorName?: string;
  thumbnail: {
    species: string;
    color: string;
  };
  perfectMatch: ItemData[];
  colorChanges: ItemData[];
  speciesChanges: ItemData[];
  cheapestChange: ItemData[];
};

const PetColorToolPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const toast = useToast();
  const [species, setSpecies] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [petColorData, setPetColorData] = useState<PetColorData | null>(null);
  const [error, setError] = useState<string>('');
  const [isImgLoading, setIsImgLoading] = useState<boolean>(false);

  const isPerfectCheapest = useMemo(() => {
    if (!petColorData) return false;
    const perfectMatchIds = petColorData.perfectMatch.map((item) => item.internal_id);
    const cheapestChangeIds = petColorData.cheapestChange.map((item) => item.internal_id);

    return cheapestChangeIds.every((id) => perfectMatchIds.includes(id));
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
    const query = router.query;
    let hasChanged = false;

    let newSpecies;
    let newColor;

    if (query.species) {
      newSpecies = allSpecies[getSpeciesId(query.species as string) ?? ''];
      if (newSpecies && newSpecies !== species) {
        setSpecies(newSpecies);
        hasChanged = true;
      }
    }
    if (query.color) {
      newColor = allNeopetsColors[getPetColorId(query.color as string) ?? ''];
      if (newColor && newColor !== color) {
        setColor(newColor);
        hasChanged = true;
      }
    }

    if (hasChanged) doSearch(newSpecies, newColor);
  };

  const changeRoute = () => {
    const speciesQuery = species ? `species=${species.toLowerCase()}` : '';
    const colorQuery = color ? `color=${color.toLowerCase()}` : '';

    router.push(router.pathname + `?${speciesQuery}&${colorQuery}`, undefined, {
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
    <Layout
      SEO={{
        title: t('PetColors.pet-color-tool'),
        description: t('PetColors.cta'),
        themeColor: '#745fb3',
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
      mainColor="#745fb3c7"
    >
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(154, 122, 237, 0.7) 70%)`}
        zIndex={-1}
      />
      <FeedbackModal isOpen={isOpen} onClose={onClose} />
      <Center mt={8} flexFlow="column" gap={2} textAlign="center">
        <Box
          as={NextImage}
          src={PetColorImg}
          // w={600}
          // height={200}
          objectFit={'cover'}
          borderRadius={'md'}
          boxShadow={'md'}
          alt="happy zafara painting a picture"
        />
        <Heading>{t('PetColors.pet-color-tool')}</Heading>
        <Text maxW={'700px'} textAlign={'center'} sx={{ textWrap: 'pretty' }}>
          {t('PetColors.cta')}
        </Text>
        <Text size="sm" color="red.300">
          {error}
        </Text>
        <HStack mt={3} flexWrap={{ base: 'wrap', sm: 'initial' }}>
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
            <IconButton
              onClick={copyLink}
              bg="blackAlpha.300"
              size="sm"
              aria-label={t('Layout.copy-link')}
              icon={
                <Tooltip hasArrow label={t('Layout.copy-link')} placement="top">
                  <span>
                    <FaShareAlt />
                  </span>
                </Tooltip>
              }
            />
            <Flex gap={3} flexWrap={'wrap'} justifyContent={'center'}>
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
                      <ItemCard small key={item.internal_id} item={item} />
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
                      <ItemCard small key={item.internal_id} item={item} />
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
                        <ItemCard small key={item.internal_id} item={item} />
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
                      <ItemCard small key={item.internal_id} item={item} />
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
    </Layout>
  );
};

export default PetColorToolPage;

export async function getStaticProps(context: any) {
  return {
    props: {
      messages: (await import(`../../translation/${context.locale}.json`)).default,
    },
  };
}
