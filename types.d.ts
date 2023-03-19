export type ItemData = {
  internal_id: number;
  item_id: number | null;
  name: string;
  description: string;
  image: string;
  image_id: string;
  category: string | null;
  rarity: number | null;
  weight: number | null;
  type: 'np' | 'nc' | 'pb';
  isNC: boolean;
  isWearable: boolean;
  isNeohome: boolean;
  estVal: number | null;
  specialType: string | null;
  status: 'active' | 'no trade' | null;
  color: ItemColorData;
  findAt: ItemFindAt;
  isMissingInfo: boolean;
  price: ItemPriceData;
  comment: string | null;
};

export type ItemFindAt = {
  shopWizard?: string;
  auction?: string;
  trading?: string;
  closet?: string;
  safetyDeposit: string;
  restockShop?: string;
  dti?: string;
};

export type ColorData = {
  internal_id: number;
  image: string;
  image_id: string;
  lab: [number, number, number] | number[];
  rgb: [number, number, number] | number[];
  hex: string;
  population: number;
  type: ColorType;
};

export type ItemColorData = {
  lab: [number, number, number] | number[];
  rgb: [number, number, number] | number[];
  hex: string;
  type: 'vibrant';
  population: number;
};

export type ItemPriceData = {
  addedAt: string | null;
  value: number | null;
  inflated: boolean;
};

export type ColorType =
  | 'vibrant'
  | 'darkvibrant'
  | 'lightvibrant'
  | 'muted'
  | 'darkmuted'
  | 'lightmuted';

export type FullItemColors = Record<ColorType, ColorData>;

export type PriceData = {
  value: number;
  addedAt: string;
  inflated: boolean;
};

export type ItemLastSeen = {
  sw: string | null;
  tp: string | null;
  auction: string | null;
  restock: string | null;
};

export type ItemRestockData = {
  internal_id: number;
  item: ItemData;
  type: string;
  stock: number;
  price: number;
  addedAt: string;
};

export type TradeData = {
  trade_id: number;
  owner: string;
  wishlist: string;
  addedAt: string;
  processed: boolean;
  priced: boolean;
  items: {
    internal_id: number;
    trade_id: number;
    name: string;
    image: string;
    image_id: string;
    order: number;
    addedAt: string;
    price: number | null;
  }[];
};

export type ItemAuctionData = {
  internal_id: number;
  auction_id: number | null;
  item: ItemData;
  price: number;
  addedAt: string;
  owner: string;
  isNF: boolean;
  hasBuyer: boolean;
  timeLeft: string | null;
};

export type SearchResults = {
  content: ItemData[];
  page: number;
  totalResults: number;
  resultsPerPage: number;
};

export type SearchStats = {
  total: number;
  category: Record<string, number>;
  // isNC: Record<string, number>;
  type: Record<string, number>;
  isWearable: Record<string, number>;
  isNeohome: Record<string, number>;
  status: Record<string, number>;
};

export type SearchFilters = {
  category: string[];
  type: string[];
  status: string[];
  color: string;
  price: string[]; // [min, max]
  rarity: string[];
  weight: string[];
  estVal: string[];
  sortBy: string;
  sortDir: string;
  limit: number;
  page: number;
};

export type ItemTag = {
  tag_id: number;
  name: string;
  description: string | null;
  type: 'category' | 'tag';
};

export type User = {
  id: string;
  username: string | null;
  neopetsUser: string | null;
  email: string;
  role: UserRoles;
  isAdmin: boolean;
  createdAt: Date;
  lastLogin: Date;
  last_ip: string | null;
  profileColor: string | null;
  profileImage: string | null;
  description: string | null;

  xp: number;
};

export type UserRoles = 'USER' | 'ADMIN' | 'SYSTEM';

export type UserList = {
  internal_id: number;
  name: string;
  description: string | null;
  user_id: string;
  user_username: string;
  user_neouser: string;

  coverURL: string | null;
  official: boolean;

  purpose: 'none' | 'seeking' | 'trading';
  visibility: 'public' | 'private' | 'unlisted';

  colorHex: string | null;

  sortBy: string;
  sortDir: string;
  order: number | null;

  createdAt: Date;
  updatedAt: Date;

  itemInfo: ListItemInfo[];
  itemCount: number;
};

export type ListItemInfo = {
  internal_id: number;
  list_id: number;
  item_iid: number;
  addedAt: Date;
  updatedAt: Date;
  amount: number;
  capValue: number | null;
  imported: boolean;
  order: number | null;
  isHighlight: boolean;
};

// ------- FEEDBACKS JSON -------- //
export type Feedback = {
  feedback_id: number;
  addedAt: string;
  email: string | null;
  json: string;
  type: FeedbackType;
  parsed?: FeedbackParsed | null;
  processed: boolean;
  subject_id: number | null;
  user_id: string | null;
  votes: number;
};

export type FeedbackType = 'tradePrice' | 'itemChange';

export type EditItemFeedbackJSON = {
  itemTags: string[];
};

export type FeedbackParsed = {
  ip: string;
  pageRef: string;
  content: any;
};

// ------- DTI -------- //

export type DTISpecies = {
  id: string;
  name: string;
};

export type DTIColor = {
  name: string;
  id: string;
  isStandard: boolean;
  appliedToAllCompatibleSpecies: {
    species: DTISpecies;
  }[];
};

export type DTIZoneQuery = {
  id: string;
  isCommonlyUsedByItems: boolean;
  label: string;
};

export type DTILayer = {
  id: string;
  imageUrlV2: string;
  knowGlitches: string[];
  remoteId: string;
  zone: {
    id: string;
    depth: number;
    label: string;
  };
};

export type DTIItemPreview = {
  id: string;
  name: string;
  canonicalAppearance: DTICanonicalAppearance;
};

export type DTICanonicalAppearance = {
  id: string;
  restrictedZones: {
    id: string;
    depth: number;
    label: string;
  }[];
  layers: DTILayer[];
  body: {
    canonicalAppearance: DTIPetAppearance;
  };
};

export type DTIPetAppearance = {
  bodyId: string;
  color: {
    id: string;
    name: string;
  };
  id: string;
  isGlitched: boolean;
  layers: DTILayer[];
  pose: string[];
  restrictedZones: string[];
  species: {
    id: string;
    name: string;
  };
};
