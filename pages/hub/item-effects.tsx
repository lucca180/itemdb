import {
  Box,
  Center,
  Heading,
  Image,
  Divider,
  Text,
  Button,
  Spinner,
  VStack,
  Select,
} from '@chakra-ui/react';
import Layout from '../../components/Layout';
import { createTranslator, useTranslations } from 'next-intl';
import Color from 'color';
import { ReactElement, useEffect, useState } from 'react';
import axios from 'axios';
import { ItemData, ItemEffect } from '../../types';
import { EffectsCard } from '../../components/Hubs/Effects/EffectsCard';
import { loadTranslation } from '@utils/load-translation';

const LIMIT_PER_PAGE = 18;

const statsType = [
  'Max HP',
  'Strength',
  'Level',
  'Defence',
  'Movement',
  'Intelligence',
  'Weight',
  'Height',
];

const ItemEffectPage = () => {
  const t = useTranslations();
  const color = Color('#f86dba').rgb().array();
  const [field, setField] = useState('stats');
  const [items, setItems] = useState<(ItemData & { effects: ItemEffect[] })[]>([]);
  const [statsName, setStatsName] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    // setPage(1);
    init(1);
  }, []);

  useEffect(() => {
    setPage(1);
    init(1);
  }, [field, statsName]);

  useEffect(() => {
    init(page);
  }, [page]);

  const init = async (newPage: number) => {
    setIsLoading(true);
    const res = await axios.get(`/api/v1/items/effects`, {
      params: {
        field: field,
        page: newPage ?? page,
        limit: LIMIT_PER_PAGE,
        name: field === 'stats' && statsName !== 'all' ? statsName : undefined,
      },
    });
    setItems(res.data);
    setIsLoading(false);
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
      <Center my={6} flexFlow="column" gap={2} textAlign={'center'}>
        <Box h="175px" overflow={'hidden'} borderRadius="md" boxShadow={'md'}>
          <Image
            w={400}
            h={175}
            objectPosition={'bottom'}
            objectFit={'cover'}
            src="https://images.neopets.com/games/new_tradingcards/lg_scorchio_day_2006.gif"
            alt="Item Effects Hub Thumbnail"
          />
        </Box>
        <Heading as="h1">{t('ItemEffects.item-effect-hub')}</Heading>
        <Text>{t('ItemEffects.cta')}</Text>
      </Center>
      <Divider my={3} />
      <Center gap={3} flexWrap={'wrap'}>
        <TypeButton field="stats" selectedField={field} setField={setField} disabled={isLoading}>
          {t('ItemEffects.stats-change')}
        </TypeButton>
        <TypeButton field="disease" selectedField={field} setField={setField} disabled={isLoading}>
          {t('ItemEffects.disease')}
        </TypeButton>
        <TypeButton
          field="cureDisease"
          selectedField={field}
          setField={setField}
          disabled={isLoading}
        >
          {t('ItemEffects.cure-disease')}
        </TypeButton>
        <TypeButton field="heal" selectedField={field} setField={setField} disabled={isLoading}>
          {t('ItemEffects.heal-hp')}
        </TypeButton>
        <TypeButton
          field="colorSpecies"
          selectedField={field}
          setField={setField}
          disabled={isLoading}
        >
          {t('ItemEffects.color-species-change')}
        </TypeButton>
        <TypeButton field="other" selectedField={field} setField={setField} disabled={isLoading}>
          {t('ItemEffects.other')}
        </TypeButton>
      </Center>
      {field === 'stats' && (
        <Center mt={3}>
          <Select
            maxW={200}
            size="sm"
            variant={'filled'}
            colorScheme="pink"
            onChange={(e) => setStatsName(e.target.value)}
          >
            <option value="all">All Stats</option>
            {statsType.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Center>
      )}
      <Center alignItems={'stretch'} flexWrap={'wrap'} gap={3} mt={3}>
        {!isLoading && items.map((item) => <EffectsCard key={item.internal_id} item={item} />)}
        {!isLoading && items.length === 0 && (
          <VStack>
            <Text>{t('ItemEffects.empty-msg')}</Text>
          </VStack>
        )}
        {isLoading && <Spinner />}
      </Center>
      <Center mt={5} gap={3}>
        {!isLoading && (
          <Button isDisabled={page <= 1} onClick={() => setPage(page - 1)}>
            {t('MissingHub.prev-page')}
          </Button>
        )}
        {!isLoading && (
          <Button
            isDisabled={!items.length || items.length < LIMIT_PER_PAGE}
            onClick={() => setPage(page + 1)}
          >
            {t('MissingHub.next-page')}
          </Button>
        )}
      </Center>
    </>
  );
};

export default ItemEffectPage;

export async function getStaticProps(context: any) {
  return {
    props: {
      messages: await loadTranslation(context.locale as string, 'hub/item-effects'),
      locale: context.locale,
    },
  };
}

ItemEffectPage.getLayout = function getLayout(page: ReactElement, props: any) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });
  return (
    <Layout
      SEO={{
        title: t('ItemEffects.item-effect-hub'),
        description: t('ItemEffects.cta'),
        themeColor: '#f86dba',
      }}
      mainColor="rgba(248, 109, 186, 0.4)"
    >
      {page}
    </Layout>
  );
};

type TypeButtonProps = {
  selectedField: string;
  field: string;
  setField: (type: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
};

const TypeButton = ({ selectedField, field, setField, children, disabled }: TypeButtonProps) => {
  return (
    <Button
      size="sm"
      onClick={() => setField(field)}
      colorScheme={selectedField === field ? 'pink' : undefined}
      isDisabled={disabled}
    >
      {children}
    </Button>
  );
};
