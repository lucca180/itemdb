import { Flex, Heading, Button, FlexProps } from '@chakra-ui/react';
import Color from 'color';
import NextImage from 'next/image';
import MainLink from '../Utils/MainLink';
import { useTranslations } from 'next-intl';

type HorizontalHomeCard = {
  // lists: UserList[];
  title?: string;
  image?: string;
  color: string;
  children?: React.ReactNode;
  viewAllLink?: string;
  w?: number;
  h?: number;
  bgOpacity?: string;
  style?: FlexProps;
  innerStyle?: FlexProps;
};

export const HorizontalHomeCard = (props: HorizontalHomeCard) => {
  const t = useTranslations();
  const { children, title, image, viewAllLink, w, h, bgOpacity } = props;
  const color = Color(props.color);
  const rgb = color.rgb().array();

  return (
    <Flex
      w="100%"
      flexFlow={'column'}
      p={2}
      bg="gray.700"
      borderRadius={'md'}
      bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]},${rgb[1]}, ${rgb[2]},${bgOpacity ?? '0.45'}) 0%)`}
      {...props.style}
    >
      <Flex
        w="100%"
        px={2}
        py={4}
        flexFlow={'column'}
        borderRadius={'lg'}
        border={`2px solid ${color.lightness(50).alpha(0.3).hexa()}`}
        {...props.innerStyle}
      >
        {(image || title || viewAllLink) && (
          <Flex alignItems={'center'} gap={4} flexShrink={0} h="70px" mb={3}>
            {image && title && (
              <NextImage src={image} quality={100} width={w ?? 70} height={h ?? 70} alt={title!} />
            )}
            {title && <Heading size={'lg'}>{title}</Heading>}
            <Flex flex={1} justifyContent={'flex-end'}>
              {viewAllLink && (
                <Button as={MainLink} href={viewAllLink} variant={'ghost'} size={'sm'}>
                  {t('General.view-all')}
                </Button>
              )}
            </Flex>
          </Flex>
        )}
        {children}
      </Flex>
    </Flex>
  );
};
