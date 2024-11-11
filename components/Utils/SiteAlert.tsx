import { Flex, Text, Link } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import NextLink from 'next/link';
import { getDateNST } from '../../utils/utils';

type SiteAlert = {
  message: string;
  link: string;
  img: { src: string; h: number; w: number } | null;
  bg: string;
  color: string;
};

const alerts = {
  default: {
    message: '',
    link: '',
    img: null,
    bg: 'gray.900',
    color: 'white',
  },
  hpd: {
    message: 'SiteAlert.hpd',
    link: '/restock',
    img: {
      src: 'https://images.neopets.com/themes/h5/altadorcup/images/shop-icon.png',
      h: 28,
      w: 28,
    },
    bg: 'green.300',
    color: 'blackAlpha.900',
  },
  tyrannia: {
    message: 'SiteAlert.tyrannian-victory',
    link: '/restock',
    img: {
      src: 'https://images.neopets.com/themes/h5/tyrannia/images/shop-icon.png',
      h: 28,
      w: 28,
    },
    bg: 'orange.300',
    color: 'blackAlpha.900',
  },
  usuki: {
    message: 'SiteAlert.usuki-day',
    link: '/restock/usukiland',
    img: {
      src: 'https://images.neopets.com/neoboards/avatars/usukicon_usuls.gif',
      h: 28,
      w: 28,
    },
    bg: 'pink.400',
    color: 'blackAlpha.900',
  },
  faerieFestival: {
    message: 'SiteAlert.faerie-festival',
    link: '/restock',
    img: {
      src: 'https://images.neopets.com/themes/h5/destroyedfestival/images/shop-icon.png',
      h: 28,
      w: 28,
    },
    bg: 'purple.200',
    color: 'blackAlpha.900',
  },
  halloween: {
    message: 'SiteAlert.halloween',
    link: '/restock',
    img: {
      src: 'https://images.neopets.com/themes/h5/hauntedwoods/images/shop-icon.svg',
      h: 28,
      w: 28,
    },
    bg: 'red.900',
    color: 'whiteAlpha.900',
  },
  weeklyQuests: {
    message: 'SiteAlert.quest-log',
    link: '/tools/data-collecting',
    img: {
      src: 'https://images.neopets.com/quests/images/CompletedQuest.png',
      h: 28,
      w: 28,
    },
    bg: '#b4ff53c7',
    color: 'blackAlpha.900',
  },
};

export const SiteAlert = () => {
  const t = useTranslations();
  const alert = getAlert();

  return (
    <Flex bg={alert.bg}>
      <Flex
        w="full"
        maxW="8xl"
        marginX="auto"
        alignItems={'center'}
        gap={1}
        fontSize={'xs'}
        minH={'30px'}
      >
        {alert.img && (
          <Link as={NextLink} href={alert.link}>
            <Image src={alert.img.src} width={alert.img.w} height={alert.img.h} alt="alert icon" />
          </Link>
        )}
        <Text color={alert.color}>
          {!!alert.message &&
            t.rich(alert.message, {
              Link: (children) => (
                <Link as={NextLink} href={alert.link} fontWeight="bold">
                  {children}
                </Link>
              ),
            })}
        </Text>
      </Flex>
    </Flex>
  );
};

const getAlert = () => {
  const todayNST = getDateNST();

  if (todayNST.getTime() < 1732028400000) return alerts.weeklyQuests;

  if (todayNST.getDate() === 3) return alerts.hpd;
  else if (todayNST.getMonth() === 4 && todayNST.getDate() === 12) return alerts.tyrannia;

  if (todayNST.getMonth() === 7 && todayNST.getDate() === 20) return alerts.usuki;

  if (todayNST.getMonth() === 8 && todayNST.getDate() === 20) return alerts.faerieFestival;

  if (todayNST.getMonth() === 9 && todayNST.getDate() === 31) return alerts.halloween;

  return alerts.default;
};
