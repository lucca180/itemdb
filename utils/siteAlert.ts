import { getDateNST } from '@utils/utils';

export type SiteAlertConfig = {
  message: string;
  link: string;
  img: { src: string; h: number; w: number } | null;
  bg: string;
  color: string;
};

export const siteAlerts = {
  default: {
    message: '',
    link: '',
    img: null,
    bg: 'gray.900',
    color: 'white',
  },
  hpd: {
    message: 'hpd',
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
    message: 'tyrannian-victory',
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
    message: 'usuki-day',
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
    message: 'faerie-festival',
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
    message: 'halloween',
    link: '/restock',
    img: {
      src: 'https://images.neopets.com/themes/h5/hauntedwoods/images/shop-icon.svg',
      h: 28,
      w: 28,
    },
    bg: 'red.900',
    color: 'whiteAlpha.900',
  },
  hiddenTower: {
    message: 'hiddenTower',
    link: '/lists/official/hidden-tower',
    img: {
      src: 'https://images.neopets.com/themes/h5/birthday/images/inventory-icon.png',
      h: 28,
      w: 28,
    },
    bg: 'pink.300',
    color: 'blackAlpha.800',
  },
  apiV2: {
    message: 'apiV2',
    link: 'https://itemdb.com.br/articles/recent-outages-and-api-v2',
    img: {
      src: 'https://images.neopets.com/themes/h5/hauntedwoods/images/community-icon.svg?d=20210209',
      h: 28,
      w: 28,
    },
    bg: 'whiteAlpha.300',
    color: 'whiteAlpha.900',
  },
} as const;

export function getCurrentSiteAlert() {
  const todayNST = getDateNST();
  if (isThirdWednesday(todayNST)) return siteAlerts.hiddenTower;
  if (todayNST.getDate() === 3) return siteAlerts.hpd;
  if (todayNST.getMonth() === 4 && todayNST.getDate() === 12) return siteAlerts.tyrannia;
  if (todayNST.getMonth() === 7 && todayNST.getDate() === 20) return siteAlerts.usuki;
  if (todayNST.getMonth() === 8 && todayNST.getDate() === 20) return siteAlerts.faerieFestival;
  if (todayNST.getMonth() === 9 && todayNST.getDate() === 31) return siteAlerts.halloween;
  if (todayNST.getTime() < 1784894400000) return siteAlerts.apiV2;

  return siteAlerts.default;
}

function isThirdWednesday(date: Date) {
  const dayOfWeek = date.getDay();
  const dayOfMonth = date.getDate();

  if (dayOfWeek !== 3) {
    return false;
  }

  return dayOfMonth >= 15 && dayOfMonth <= 21;
}
