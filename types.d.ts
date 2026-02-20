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
  isBD: boolean;
  estVal: number | null;
  status: 'active' | 'no trade' | null;
  color: ItemColorData;
  findAt: ItemFindAt;
  isMissingInfo: boolean;
  price: ItemPriceData;
  saleStatus: SaleStatus | null;
  ncValue: NCValue | null;
  slug: string | null;
  comment: string | null;
  canonical_id: number | null;
  useTypes: UseTypes;
  firstSeen: string | null;
  mallData: ItemMallData | null;
  cacheHash: string | null;
  itemFlags?: string | null;
};

export type ItemFindAt = {
  shopWizard?: string | null;
  auction?: string | null;
  trading?: string | null;
  closet?: string | null;
  safetyDeposit?: string | null;
  restockShop?: string | null;
  dti?: string | null;
  neosearch?: string | null;
};

export type ColorData = {
  internal_id: number;
  image: string;
  image_id: string;
  lab: [number, number, number] | number[];
  rgb: [number, number, number] | number[];
  hsv: [number, number, number] | number[];
  hex: string;
  population: number;
  type: ColorType;
};

export type ItemColorData = {
  lab: [number, number, number] | number[];
  rgb: [number, number, number] | number[];
  hsv: [number, number, number] | number[];
  hex: string;
  type: 'vibrant';
  population: number;
};

export type ItemPriceData = {
  addedAt: string | null;
  value: number | null;
  inflated: boolean;
};

export type OwlsPriceData = {
  pricedAt: string;
  valueMin: number;
  value: string;
  buyable: boolean;
};

export type ItemMallData = {
  price: number;
  saleBegin: string | null;
  saleEnd: string | null;
  discountBegin: string | null;
  discountEnd: string | null;
  discountPrice: number | null;
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
  price_id: number;
  value: number;
  addedAt: string;
  inflated: boolean;
  context?: string | null;
  isLatest: boolean;
  isUnconfirmed?: boolean;
};

export type ItemLastSeen = {
  sw: string | null;
  tp: string | null;
  auction: string | null;
  restock: string | null;
};

export type ItemRestockData = {
  internal_id: number;
  item_iid: number | null;
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
  hash: string | null;
  instantBuy?: number | null;
  createdAt?: string | null;
  items: {
    internal_id: number;
    name: string;
    image: string;
    image_id: string;
    item_iid: number | null;
    trade_id: number;
    order: number;
    amount: number;
    addedAt: string;
    price: number | null;
  }[];
};

export type ItemAuctionData = {
  internal_id: number;
  auction_id: number | null;
  item_iid: number | null;
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
  type: Record<string, number>;
  isWearable: Record<string, number>;
  isNeohome: Record<string, number>;
  isBD: Record<string, number>;
  canEat: Record<string, number>;
  canRead: Record<string, number>;
  canPlay: Record<string, number>;
  status: Record<string, number>;
  zone_label: Record<string, number>;
  saleStatus: Record<string, number>;
};

// WARNING: think twice before changing the filter signature
// because IT WILL affect every single dynamic list
export type SearchFilters = {
  category: string[];
  zone: string[];
  type: string[];
  status: string[];
  color: string;
  price: string[]; // [min, max]
  rarity: string[]; // [min, max]
  weight: string[]; // [min, max]
  estVal: string[]; // [min, max]
  ncValue: string[]; // [min, max]
  petpetColor: string[];
  petpetSpecies: string[];
  p2Paintable?: boolean;
  p2Canonical?: boolean;
  restockProfit: string; // min profit margin
  restockIncludeUnpriced: boolean;
  colorTolerance: string; // color tolerance
  colorType: string;
  sortBy: string;
  sortDir: string;
  mode: 'name' | 'description' | 'all' | 'fuzzy' | 'not' | 'natural' | 'boolean';
  limit: number;
  page: number;
};

export type ExtendedSearchQuery = SearchFilters & {
  s: string;
};

export type ItemTag = {
  tag_id: number;
  name: string;
  description: string | null;
  type: 'tag';
};

