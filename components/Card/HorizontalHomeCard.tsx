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
  utm_content?: string;
  sx?: FlexProps['sx'];
  isSmall?: boolean;
};

export const HorizontalHomeCard = (props: HorizontalHomeCard) => {
  const t = useTranslations();
  const { children, title, image, viewAllLink, w, h, bgOpacity, utm_content, isSmall } = props;
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
      sx={props.sx}
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
          <Flex alignItems={'center'} gap={4} flexShrink={0} h={isSmall ? 'auto' : '70px'} mb={3}>
            {image && title && (
              <NextImage src={image} quality={100} width={w ?? 70} height={h ?? 70} alt={title!} />
            )}
            {title && <Heading size={'lg'}>{title}</Heading>}
            <Flex flex={1} justifyContent={'flex-end'}>
              {viewAllLink && (
                <Button
                  as={MainLink}
                  href={viewAllLink}
                  variant={'ghost'}
                  size={'sm'}
                  trackEvent={utm_content}
                  trackEventLabel={utm_content ? 'view-all' : undefined}
                >
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

export const TVWHomeCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <HorizontalHomeCard
      color="#5436ab"
      h={50}
      w={50}
      image="https://images.neopets.com/plots/tvw/activities/void-collection/images/void-attractor.png"
      viewAllLink="/hub/the-void-within"
      title={'The Void Within'}
      isSmall
      sx={{
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        img: {
          filter: 'drop-shadow(0 0 5px #f3a4ff)',
        },
        h2: {
          textShadow: '0 0 10px #f3a4ff',
        },
        '::before': {
          content: "''",
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage:
            "url('https://images.neopets.com/plots/tvw/home/images/void-pattern.png')",
          opacity: 0.5,
          zIndex: -1,
        },
      }}
      innerStyle={{
        border: '2px solid #f3a4ff7d',
      }}
    >
      {children}
    </HorizontalHomeCard>
  );
};
