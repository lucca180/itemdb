import { Badge, Link, Text, Image, Box, HStack, Center, Heading, Tag } from '@chakra-ui/react';
import Color from 'color';
import NextLink from 'next/link';
import { ShopInfo } from '../../../types';
import {
  faerielandShops,
  getDateNST,
  halloweenShops,
  shopIDToCategory,
  slugify,
  tyrannianShops,
} from '../../../utils/utils';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import ChakraImage from '../../Utils/Image';
import { RestockBreadcrumb } from '../../Breadcrumbs/RestockBreadcrumb';
type Props = {
  shop: ShopInfo;
  children?: React.ReactNode;
  isHistory?: boolean;
};

const RestockHeader = (props: Props) => {
  const t = useTranslations();
  const { shop: shopInfo, isHistory } = props;

  const color = Color(shopInfo.color);
  const rgb = color.rgb().array();

  const todayNST = getDateNST();
  const todayDate = todayNST.getDate();

  const specialDay = useMemo(() => {
    const shopCategory = shopIDToCategory[shopInfo.id];

    if (todayNST.getDate() === 3) return 'hpd';
    else if (
      todayNST.getMonth() === 4 &&
      todayNST.getDate() === 12 &&
      tyrannianShops.map((x) => x.toLowerCase()).includes(shopCategory)
    )
      return 'tyrannia';

    if (todayNST.getMonth() === 7 && todayNST.getDate() === 20 && shopCategory === 'usuki doll')
      return 'usukicon';

    if (
      todayNST.getMonth() === 8 &&
      todayNST.getDate() === 20 &&
      faerielandShops.map((x) => x.toLowerCase()).includes(shopCategory)
    )
      return 'festival';

    if (
      todayNST.getMonth() === 9 &&
      todayNST.getDate() === 31 &&
      halloweenShops.map((x) => x.toLowerCase()).includes(shopCategory)
    )
      return 'halloween';
  }, [shopInfo.id, todayDate]);

  return (
    <>
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]},${rgb[1]},${rgb[2]},.5) 70%)`}
        zIndex={-1}
      />
      <Box mt={2}>
        <RestockBreadcrumb shopData={shopInfo} isHistory={isHistory} />
      </Box>
      <Center
        mt={2}
        mb={6}
        flexFlow="column"
        gap={2}
        sx={{ a: { color: Color(shopInfo.color).lightness(70).hex() } }}
      >
        {!isHistory && (
          <HStack>
            <Link as={NextLink} href="/restock">
              <Badge>{shopInfo.category}</Badge>
            </Link>
            {shopInfo.difficulty.toLowerCase() !== 'medium' && (
              <Link as={NextLink} href="/restock">
                <Badge
                  colorScheme={shopInfo.difficulty.toLowerCase() === 'beginner' ? 'green' : 'red'}
                >
                  {shopInfo.difficulty}
                </Badge>
              </Link>
            )}
          </HStack>
        )}
        {isHistory && (
          <HStack>
            <Badge colorScheme="orange">Restock History</Badge>
          </HStack>
        )}
        <Link
          href={`https://www.neopets.com/objects.phtml?type=shop&obj_type=${shopInfo.id}`}
          isExternal
        >
          <ChakraImage
            priority
            quality={90}
            src={`https://images.neopets.com/shopkeepers/w${shopInfo.id}.gif`}
            width={450}
            height={150}
            alt={`${shopInfo.name} thumbnail`}
            borderRadius="md"
            objectFit={'cover'}
            boxShadow={'md'}
          />
        </Link>
        <Heading as="h1">{shopInfo.name}</Heading>
        {props.children}
        {!isHistory && (
          <Text mt={3} fontSize="sm" textAlign={'center'}>
            {t.rich('Restock.history-cta', {
              Link: (chunk) => (
                <Link href={`/restock/${slugify(shopInfo.name)}/history`}>
                  {chunk}
                  <Image
                    src={'/favicon.svg'}
                    width={'18px'}
                    height={'18px'}
                    style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.2rem' }}
                    alt="link icon"
                  />
                </Link>
              ),
            })}
          </Text>
        )}
        {specialDay === 'hpd' && <Tag colorScheme={'green'}>{t('Restock.half-price-day')}</Tag>}
        {specialDay === 'tyrannia' && (
          <Tag colorScheme={'orange'}>{t('Restock.tyrannian-victory-day')}</Tag>
        )}
        {specialDay === 'usukicon' && <Tag colorScheme={'pink'}>{t('Restock.usuki-day')}</Tag>}
        {specialDay === 'festival' && (
          <Tag colorScheme={'purple'}>{t('Restock.faerie-festival')}</Tag>
        )}
        {specialDay === 'halloween' && <Tag colorScheme={'orange'}>{t('Restock.halloween')}</Tag>}
      </Center>
    </>
  );
};

export default RestockHeader;
