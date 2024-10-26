import { Box, Center, Heading, Image, Divider, Text, Flex, HStack } from '@chakra-ui/react';
import Layout from '../../components/Layout';
import { useFormatter, useTranslations } from 'next-intl';
import Color from 'color';
import { useMemo } from 'react';
import { ItemData, NCMallData } from '../../types';
import ItemCard from '../../components/Items/ItemCard';
import { IconLink } from '../../components/Utils/IconLink';
import { getNCMallData, getNCMallItemsData } from '../api/v1/ncmall';

type LeavingMallPageProps = {
  messages: any;
  mallData: NCMallData[];
  itemData: ItemData[];
};

const LeavingMallPage = (props: LeavingMallPageProps) => {
  const t = useTranslations();
  const formater = useFormatter();
  const color = Color('#CDC1FF');
  const rgb = color.rgb().array();
  const { mallData, itemData } = props;

  const itemsPerDate = useMemo(() => {
    const dates: { [date: string]: NCMallData[] } = {};
    mallData.forEach((data) => {
      if (!data.saleEnd) return;
      const dateFormatted = formater.dateTime(new Date(data.saleEnd), {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      if (!dates[dateFormatted]) dates[dateFormatted] = [];
      dates[dateFormatted].push(data);
    });

    return dates;
  }, [mallData]);

  return (
    <Layout
      SEO={{
        title: t('NcMall.leaving-soon-tm') + ' | Neopets NC Mall',
        description: t
          .rich('NcMall.leaving-soon-desc', {
            Link: (chunk) => chunk,
          })
          ?.toString(),
        themeColor: color.hex(),
      }}
      mainColor="rgba(205, 193, 255, 0.58)"
    >
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]},${rgb[1]},${rgb[2]},.8) 70%)`}
        zIndex={-1}
      />
      <Center my={6} flexFlow="column" gap={2} sx={{ a: { color: color.lightness(90).hex() } }}>
        <Box h="auto" overflow={'hidden'} borderRadius="md" boxShadow={'md'}>
          <Image
            w={600}
            h={200}
            objectFit={'cover'}
            src="https://images.neopets.com/ncmall/shopkeepers/cashshop_new.png"
            alt="NC Mall Thumbnail"
          />
        </Box>
        <Heading as="h1">{t('NcMall.leaving-soon-tm')}</Heading>
        <Text>
          {t.rich('NcMall.leaving-soon-desc', {
            Link: (chunk) => (
              <IconLink href="https://ncmall.neopets.com/" isExternal>
                {chunk}
              </IconLink>
            ),
          })}
        </Text>
      </Center>
      <Divider my={3} />
      <Flex flexFlow={'column'} alignItems={'stretch'} flexWrap={'wrap'} gap={3} mt={3}>
        {Object.entries(itemsPerDate).map(([date, mallData]: [string, NCMallData[]]) => (
          <>
            <Heading as="h2" size="lg">
              {date}
            </Heading>
            <HStack spacing={3} alignItems={'stretch'} flexWrap={'wrap'}>
              {mallData.map((mall) => {
                const item = itemData.find((item) => item.internal_id === mall.item_iid);
                if (!item) return null;
                return <ItemCard key={item.internal_id} item={item} />;
              })}
            </HStack>
          </>
        ))}
      </Flex>
    </Layout>
  );
};

export default LeavingMallPage;

export async function getStaticProps(context: any) {
  const [items, mallData] = await Promise.all([
    getNCMallItemsData(100, true),
    getNCMallData(100, true),
  ]);

  return {
    props: {
      mallData: mallData,
      itemData: items,
      messages: (await import(`../../translation/${context.locale}.json`)).default,
    },
    revalidate: 180,
  };
}