export type User = {
  id: string;
  username: string | null;
  neopetsUser: string | null;
  email: string;
  role: UserRoles;
  isAdmin: boolean;
  createdAt: string;
  lastLogin: string;
  profileColor: string | null;
  profileImage: string | null;
  description: string | null;
  profileMode: 'groups' | 'default';

  prefLang: string | null;

  banned: boolean;

  xp: number;
};

export type UserRoles = 'USER' | 'ADMIN' | 'SYSTEM';

export type UserList = {
  internal_id: number;
  name: string;
  description: string | null;

  owner: {
    id: string;
    username: string | null;
    neopetsUser: string | null;
    lastSeen: string;
  };

  coverURL: string | null;
  official: boolean;

  purpose: 'none' | 'seeking' | 'trading';
  visibility: 'public' | 'private' | 'unlisted';

  colorHex: string | null;

  sortBy: string;
  sortDir: string;
  order: number | null;

  createdAt: string;
  updatedAt: string;

  itemInfo?: ListItemInfo[];
  itemCount: number | null;

  officialTag: string | null;
  userTag: string | null;

  dynamicType: 'addOnly' | 'removeOnly' | 'fullSync' | null;
  lastSync: string | null;
  linkedListId: number | null;
  canBeLinked: boolean;

  slug: string | null;

  seriesType: 'listCreation' | 'itemAddition' | 'listDates' | null;
  seriesStart: string | null;
  seriesEnd: string | null;

  highlight: string | null;
  highlightText: string | null;
};

export type ObligatoryUserList = Required<Pick<UserList, 'itemInfo'>> & UserList;

export type ListItemInfo = {
  internal_id: number;
  list_id: number;
  item_iid: number;
  addedAt: string;
  updatedAt: string;
  amount: number;
  capValue: number | null;
  imported: boolean;
  order: number | null;
  isHighlight: boolean;
  isHidden: boolean;

  seriesStart: string | null;
  seriesEnd: string | null;
};

export type Pallete = {
  lab: number[];
  hsv: number[];
  rgb: number[];
  hex: string;
  type: string;
  population: number;
};

export type WP_Article = {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  date: string;
  updated: string;
  thumbnail: string | null;
  category: string | null;
  palette: Record<ColorType, Pallete> | null;
};

export type ItemOpenable = {
  openings: number;
  pools: { [name: string]: PrizePoolData };
  notes: string | null;
  drops: { [id: number]: ItemDrop };
  hasLE: boolean;
  isGBC: boolean;
  isChoice: boolean;
  isGram: boolean;
  maxDrop: number;
  minDrop: number;
};

export type PrizePoolData = {
  name: string;
  items: number[];
  openings: number;
  maxDrop: number;
  minDrop: number;
  totalDrops: number;
  isChance: boolean;
  isLE: boolean;
};

export type ItemDrop = {
  item_iid: number;
  dropRate: number;
  notes: string | null;
  isLE: boolean;
  pool: string | null;
};

export type UserAchievement = {
  name: string;
  image: string;
};

export type ShopInfo = {
  name: string;
  id: string;
  category: string;
  difficulty: string;
  color: string;
};

type RestockSession = {
  startDate: number;
  lastRefresh: number;
  shopId: number;
  refreshes: number[];
  items: {
    [restock_id: number]: {
      item_id: number;
      timestamp: number;
      stock_price?: number | null;
      notTrust?: boolean;
    };
  };
  clicks: {
    item_id: number;
    restock_id: number;
    soldOut_timestamp: number | null;
    haggle_timestamp: number | null;
    buy_timestamp: number | null;
    buy_price: number | null;
  }[];

  isActive?: boolean;

  version: number;
};

