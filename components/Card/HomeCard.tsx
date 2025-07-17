import {
  Button,
  Divider,
  Flex,
  Heading,
  IconButton,
  Link,
  Text,
  useMediaQuery,
} from '@chakra-ui/react';
import NextImage from 'next/image';
import { ItemData } from '../../types';
import Color from 'color';
import ItemCard, { ItemCardBadge, ItemImage } from '../Items/ItemCard';
import ItemCtxMenu, { CtxTrigger } from '../Menus/ItemCtxMenu';
import MainLink from '../Utils/MainLink';
import { GoChevronLeft, GoChevronRight } from 'react-icons/go';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

type HomeCardProps = {
  items: ItemData[];
  title: string;
  image: string;
  color: string;
  href?: string;
  linkText?: string;
  h?: number;
  w?: number;
  useItemCard?: boolean;
  opacity?: number;
  utm_content?: string;
  perPage?: number;
};

export const HomeCard = (props: HomeCardProps) => {
  const {
    items,
    title,
    image,
    href: viewAllLink,
    linkText,
    w,
    h,
    useItemCard,
    opacity,
    utm_content,
    perPage = 10,
  } = props;
  const [page, setPage] = useState(0);
  const color = new Color(props.color);
  const rgb = color.rgb().array();
  const t = useTranslations();

  return (
    <Flex
      w="100%"
      flexFlow={'column'}
      p={{ base: 4, lg: 2, xl: 4 }}
      bg="gray.700"
      borderRadius={'md'}
      bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]},${rgb[1]}, ${rgb[2]},${
        opacity ?? '.5'
      }) 0%)`}
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
        <Flex alignItems={'center'} gap={4} flexShrink={0} h="70px">
          <NextImage src={image} quality={100} width={w ?? 71} height={h ?? 71} alt={title} />
          <Heading size={'lg'} sx={{ textWrap: 'balance' }}>
            {title}
          </Heading>
        </Flex>
        <Divider borderColor={'whiteAlpha.300'} mt={3} />
        {!useItemCard && (
          <Flex flexFlow={'column'}>
            {items.slice(perPage * page, perPage * (page + 1)).map((item) => (
              <HomeItem
                key={item.internal_id + title}
                menuKey={item.internal_id + title}
                utm_content={utm_content}
                item={item}
              />
            ))}
          </Flex>
        )}
        {useItemCard && (
          <Flex flexWrap={'wrap'} gap={2} my={3} justifyContent={'center'}>
            {items.slice(perPage * page, perPage * (page + 1)).map((item) => (
              <ItemCard key={item.internal_id + title} item={item} utm_content={utm_content} />
            ))}
          </Flex>
        )}
        <Flex flex="1" alignItems={'flex-end'} justifyContent={'center'} mt={3} gap={1}>
          <IconButton
            onClick={() => setPage(0)}
            fontSize="20px"
            disabled={page === 0}
            icon={<GoChevronLeft />}
            variant={'ghost'}
            aria-label="Previous Page"
            size="sm"
          />
          {viewAllLink && (
            <Button
              as={MainLink}
              href={viewAllLink + (utm_content ? `?utm_content=${utm_content}` : '')}
              variant={'ghost'}
              size={'sm'}
            >
              {linkText ?? t('General.view-all')}
            </Button>
          )}
          <IconButton
            onClick={() => setPage(1)}
            fontSize="20px"
            disabled={page !== 0}
            icon={<GoChevronRight />}
            variant={'ghost'}
            aria-label="Next Page"
            size="sm"
          />
        </Flex>
      </Flex>
    </Flex>
  );
};

const HomeItem = ({
  item,
  menuKey,
  utm_content,
}: {
  item: ItemData;
  menuKey: string;
  utm_content?: string;
}) => {
  const [isMobile] = useMediaQuery('(hover: none)');

  return (
    <>
      <ItemCtxMenu item={item} menuId={menuKey} />
      <CtxTrigger
        id={menuKey}
        disable={isMobile ? true : undefined}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        disableWhileShiftPressed
      >
        <Link
          as={MainLink}
          prefetch={false}
          href={
            '/item/' +
            (item.slug ?? item.internal_id) +
            (utm_content ? `?utm_content=${utm_content}` : '')
          }
          _hover={{ textDecoration: 'none' }}
        >
          <Flex
            h="80px"
            borderBottom={'1px solid rgba(255, 255, 255, 0.16)'}
            p={2}
            _hover={{ bg: 'blackAlpha.300' }}
            alignItems={'center'}
            color="whiteAlpha.900"
          >
            <ItemImage
              item={item}
              width={60}
              height={60}
              style={{ borderRadius: '12px', flexShrink: 0 }}
            />
            <Flex flexFlow={'column'} pl={3} alignItems={'start'} justifyContent={'center'} gap={1}>
              <Text fontSize={'sm'}>{item.name}</Text>
              <ItemCardBadge item={item} />
            </Flex>
          </Flex>
        </Link>
      </CtxTrigger>
    </>
  );
};
