import type { ReactNode } from 'react';
import { Badge, Box, Center, Heading, HStack, Link } from '@chakra-ui/react';
import Color from 'color';
import { Link as I18nLink } from '@i18n/navigation';
import { RestockBreadcrumb } from '@components/Breadcrumbs/RestockBreadcrumb';
import type { BreadcrumbItem } from '@components/Breadcrumbs/types';
import { RestockShopSpecialDayTag } from '@components/Hubs/Restock/RestockShopSpecialDayTag';
import ChakraImage from '@components/Utils/Image';
import type { ShopInfo } from '@types';
import type { ShopRestockSpecialDay } from '@utils/utils';

export type RestockHeaderSpecialDayLabels = Record<ShopRestockSpecialDay, string>;

type RestockHeaderProps = {
  shop: ShopInfo;
  children?: ReactNode;
  breadcrumbList: BreadcrumbItem[];
  locale: string;
  useAppDir?: boolean;
  historyCta: ReactNode;
  specialDayLabels: RestockHeaderSpecialDayLabels;
};

export default function RestockHeader({
  shop: shopInfo,
  children,
  breadcrumbList,
  locale,
  useAppDir,
  historyCta,
  specialDayLabels,
}: RestockHeaderProps) {
  const color = Color(shopInfo.color);
  const rgb = color.rgb().array();
  const linkColor = color.lightness(70).hex();

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
        <RestockBreadcrumb breadcrumbList={breadcrumbList} locale={locale} useAppDir={useAppDir} />
      </Box>
      <Center mt={2} mb={6} flexFlow="column" gap={2} css={{ '& a': { color: linkColor } }}>
        <HStack>
          <Link asChild>
            <I18nLink href="/restock">
              <Badge>{shopInfo.category}</Badge>
            </I18nLink>
          </Link>
          {shopInfo.difficulty.toLowerCase() !== 'medium' && (
            <Link asChild>
              <I18nLink href="/restock">
                <Badge
                  colorPalette={shopInfo.difficulty.toLowerCase() === 'beginner' ? 'green' : 'red'}
                >
                  {shopInfo.difficulty}
                </Badge>
              </I18nLink>
            </Link>
          )}
        </HStack>
        <Link
          href={`https://www.neopets.com/objects.phtml?type=shop&obj_type=${shopInfo.id}`}
          target="_blank"
          rel="noreferrer"
        >
          <ChakraImage
            priority
            quality={90}
            src={`https://images.neopets.com/shopkeepers/w${shopInfo.id}.gif`}
            width={450}
            height={150}
            alt={`${shopInfo.name} thumbnail`}
            borderRadius="md"
            objectFit="cover"
            boxShadow="sm"
          />
        </Link>
        <Heading as="h1">{shopInfo.name}</Heading>
        {children}
        {historyCta}
        <RestockShopSpecialDayTag shopId={shopInfo.id} labels={specialDayLabels} />
      </Center>
    </>
  );
}
