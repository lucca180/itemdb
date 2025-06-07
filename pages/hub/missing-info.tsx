import {
  Box,
  Center,
  Heading,
  Image,
  Divider,
  Text,
  Link,
  Button,
  Spinner,
  VStack,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import Layout from '../../components/Layout';
import { createTranslator, useTranslations } from 'next-intl';
import Color from 'color';
import { ReactElement, useEffect, useState } from 'react';
import axios from 'axios';
import { ItemData } from '../../types';
import ItemCard from '../../components/Items/ItemCard';
import { loadTranslation } from '@utils/load-translation';

const NeedInfoPage = () => {
  const t = useTranslations();
  const color = Color('#f0fa94').rgb().array();
  const [field, setField] = useState('item_id');
  const [items, setItems] = useState<ItemData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    // setPage(1);
    init(1);
  }, []);

  useEffect(() => {
    setPage(1);
    init(1);
  }, [field]);

  useEffect(() => {
    init(page);
  }, [page]);

  const init = async (newPage: number) => {
    setIsLoading(true);
    const res = await axios.get(`/api/v1/items/missing?field=${field}&page=${newPage ?? page}`);
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
      <Center my={6} flexFlow="column" gap={2}>
        <Box h="175px" overflow={'hidden'} borderRadius="md" boxShadow={'md'}>
          <Image
            w={400}
            h={175}
            objectPosition={'0 -50px'}
            objectFit={'cover'}
            src="https://images.neopets.com/caption/caption_376.gif"
            alt="Missing Info Hub Thumbnail"
          />
        </Box>
        <Heading as="h1">{t('MissingHub.missing-info-hub')}</Heading>
        <Text>
          {t.rich('MissingHub.description', {
            Link: (chunk) => (
              <Link color="yellow.200" as={NextLink} href="/contribute">
                {chunk}
              </Link>
            ),
          })}
        </Text>
      </Center>
      <Divider my={3} />
      <Center gap={3}>
        <TypeButton field="item_id" selectedField={field} setField={setField} disabled={isLoading}>
          {t('General.item-id')}
        </TypeButton>
        <TypeButton field="category" selectedField={field} setField={setField} disabled={isLoading}>
          {t('General.category')}
        </TypeButton>
        <TypeButton field="rarity" selectedField={field} setField={setField} disabled={isLoading}>
          {t('General.rarity')}
        </TypeButton>
        <TypeButton field="est_val" selectedField={field} setField={setField} disabled={isLoading}>
          {t('General.est-val')}
        </TypeButton>
        <TypeButton field="weight" selectedField={field} setField={setField} disabled={isLoading}>
          {t('General.weight')}
        </TypeButton>
        <TypeButton
          field="description"
          selectedField={field}
          setField={setField}
          disabled={isLoading}
        >
          {t('General.description')}
        </TypeButton>
      </Center>
      <Center alignItems={'stretch'} flexWrap={'wrap'} gap={3} mt={3}>
        {!isLoading && items.map((item) => <ItemCard key={item.internal_id} item={item} />)}
        {!isLoading && items.length === 0 && (
          <VStack>
            <Image maxW="300px" src="/api/cache/preview/bg_waitingrestock.png" alt="empty image" />
            <Text>{t('MissingHub.yay-its-empty')}</Text>
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
          <Button isDisabled={!items.length} onClick={() => setPage(page + 1)}>
            {t('MissingHub.next-page')}
          </Button>
        )}
      </Center>
    </>
  );
};

export default NeedInfoPage;

export async function getStaticProps(context: any) {
  return {
    props: {
      messages: await loadTranslation(context.locale as string, 'hub/missing-info'),
      locale: context.locale,
    },
  };
}

NeedInfoPage.getLayout = function getLayout(page: ReactElement, props: any) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });
  return (
    <Layout
      SEO={{
        title: t('MissingHub.missing-info-hub'),
        description: t
          .rich('MissingHub.description', {
            Link: (chunk) => chunk,
          })
          ?.toString(),
        themeColor: '#aeb18a',
      }}
      mainColor="rgba(240, 250, 148, 0.40)"
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
      colorScheme={selectedField === field ? 'yellow' : undefined}
      isDisabled={disabled}
    >
      {children}
    </Button>
  );
};
