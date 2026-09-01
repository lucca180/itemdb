type PriceCheckerPageId =
  | 'closet'
  | 'sdb'
  | 'gallery-quick-remove'
  | 'quickstock'
  | 'your-shop'
  | 'storage-shed'
  | 'stamp-album'
  | 'gourmet-club'
  | 'neodeck'
  | 'book-award'
  | 'booktastic';

export type PriceCheckerPage = {
  id: PriceCheckerPageId;
  labelKey:
    | 'General.closet'
    | 'General.safety-deposit-box'
    | 'General.stamp-album'
    | 'General.gourmet-club'
    | 'General.neodeck'
    | 'General.book-award'
    | 'General.booktastic-books-award'
    | 'PriceChecker.inventory'
    | 'PriceChecker.your-gallery'
    | 'PriceChecker.your-shop'
    | 'Feedback.storage-shed';
  href: string;
  isChecklist: boolean;
  /** Theme / hub icon from images.neopets.com */
  imageSrc: string;
  descriptionKey: `PriceChecker.page-description-${PriceCheckerPageId}`;
};

export const PRICE_CHECKER_PAGES: PriceCheckerPage[] = [
  {
    id: 'closet',
    labelKey: 'General.closet',
    descriptionKey: 'PriceChecker.page-description-closet',
    href: 'https://www.neopets.com/closet.phtml',
    isChecklist: false,
    imageSrc: 'https://images.neopets.com/themes/h5/grey/images/customise-icon.png',
  },
  {
    id: 'sdb',
    labelKey: 'General.safety-deposit-box',
    descriptionKey: 'PriceChecker.page-description-sdb',
    href: 'https://www.neopets.com/safetydeposit.phtml',
    isChecklist: false,
    imageSrc: 'https://images.neopets.com/themes/h5/grey/images/safetydeposit-icon.png',
  },
  {
    id: 'gallery-quick-remove',
    labelKey: 'PriceChecker.your-gallery',
    descriptionKey: 'PriceChecker.page-description-gallery-quick-remove',
    href: 'https://www.neopets.com/gallery/quickremove.phtml',
    isChecklist: false,
    imageSrc: 'https://images.neopets.com/themes/h5/grey/images/gallery-icon.png',
  },
  {
    id: 'quickstock',
    labelKey: 'PriceChecker.inventory',
    descriptionKey: 'PriceChecker.page-description-quickstock',
    href: 'https://www.neopets.com/quickstock.phtml',
    isChecklist: false,
    imageSrc: 'https://images.neopets.com/themes/h5/grey/images/quickstock-icon.png',
  },
  {
    id: 'your-shop',
    labelKey: 'PriceChecker.your-shop',
    descriptionKey: 'PriceChecker.page-description-your-shop',
    href: 'https://www.neopets.com/market.phtml?type=your',
    isChecklist: false,
    imageSrc: 'https://images.neopets.com/premium/portal/images/shoptill-icon.png',
  },
  {
    id: 'storage-shed',
    labelKey: 'Feedback.storage-shed',
    descriptionKey: 'PriceChecker.page-description-storage-shed',
    href: 'https://www.neopets.com/neohome/shed',
    isChecklist: false,
    imageSrc: 'https://images.neopets.com/themes/h5/grey/images/neohome-icon.png',
  },
  {
    id: 'stamp-album',
    labelKey: 'General.stamp-album',
    descriptionKey: 'PriceChecker.page-description-stamp-album',
    href: 'https://www.neopets.com/stamps.phtml?type=album&page_id=1&owner=',
    isChecklist: true,
    imageSrc: 'https://images.neopets.com/themes/h5/basic/images/v3/stamps-icon.svg',
  },
  {
    id: 'gourmet-club',
    labelKey: 'General.gourmet-club',
    descriptionKey: 'PriceChecker.page-description-gourmet-club',
    href: 'https://www.neopets.com/gourmet_club.phtml',
    isChecklist: true,
    imageSrc: 'https://images.neopets.com/spotlight/hub/icons/gourmet.png',
  },
  {
    id: 'neodeck',
    labelKey: 'General.neodeck',
    descriptionKey: 'PriceChecker.page-description-neodeck',
    href: 'https://www.neopets.com/games/neodeck/index.phtml',
    isChecklist: true,
    imageSrc: 'https://images.neopets.com/themes/h5/basic/images/v3/tradingcards-icon.svg',
  },
  {
    id: 'book-award',
    labelKey: 'General.book-award',
    descriptionKey: 'PriceChecker.page-description-book-award',
    href: 'https://www.neopets.com/quickref.phtml',
    isChecklist: true,
    imageSrc: 'https://images.neopets.com/themes/h5/basic/images/journal-icon.png',
  },
  {
    id: 'booktastic',
    labelKey: 'General.booktastic-books-award',
    descriptionKey: 'PriceChecker.page-description-booktastic',
    href: 'https://www.neopets.com/quickref.phtml',
    isChecklist: true,
    imageSrc: 'https://images.neopets.com/spotlight/hub/icons/booktastic.png',
  },
];

export const PRICE_CHECKER_SCRIPT_URL =
  'https://github.com/lucca180/itemdb/raw/main/userscripts/listImporter.user.js';

export const TAMPERMONKEY_URL = 'https://www.tampermonkey.net/';

export const inventoryPages = PRICE_CHECKER_PAGES.filter((p) => !p.isChecklist);
export const checklistPages = PRICE_CHECKER_PAGES.filter((p) => p.isChecklist);