type RestockStats = {
  startDate: number;
  endDate: number;
  durationCount: number;
  shopList: number[];
  shopDuration: {
    [shopId: string]: number;
  };
  mostPopularShop: {
    shopId: number;
    durationCount: number;
  };
  totalSessions: number;
  mostExpensiveBought?: ItemData | null;
  mostExpensiveLost?: ItemData | null;
  totalRefreshes: number;
  totalSpent?: number | null;
  estProfit?: number | null;
  totalHaggled: number;
  totalLost: {
    count: number;
    value: number;
  };
  totalBought: {
    count: number;
    value: number;
  };
  estRevenue: number;
  avgRefreshTime: number;
  avgReactionTime: number;
  totalClicks: number;
  hottestRestocks: ItemData[];
  hottestBought: {
    item: ItemData;
    click: RestockSession['clicks'][0];
    restockItem: RestockSession['items'][0];
  }[];
  worstBaits: {
    item: ItemData;
    click: RestockSession['clicks'][0];
    restockItem: RestockSession['items'][0];
  }[];
  hottestLost: {
    item: ItemData;
    click: RestockSession['clicks'][0];
    restockItem: RestockSession['items'][0];
  }[];
  fastestBuy?: {
    item: ItemData;
    timediff: number;
    timestamp: number;
  } | null;
  favoriteItem: {
    item?: ItemData | null;
    count: number;
  };
  buyCount: {
    [item_iid: number | string]: number;
  };
  unknownPrices: number;
};

type RestockChart = {
  revenuePerDay: { date: string; value: number }[];
  lossesPerDay: { date: string; value: number }[];
  refreshesPerDay: { date: string; value: number }[];
};

type UserPreferences = {
  labs_feedbackCopyEquals?: boolean;
  labs_feedbackShortcuts?: boolean;

  restock_prefView?: 'default' | 'rarity';
  dashboard_hideMisses?: boolean;
  dashboard_hidePrev?: boolean;

  dashboard_wrappedHide2025?: 'notJoined' | 'notReady' | 'ready';
};

type ItemEffect = {
  internal_id?: number;
  type: 'disease' | 'cureDisease' | 'heal' | 'stats' | 'colorSpecies' | 'petpetColor' | 'other';
  name: string;
  species?: string[] | null;
  minVal?: number | null;
  maxVal?: number | null;
  strVal?: string | null;
  text?: string | null;
  speciesTarget?: string | null;
  colorTarget?: string | null;
  isChance: boolean;
};

type UseTypes = {
  canEat: ThreeStateBoolean;
  canRead: ThreeStateBoolean;
  canPlay: ThreeStateBoolean;
  canOpen: ThreeStateBoolean;
};

type ThreeStateBoolean = 'true' | 'false' | 'unknown';

type ItemRecipe = {
  internal_id: number;
  result: ItemData;
  ingredients: ItemData[];
  type: string;
};

type ContributeWallData = {
  success: boolean;
  needTrades: number;
  needVotes: number;
};

type ItemMMEData = {
  name: string;
  isMini: boolean;
  initial: ItemData;
  bonus: ItemData;
  trails: {
    [trailName: string]: ItemData[];
  };
};

type ItemPetpetData = {
  petpet: ItemData;
  isUnpaintable: boolean;
  isCanonical: boolean;

  species: {
    name: string;
    id: number;
  };
  color: {
    name: string;
    id: number;
  };

  toCanonical: {
    pb: ItemData;
    p2: ItemData;
  } | null;

  cheapest: {
    items: ItemData[];
    cost: number | null;
  } | null;

  alternativeWays: ItemData[][] | null;
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
  itemNotes?: string;
};

export type FeedbackParsed = {
  ip: string;
  pageRef: string;
  content: any;
  autoPriceList?: number[];
  auto_ref?: number;
};

export type OwlsTrade = {
  ds: string;
  traded: string;
  traded_for: string;
  notes: string;
};

export type NCMallData = ItemMallData & {
  internal_id: number;
  item_iid: number;
  item_id: number;
  active: boolean;
  addedAt: string;
  updatedAt: string;
};

export type SaleStatus = {
  sold: number;
  total: number;
  percent: number;
  status: 'ets' | 'regular' | 'hts';
  type: 'buyable' | 'unbuyable';
  addedAt: string;
};

export type PricingInfo = {
  waitingTrades: {
    needPricing: number;
    needVoting: number;
  };
  dataStatus: {
    fresh: number;
    old: number;
  };
};

export type NCTradeReport = {
  offered: NCTradeItem[];
  received: NCTradeItem[];
  notes: string;
  date: string;
};

export type NCTradeItem = {
  item?: ItemData | null;
  itemName: string;
  personalValue: string;
  quantity: number;
};

