import { Flex, Heading, Separator } from '@chakra-ui/react';
import Color from 'color';
import NextImage from 'next/image';
import type { ItemV2For } from '@types';
import type { ReactNode } from 'react';
import { HomeCardBody } from '@components/Card/HomeCardBody';

type HomeCardProps = {
  items?: ItemV2For<'card'>[];
  title: string;
  image: string;
  color: string;
  href?: string;
  linkText?: string;
  h?: number;
  w?: number;
  useItemCard?: boolean;
  /** Show NC Mall leave date (`price.saleEnd`) instead of the price badge. */
  showMallLeaveDate?: boolean;
  opacity?: number;
  utm_content?: string;
  perPage?: number;
  isLoading?: boolean;
  /** Custom paginated rows (e.g. Rainbow Pool). Replaces the item list. */
  bodyRows?: ReactNode[];
};

export function HomeCard(props: HomeCardProps) {
  const {
    items,
    title,
    image,
    href,
    linkText,
    w,
    h,
    useItemCard,
    showMallLeaveDate,
    opacity = 0.5,
    utm_content,
    perPage,
    isLoading,
    bodyRows,
  } = props;

  const wash = Color(props.color).alpha(opacity).hexa();

  return (
    <Flex
      w="100%"
      flex={1}
      minW={0}
      flexFlow={'column'}
      p={{ base: 4, lg: 2, xl: 4 }}
      bg="gray.700"
      borderRadius={'md'}
      bgGradient={`linear-gradient(to top, transparent 0, ${wash} 0%)`}
    >
      <Flex
        w="100%"
        flex={1}
        px={{ base: 2, lg: 2, xl: 6 }}
        py={4}
        flexFlow={'column'}
        borderRadius={'lg'}
        border={`2px solid ${Color('#fff').alpha(0.1).hexa()}`}
      >
        <Flex alignItems={'center'} gap={3} flexShrink={0} minH="70px" minW={0}>
          <NextImage
            src={image}
            quality={90}
            width={w ?? 71}
            height={h ?? 71}
            alt={title}
            style={{ flexShrink: 0 }}
          />
          <Heading size={'lg'} minW={0} css={{ textWrap: 'balance' }}>
            {title}
          </Heading>
        </Flex>
        <Separator borderColor={'whiteAlpha.300'} mt={3} />
        <HomeCardBody
          items={items}
          title={title}
          href={href}
          linkText={linkText}
          useItemCard={useItemCard}
          showMallLeaveDate={showMallLeaveDate}
          utm_content={utm_content}
          perPage={perPage}
          isLoading={isLoading}
          bodyRows={bodyRows}
        />
      </Flex>
    </Flex>
  );
}

export { HomeItem } from '@components/Card/HomeCardBody';
