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
  mallHub: {
    message: 'mallHub',
    link: '/mall',
    img: {
      src: 'data:image/png;base64,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',
      h: 28,
      w: 28,
    },
    bg: '#cdc1ffa6',
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
  if (todayNST.getTime() < 1788134399000) return siteAlerts.mallHub;

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