export type NCValue = {
  minValue: number;
  maxValue: number;
  range: string;
  addedAt: string;
  source: 'itemdb' | 'lebron';
};

export type InsightsResponse = {
  releases: NCMallData[];
  ncEvents: UserList[];
  parentData: {
    [parent_iid: number]: {
      isLE: boolean;
    };
  };
  itemData: {
    [iid: string]: ItemData;
  };
};

export type LebronSearchResponse = {
  itemStats: {
    name: string;
    value: string;
    lastUpdated: number;
    isVolatile: boolean;
  };
  reports: LebronTrade[];
};

export type LebronTrade = {
  tradeDate: number;
  itemsSent: string;
  itemsReceived: string;
  notes: string;
};

export type WearableData = {
  zone_label: string[];
  zone_plain_label: string[];
  species_name: string[];
  canonicalZones: string[];
  canonicalSpecies: string;
};

export type APIKeyData = {
  key_id: number;
  api_key?: string;
  name: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  limit: number;
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
  bodyId: string;
  canvasMovieLibraryUrl?: string;
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

export type DTIBodiesAndTheirZones = {
  zones: {
    label: string;
  }[];
  body: {
    representsAllBodies: boolean;
    species: {
      name: string;
    } | null;
  };
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
  pose: string;
  restrictedZones: {
    id: string;
    depth: number;
    label: string;
  }[];
  species: {
    id: string;
    name: string;
  };
};

// ------ BD Types ----- //

export type BattleData = {
  battleId: number;
  result: 'win' | 'lose' | 'draw';
  attacks: BattleAttack[];
  roundLogs: {
    round: number;
    p1: {
      hp: number;
      isFrozen: boolean;
      usedFreezingAbility: boolean;
    };
    p2: {
      hp: number;
      isFrozen: boolean;
      usedFreezingAbility: boolean;
    };
  }[];
  p1: {
    stats?: {
      maxHP: number;
      agility: number;
      strength: number;
      defense: number;
    };
    name: string;
    fullHP: number;
  };
  p2: {
    name: string;
    fullHP: number;
  };
  difficulty: number;
  prizes: {
    type: 'np' | 'item';
    amount: number;
    item_id: number | null;
  };
};

export type BattleAttack = {
  round: number;
  text: string;
  player: 'p1' | 'p2';
  weapon: string;
  isAbility: boolean;
  weaponMaxUses: number | null;
  damage: (BattleDmg | BattleHeal | BattleDefense)[];
};

export interface BattleDmg {
  type: string;
  label: string;
  amount: number;
}

export interface BattleHeal extends BattleDmg {
  healInfo: {
    isOverHeal: boolean;
    percent: number;
  };
}

export interface BattleDefense extends BattleDmg {
  defenseInfo: {
    prevDmg: number;
    percent: number;
  };
}

export type BDIconTypes =
  | 'air'
  | 'darkness'
  | 'dark'
  | 'earth'
  | 'fire'
  | 'light'
  | 'water'
  | 'hp'
  | 'physical';

export type BDData = {
  attack?: { type: BDIconTypes; key: string; value: number | string }[];
  defense?: { type: BDIconTypes; key: string; value: number | string }[];
  reflect?: { type: BDIconTypes; key: string; value: number | string }[];
  other?: { [key: string]: string };
  processing?: boolean;
  notes?: string;
};

// ------ Global Window Types ----- //
declare global {
  interface Window {
    itemdb_restock?: {
      version?: string;
      versionCode?: number;
      scriptVersion?: number;
      getSessions: () => {
        unsync_sessions: RestockSession[];
        current_sessions: { [shopId: number]: restockSession };
      };
      cleanAll: () => void;
    };

    itemdb_script?: {
      version: string;
      versionCode: number;
    };

    itemdb_sdbPricer?: {
      version: string;
      versionCode: number;
    };

    umami?: {
      identify: (payload: any) => Promise<void>;
      track: (event: string, payload?: any) => Promise<void>;
    };

    __itemdb_proof__?: string;

    itemdb_restock_cleanAll?: () => void; //backwards compatibility
  }
}

declare module '*.jpg';
declare module '*.png';
declare module '*.svg';
