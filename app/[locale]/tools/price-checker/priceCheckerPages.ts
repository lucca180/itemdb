export type PriceCheckerPage = {
  id: string;
  /** next-intl key under General or Feedback */
  labelKey: string;
  labelNamespace: 'General' | 'Feedback' | 'PriceChecker';
  href: string;
  isChecklist: boolean;
  /** Theme / hub icon from images.neopets.com */
  imageSrc: string;
  /** Optional helper note translation key under PriceChecker */
  noteKey?: string;
};

export const PRICE_CHECKER_PAGES: PriceCheckerPage[] = [
  {
    id: 'closet',
    labelKey: 'closet',
    labelNamespace: 'General',
    href: 'https://www.neopets.com/closet.phtml',
    isChecklist: false,
    imageSrc: 'https://images.neopets.com/themes/h5/grey/images/customise-icon.png',
  },
  {
    id: 'sdb',
    labelKey: 'safety-deposit-box',
    labelNamespace: 'General',
    href: 'https://www.neopets.com/safetydeposit.phtml',
    isChecklist: false,
    imageSrc: 'https://images.neopets.com/themes/h5/grey/images/safetydeposit-icon.png',
  },
  {
    id: 'gallery-quick-remove',
    labelKey: 'gallery-quick-remove',
    labelNamespace: 'General',
    href: 'https://www.neopets.com/gallery/quickremove.phtml',
    isChecklist: false,
    imageSrc: 'https://images.neopets.com/themes/h5/grey/images/gallery-icon.png',
  },
  {
    id: 'quickstock',
    labelKey: 'quickstock',
    labelNamespace: 'PriceChecker',
    href: 'https://www.neopets.com/quickstock.phtml',
    isChecklist: false,
    imageSrc: 'https://images.neopets.com/themes/h5/grey/images/quickstock-icon.png',
  },
  {
    id: 'your-shop',
    labelKey: 'your-shop',
    labelNamespace: 'PriceChecker',
    href: 'https://www.neopets.com/market.phtml?type=your',
    isChecklist: false,
    imageSrc: 'https://images.neopets.com/themes/h5/basic/images/myshop-icon.png',
  },
  {
    id: 'storage-shed',
    labelKey: 'storage-shed',
    labelNamespace: 'Feedback',
    href: 'https://www.neopets.com/neohome/shed',
    isChecklist: false,
    imageSrc: 'https://images.neopets.com/themes/h5/grey/images/neohome-icon.png',
  },
  {
    id: 'stamp-album',
    labelKey: 'stamp-album',
    labelNamespace: 'General',
    href: 'https://www.neopets.com/stamps.phtml?type=album&page_id=1&owner=',
    isChecklist: true,
    imageSrc: 'https://images.neopets.com/themes/h5/grey/images/stamps-icon.png',
  },
  {
    id: 'gourmet-club',
    labelKey: 'gourmet-club',
    labelNamespace: 'General',
    href: 'https://www.neopets.com/gourmet_club.phtml',
    isChecklist: true,
    imageSrc: 'https://images.neopets.com/spotlight/hub/icons/gourmet.png',
  },
  {
    id: 'neodeck',
    labelKey: 'neodeck',
    labelNamespace: 'General',
    href: 'https://www.neopets.com/games/neodeck/index.phtml',
    isChecklist: true,
    imageSrc: 'https://images.neopets.com/themes/h5/basic/images/neodeck-icon.png',
  },
  {
    id: 'book-award',
    labelKey: 'book-award',
    labelNamespace: 'General',
    href: 'https://www.neopets.com/quickref.phtml',
    isChecklist: true,
    imageSrc: 'https://images.neopets.com/themes/h5/birthday/images/bookshelf-icon.png',
    noteKey: 'note-book-award',
  },
  {
    id: 'booktastic',
    labelKey: 'booktastic-books-award',
    labelNamespace: 'General',
    href: 'https://www.neopets.com/quickref.phtml',
    isChecklist: true,
    imageSrc: 'https://images.neopets.com/spotlight/hub/icons/booktastic.png',
    noteKey: 'note-booktastic',
  },
];

export const PRICE_CHECKER_SCRIPT_URL =
  'https://github.com/lucca180/itemdb/raw/main/userscripts/listImporter.user.js';

export const TAMPERMONKEY_URL = 'https://www.tampermonkey.net/';

export const inventoryPages = PRICE_CHECKER_PAGES.filter((p) => !p.isChecklist);
export const checklistPages = PRICE_CHECKER_PAGES.filter((p) => p.isChecklist);
