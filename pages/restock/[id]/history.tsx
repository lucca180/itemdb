import {
  Divider,
  Link,
  Text,
  Image,
  Center,
  HStack,
  Select,
  Spinner,
  Flex,
  IconButton,
} from '@chakra-ui/react';
import { ContributeWallData, ItemRestockData, ShopInfo } from '../../../types';
import { restockShopInfo, slugify } from '../../../utils/utils';
import { createTranslator, useTranslations } from 'next-intl';
import Layout from '../../../components/Layout';
import RestockHeader from '../../../components/Hubs/Restock/RestockHeader';
import { GetStaticPropsContext } from 'next';
import { ReactElement, useEffect, useState } from 'react';
import axios from 'axios';
import RestockHistoryCard from '../../../components/Hubs/Restock/RestockHistoryCard';
import { MdRefresh } from 'react-icons/md';
import { ContributeWall } from '../../../components/Utils/ContributeWall';
import { loadTranslation } from '@utils/load-translation';

type RestockHistoryPageProps = {
  shopInfo: ShopInfo;
  messages: any;
  locale: string;
};

const RestockHistory = (props: RestockHistoryPageProps) => {
  const t = useTranslations();
  const { shopInfo } = props;
  const [mode, setMode] = useState('30days');
  const [isLoading, setLoading] = useState(false);
  const [restockData, setRestockData] = useState<ItemRestockData[] | null>();
  const [sortMode, setSortMode] = useState('price');
  const [wall, setWall] = useState<ContributeWallData | null>(null);

  useEffect(() => {
    init();
  }, []);

  const init = async (newMode?: string) => {
    setLoading(true);
    setWall(null);
    try {
      const res = await axios.get(
        `/api/v1/restock/history?id=${shopInfo.id}&mode=${newMode ?? mode}`
      );

      setRestockData(sortRestock(res.data, sortMode));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(error);

        if (error.response?.status === 403) {
          setWall(error.response?.data);
          console.error(error.response?.data);
        }
      }
    }

    setLoading(false);
  };

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMode(e.target.value);
    init(e.target.value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortMode(e.target.value);
    setRestockData(sortRestock(restockData, e.target.value));
  };

  return (
    <>
      <RestockHeader shop={shopInfo} isHistory>
        <Text as="h2" textAlign={'center'}>
          {t.rich('Restock.restock-history-header', {
            Link: (chunk) => (
              <Link
                href={`https://www.neopets.com/objects.phtml?type=shop&obj_type=${shopInfo.id}`}
                isExternal
              >
                {chunk}
                <Image
                  src={'/icons/neopets.png'}
                  width={'16px'}
                  height={'16px'}
                  style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.2rem' }}
                  alt="link icon"
                />
              </Link>
            ),
            shopname: shopInfo.name,
          })}
          <br />
          <Link href={`/restock/${slugify(shopInfo.name)}`}>
            {t('Restock.restock-history-hub-cta')}
            <Image
              src={'/favicon.svg'}
              width={'18px'}
              height={'18px'}
              style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.2rem' }}
              alt="link icon"
            />
          </Link>
        </Text>
      </RestockHeader>
      <Divider />
      <Center mt={2}>
        <HStack>
          <Select
            variant="filled"
            size="sm"
            bg="blackAlpha.300"
            borderRadius={'md'}
            onChange={handleModeChange}
            value={mode}
            disabled={isLoading}
          >
            <option value="30days">{t('General.x-days', { x: 30, long: false })}</option>
            <option value="7days">{t('General.x-days', { x: 7, long: false })}</option>
            <option value="3days">{t('General.x-days', { x: 3, long: false })}</option>
            <option value="1day">{t('General.1-day')}</option>
            <option value="1hour">{t('General.1-hour')}</option>
            <option value="30min">{t('General.x-minutes', { x: 30, long: false })}</option>
          </Select>
          <Select
            variant="filled"
            size="sm"
            bg="blackAlpha.300"
            borderRadius={'md'}
            disabled={isLoading}
            onChange={handleSortChange}
            value={sortMode}
          >
            <option value="price">{t('Restock.price-order')}</option>
            <option value="addedAt">{t('Restock.chronological-order')}</option>
          </Select>
          <IconButton
            icon={<MdRefresh />}
            size="sm"
            bg="blackAlpha.300"
            aria-label="Refresh"
            onClick={() => init()}
            isDisabled={isLoading}
          />
        </HStack>
      </Center>
      {!wall && (
        <Center mt={3} gap={5} flexFlow={'column'}>
          {isLoading && <Spinner />}
          {!isLoading && (
            <Flex gap={5} flexWrap={'wrap'} justifyContent={'center'}>
              {restockData &&
                !!restockData.length &&
                restockData.map((restock) => (
                  <RestockHistoryCard key={restock.internal_id} restock={restock} />
                ))}
              {restockData && !restockData.length && (
                <Text color="red.300">{t('Restock.history-empty')}</Text>
              )}
            </Flex>
          )}
          <Text textAlign={'center'} mt={8} fontSize="xs">
            {t('Restock.info-up-to-date-warning')}
            <br />
            <Link href="/contribute" color="gray.400">
              {t('General.learnHelp')}
            </Link>
          </Text>
        </Center>
      )}
      {wall && <ContributeWall textType="Restock" color={shopInfo.color} wall={wall} />}
    </>
  );
};

export default RestockHistory;

export async function getStaticProps(context: GetStaticPropsContext) {
  const id = context.params?.id as string | undefined;

  if (!id) return { notFound: true };
  let shopInfo;

  if (isNaN(Number(id))) {
    shopInfo = Object.values(restockShopInfo).find((shop) => slugify(shop.name) === id);
  } else {
    shopInfo = restockShopInfo[id];
    return {
      redirect: {
        destination: `/restock/${slugify(shopInfo.name)}/history`,
        permanent: true,
      },
    };
  }

  if (!shopInfo) return { notFound: true };

  const props: RestockHistoryPageProps = {
    shopInfo: shopInfo,
    messages: await loadTranslation(context.locale as string, 'restock/[id]/history'),
    locale: context.locale ?? 'en',
  };

  return {
    props,
  };
}

export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' };
}

const sortRestock = (restock: ItemRestockData[] | null | undefined, mode: string) => {
  if (!restock) return restock;
  if (mode === 'price') {
    return restock.sort((a, b) => {
      return (b.item.price.value ?? 0) - (a.item.price.value ?? 0);
    });
  }

  return restock.sort((a, b) => {
    return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
  });
};

RestockHistory.getLayout = function getLayout(page: ReactElement, props: RestockHistoryPageProps) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });
  const { shopInfo } = props;
  return (
    <Layout
      SEO={{
        title: `${shopInfo.name} | ${t('Restock.restock-history')}`,
        description: `${t
          .rich('Restock.restock-history-header', {
            Link: (chunk) => chunk,
            shopname: shopInfo.name,
          })
          ?.toString()}`,
        themeColor: shopInfo.color,
        twitter: {
          cardType: 'summary_large_image',
        },
        openGraph: {
          images: [
            {
              url: `https://images.neopets.com/shopkeepers/w${shopInfo.id}.gif`,
              width: 450,
              height: 150,
              alt: shopInfo.name,
            },
          ],
        },
      }}
      mainColor={`${shopInfo.color}a6`}
    >
      {page}
    </Layout>
  );
};
