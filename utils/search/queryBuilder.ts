import Color from 'color';
import { Prisma } from '@prisma/generated/client';
import { SearchFilters } from '../../types';
import { parseFilters } from '../parseFilters';
import { faerielandShops, getDateNST, halloweenShops, tyrannianShops } from '../utils';

const validColorTypes = [
  'vibrant',
  'darkvibrant',
  'lightvibrant',
  'muted',
  'darkmuted',
  'lightmuted',
  'population',
];

type SearchListParams = {
  id: number;
  includeHidden?: boolean;
};

type BuildSearchQueryOptions = {
  query: string;
  filters?: SearchFilters;
  list?: SearchListParams;
  forceCategory?: string;
  isRestock?: boolean;
  includeZone?: boolean;
  enableFuzzySearch?: boolean;
  applyQueryFilters?: boolean;
  mode?: 'items' | 'count';
};

export type SearchQueryParts = {
  originalQuery: string;
  query: string;
  filters: SearchFilters;
  page: number;
  limit: number;
  isColorSearch: boolean;
  sortDir: string;
  tempQuery: Prisma.Sql;
  whereQuery: Prisma.Sql;
  sortQuery: Prisma.Sql;
};

export function buildSearchQueryParts(options: BuildSearchQueryOptions): SearchQueryParts {
  // Normalize the text query first; filter-like tokens embedded in the query are merged below.
  const originalQuery = options.query;
  const [queryFilters, querySanitized] = parseFilters(originalQuery, false);
  const query = querySanitized.trim() ?? '';
  const filters = {
    ...(options.applyQueryFilters === false ? {} : queryFilters),
    ...options.filters,
  } as SearchFilters;

  let { page, limit } = filters;
  limit = Number(limit) || 48;
  page = Number(page) || 1;
  page = page - 1;

  if (page < 0) page = 0;
  if (limit < 1) limit = 1;
  if (limit > 100000) limit = 100000;

  // Search-by-color uses the query itself as a LAB target; color filters use filters.color later.
  const isColorSearch = !!query.match(/^#[0-9A-Fa-f]{6}$/);
  const colorTolerance = isNaN(Number(filters.colorTolerance as string))
    ? 750
    : Number(filters.colorTolerance);
  const colorType =
    (filters.colorType as string) && validColorTypes.includes(filters.colorType.toLowerCase())
      ? filters.colorType
      : 'vibrant';

  let categoryFilters = (filters.category as string[]) ?? [];
  let typeFilters = (filters.type as string[]) ?? [];
  let statusFilters = (filters.status as string[]) ?? [];
  let zoneFilters = (filters.zone as string[]) ?? [];

  if (categoryFilters && !Array.isArray(categoryFilters)) categoryFilters = [categoryFilters];
  if (typeFilters && !Array.isArray(typeFilters)) typeFilters = [typeFilters];
  if (statusFilters && !Array.isArray(statusFilters)) statusFilters = [statusFilters];
  if (zoneFilters && !Array.isArray(zoneFilters)) zoneFilters = [zoneFilters];

  const priceFilter = (filters.price as string[]) ?? [];
  const weightFilter = (filters.weight as string[]) ?? [];
  const rarityFilter = (filters.rarity as string[]) ?? [];
  const estValFilter = (filters.estVal as string[]) ?? [];
  const ncValueFilter = (filters.ncValue as string[]) ?? [];
  const petpetColor = (filters.petpetColor as string[]) ?? [];
  const petpetSpecies = (filters.petpetSpecies as string[]) ?? [];
  const restockProfit = (filters.restockProfit as string) ?? '';

  let petpetPaintable =
    typeof filters.p2Paintable !== 'undefined' ? (filters.p2Paintable as any) == 'true' : undefined;
  let petpetCanonical =
    typeof filters.p2Canonical !== 'undefined' ? (filters.p2Canonical as any) == 'true' : undefined;

  let colorFilter = (filters.color as string) ?? '';
  const sortBy = (filters.sortBy as string) ?? 'name';
  let sortDir = (filters.sortDir as string) ?? 'asc';
  const mode = (filters.mode as string) ?? 'name';

  // Facet filters operate on the outer temp alias so the same predicates work for item pages,
  // counts, and stats. Unknown/null behavior mirrors the existing UI filter semantics.
  const catFiltersSQL: Prisma.Sql[] = [];

  if (categoryFilters.length > 0) {
    const catNeg = categoryFilters
      .filter((o: string) => o.startsWith('!'))
      .map((o: string) => o.slice(1).toLowerCase());
    const catTrue = categoryFilters
      .filter((o: string) => !o.startsWith('!'))
      .map((a) => a.toLowerCase());

    if (catNeg.length > 0 && !catNeg.includes('unknown'))
      catFiltersSQL.push(
        Prisma.sql`(temp.category NOT IN (${Prisma.join(catNeg)}) OR temp.category IS NULL)`
      );
    else if (catNeg.length > 0)
      catFiltersSQL.push(
        Prisma.sql`(temp.category NOT IN (${Prisma.join(catNeg)}) AND temp.category IS NOT NULL)`
      );

    if (catTrue.length > 0 && !catTrue.includes('unknown'))
      catFiltersSQL.push(Prisma.sql`temp.category IN (${Prisma.join(catTrue)})`);
    else if (catTrue.length > 0)
      catFiltersSQL.push(
        Prisma.sql`(temp.category IN (${Prisma.join(catTrue)}) OR temp.category IS NULL)`
      );
  }

  const zoneFilterSQL: Prisma.Sql[] = [];

  if (zoneFilters.length > 0) {
    const zoneNeg = zoneFilters
      .filter((o: string) => o.startsWith('!'))
      .map((o: string) => o.slice(1).toLowerCase());
    const zoneTrue = zoneFilters
      .filter((o: string) => !o.startsWith('!'))
      .map((a) => a.toLowerCase());

    if (zoneNeg.length > 0 && !zoneNeg.includes('unknown'))
      zoneFilterSQL.push(
        Prisma.sql`(temp.zone_label NOT IN (${Prisma.join(zoneNeg)}) OR temp.zone_label IS NULL)`
      );
    else if (zoneNeg.length > 0)
      zoneFilterSQL.push(
        Prisma.sql`(temp.zone_label NOT IN (${Prisma.join(
          zoneNeg
        )}) AND temp.zone_label IS NOT NULL)`
      );

    if (zoneTrue.length > 0 && !zoneTrue.includes('unknown'))
      zoneFilterSQL.push(Prisma.sql`temp.zone_label IN (${Prisma.join(zoneTrue)})`);
    else if (zoneTrue.length > 0)
      zoneFilterSQL.push(
        Prisma.sql`(temp.zone_label IN (${Prisma.join(zoneTrue)}) OR temp.zone_label IS NULL)`
      );
  }

  const typeFiltersSQL: Prisma.Sql[] = [];

  if (typeFilters.length > 0) {
    const typeNeg = typeFilters
      .filter((o: string) => o.startsWith('!'))
      .map((o: string) => o.slice(1));
    const typeTrue = typeFilters.filter((o: string) => !o.startsWith('!'));

    const skipColumns = [
      'wearable',
      'neohome',
      'battledome',
      'canEat',
      'canRead',
      'canPlay',
      'hts',
      'ets',
      'regular',
      'collectible',
      'p2Paintable',
      'p2Canonical',
    ];

    if (typeNeg.length > 0) {
      const type_column = typeNeg.filter((o: string) => !skipColumns.includes(o));

      if (type_column.length > 0)
        typeFiltersSQL.push(Prisma.sql`temp.type NOT IN (${Prisma.join(type_column)})`);

      if (typeNeg.includes('battledome')) typeFiltersSQL.push(Prisma.sql`temp.isBD = 0`);
      if (typeNeg.includes('wearable')) typeFiltersSQL.push(Prisma.sql`temp.isWearable = 0`);
      if (typeNeg.includes('neohome')) typeFiltersSQL.push(Prisma.sql`temp.isNeohome = 0`);

      if (typeNeg.includes('canEat')) typeFiltersSQL.push(Prisma.sql`temp.canEat != 'true'`);
      if (typeNeg.includes('canRead')) typeFiltersSQL.push(Prisma.sql`temp.canRead != 'true'`);
      if (typeNeg.includes('canPlay')) typeFiltersSQL.push(Prisma.sql`temp.canPlay != 'true'`);

      if (typeNeg.includes('hts')) typeFiltersSQL.push(Prisma.sql`temp.stats != 'hts'`);
      if (typeNeg.includes('ets')) typeFiltersSQL.push(Prisma.sql`temp.stats != 'ets'`);
      if (typeNeg.includes('regular')) typeFiltersSQL.push(Prisma.sql`temp.stats != 'regular'`);

      if (typeNeg.includes('collectible')) {
        typeFiltersSQL.push(
          Prisma.sql`not exists (select 1 from listitems li left join userlist l on l.internal_id = li.list_id where li.item_iid = temp.internal_id and l.official = 1 and l.official_tag = 'stamps')`
        );
      }

      if (typeNeg.includes('p2Paintable')) petpetPaintable = false;
      if (typeNeg.includes('p2Canonical')) petpetCanonical = false;
    }

    if (typeTrue.length > 0) {
      const type_column = typeTrue.filter((o: string) => !skipColumns.includes(o));

      if (type_column.length > 0)
        typeFiltersSQL.push(Prisma.sql`temp.type IN (${Prisma.join(type_column)})`);

      if (typeTrue.includes('battledome')) typeFiltersSQL.push(Prisma.sql`temp.isBD = 1`);
      if (typeTrue.includes('wearable')) typeFiltersSQL.push(Prisma.sql`temp.isWearable = 1`);
      if (typeTrue.includes('neohome')) typeFiltersSQL.push(Prisma.sql`temp.isNeohome = 1`);

      if (typeTrue.includes('canEat')) typeFiltersSQL.push(Prisma.sql`temp.canEat = 'true'`);
      if (typeTrue.includes('canRead')) typeFiltersSQL.push(Prisma.sql`temp.canRead = 'true'`);
      if (typeTrue.includes('canPlay')) typeFiltersSQL.push(Prisma.sql`temp.canPlay = 'true'`);

      if (typeTrue.includes('hts')) typeFiltersSQL.push(Prisma.sql`temp.stats = 'hts'`);
      if (typeTrue.includes('ets')) typeFiltersSQL.push(Prisma.sql`temp.stats = 'ets'`);
      if (typeTrue.includes('regular')) typeFiltersSQL.push(Prisma.sql`temp.stats = 'regular'`);

      if (typeTrue.includes('collectible')) {
        typeFiltersSQL.push(
          Prisma.sql`exists (select 1 from listitems li left join userlist l on l.internal_id = li.list_id where li.item_iid = temp.internal_id and l.official = 1 and l.official_tag = 'stamps')`
        );
      }

      if (typeTrue.includes('p2Paintable')) petpetPaintable = true;
      if (typeTrue.includes('p2Canonical')) petpetCanonical = true;
    }
  }

  const statusFiltersSQL: Prisma.Sql[] = [];

  if (statusFilters.length > 0) {
    const statusNeg = statusFilters
      .filter((o: string) => o.startsWith('!'))
      .map((o: string) => o.slice(1));
    const statusTrue = statusFilters.filter((o: string) => !o.startsWith('!'));

    if (statusNeg.length > 0 && !statusNeg.includes('Unknown'))
      statusFiltersSQL.push(
        Prisma.sql`(temp.status NOT IN (${Prisma.join(statusNeg)}) OR temp.status IS NULL)`
      );
    else if (statusNeg.length > 0)
      statusFiltersSQL.push(
        Prisma.sql`(temp.status NOT IN (${Prisma.join(statusNeg)}) AND temp.status IS NOT NULL)`
      );

    if (statusTrue.length > 0 && !statusTrue.includes('Unknown'))
      statusFiltersSQL.push(Prisma.sql`temp.status IN (${Prisma.join(statusTrue)})`);
    else if (statusTrue.length > 0)
      statusFiltersSQL.push(
        Prisma.sql`(temp.status IN (${Prisma.join(statusTrue)}) OR temp.status IS NULL)`
      );
  }

  const numberFilters: Prisma.Sql[] = [];
  if (priceFilter.length > 0) {
    if (priceFilter[0] !== '')
      numberFilters.push(Prisma.sql`temp.price >= ${parseInt(priceFilter[0])}`);
    if (priceFilter[1] !== '')
      numberFilters.push(Prisma.sql`temp.price <= ${parseInt(priceFilter[1])}`);
  }

  if (weightFilter.length > 0) {
    if (weightFilter[0] !== '')
      numberFilters.push(Prisma.sql`temp.weight >= ${parseInt(weightFilter[0])}`);
    if (weightFilter[1] !== '')
      numberFilters.push(Prisma.sql`temp.weight <= ${parseInt(weightFilter[1])}`);
  }

  if (estValFilter.length > 0) {
    if (estValFilter[0] !== '')
      numberFilters.push(Prisma.sql`temp.est_val >= ${parseInt(estValFilter[0])}`);
    if (estValFilter[1] !== '')
      numberFilters.push(Prisma.sql`temp.est_val <= ${parseInt(estValFilter[1])}`);
  }

  if (rarityFilter.length > 0) {
    if (rarityFilter[0] !== '')
      numberFilters.push(Prisma.sql`temp.rarity >= ${parseInt(rarityFilter[0])}`);
    if (rarityFilter[1] !== '')
      numberFilters.push(Prisma.sql`temp.rarity <= ${parseInt(rarityFilter[1])}`);
  }

  if (ncValueFilter.length > 0) {
    if (ncValueFilter[0] !== '')
      numberFilters.push(Prisma.sql`temp.owlsValueMin >= ${parseInt(ncValueFilter[0])}`);
    if (ncValueFilter[1] !== '')
      numberFilters.push(Prisma.sql`temp.owlsValueMin <= ${parseInt(ncValueFilter[1])}`);
  }

  if (restockProfit !== '' && !isNaN(Number(restockProfit))) {
    const minProfit = Number(restockProfit);
    const includeUnpriced = filters.restockIncludeUnpriced;
    const todayNST = getDateNST();

    // Restock profit changes on shop discount days; keep this logic in the query layer so
    // search pages, count-only calls, and stats all agree on the eligible item set.
    if (todayNST.getDate() === 3) {
      numberFilters.push(getRestockQuery(0.5, minProfit, includeUnpriced));
    } else if (todayNST.getMonth() === 4 && todayNST.getDate() === 12) {
      numberFilters.push(Prisma.sql`
        ((temp.category in (${Prisma.join(tyrannianShops)}) AND ${getRestockQuery(
          0.2,
          minProfit,
          includeUnpriced
        )}) OR (${getRestockQuery(1, minProfit, includeUnpriced)}))
      `);
    } else if (todayNST.getMonth() === 7 && todayNST.getDate() === 20) {
      numberFilters.push(Prisma.sql`
        ((temp.category = 'usuki doll' AND ${getRestockQuery(
          0.33,
          minProfit,
          includeUnpriced
        )}) OR (${getRestockQuery(1, minProfit, includeUnpriced)}))
      `);
    } else if (todayNST.getMonth() === 8 && todayNST.getDate() === 20) {
      numberFilters.push(Prisma.sql`
        ((temp.category in (${Prisma.join(faerielandShops)}) AND ${getRestockQuery(
          0.5,
          minProfit,
          includeUnpriced
        )}) OR (${getRestockQuery(1, minProfit, includeUnpriced)}))
      `);
    } else if (todayNST.getMonth() === 9 && todayNST.getDate() === 31) {
      numberFilters.push(Prisma.sql`
        ((temp.category in (${Prisma.join(halloweenShops)}) AND ${getRestockQuery(
          0.5,
          minProfit,
          includeUnpriced
        )}) OR (${getRestockQuery(1, minProfit, includeUnpriced)}))
      `);
    } else {
      numberFilters.push(getRestockQuery(1, minProfit, includeUnpriced));
    }
  }

  // Petpet filters add one optional join and expose a few joined fields only when needed.
  let petpetJoin = Prisma.empty;
  const petpetSQL: Prisma.Sql[] = [];
  if (
    petpetColor.length > 0 ||
    petpetSpecies.length > 0 ||
    typeof petpetPaintable !== 'undefined' ||
    typeof petpetCanonical !== 'undefined'
  ) {
    petpetJoin = Prisma.sql`LEFT JOIN PetpetColors as pc on pc.item_iid = a.internal_id`;
    const allP2 = Number(petpetSpecies[0]) === -2;

    if (allP2) petpetSQL.push(Prisma.sql`petpet_id is not null`);

    if (!allP2 && petpetSpecies.length > 0)
      petpetSQL.push(Prisma.sql`petpet_id in (${Prisma.join(petpetSpecies)})`);

    if (petpetColor.length > 0)
      petpetSQL.push(Prisma.sql`color_id in (${Prisma.join(petpetColor)})`);

    if (typeof petpetPaintable !== 'undefined')
      petpetSQL.push(Prisma.sql`isUnpaintable = ${petpetPaintable ? 0 : 1}`);

    if (typeof petpetCanonical !== 'undefined')
      if (petpetCanonical) petpetSQL.push(Prisma.sql`p2Canonical = 1`);
      else petpetSQL.push(Prisma.sql`(petpet_id is not null and p2Canonical IS NULL)`);
  }

  let colorSqlInside;
  let colorSqlOutside;
  let isColorNeg = false;
  // filters.color is a secondary color filter. It can be negated with "!#rrggbb".
  if (colorFilter.match(/^!?#[0-9A-Fa-f]{6}$/)) {
    if (colorFilter.startsWith('!')) {
      isColorNeg = true;
      colorFilter = colorFilter.slice(1);
    }

    const parsedColor = Color(colorFilter);
    const [l, a, b] = parsedColor.lab().array();
    colorSqlInside = Prisma.sql`(POWER(b.lab_l-${l},2)+POWER(b.lab_a-${a},2)+POWER(b.lab_b-${b},2))`;
    colorSqlOutside = Prisma.sql`(POWER(temp.lab_l-${l},2)+POWER(temp.lab_a-${a},2)+POWER(temp.lab_b-${b},2))`;
  }

  const colorTypeSQL =
    colorType === 'population'
      ? Prisma.sql`b.isMaxPopulation = 1`
      : Prisma.sql`b.type = ${colorType}`;

  let searchColorDistance = Prisma.empty;
  let searchColorItemDistance = Prisma.empty;
  let searchColorJoin = Prisma.empty;
  // Search-by-color first finds the nearest palette color per image, then joins that exact
  // color row so sorting and item serialization can use the winning color.
  if (isColorSearch) {
    const parsedColor = Color(query);
    const [l, a, b] = parsedColor.lab().array();
    searchColorDistance = Prisma.sql`(POWER(lab_l-${l},2)+POWER(lab_a-${a},2)+POWER(lab_b-${b},2))`;
    searchColorItemDistance = Prisma.sql`(POWER(b.lab_l-${l},2)+POWER(b.lab_a-${a},2)+POWER(b.lab_b-${b},2))`;
    searchColorJoin = Prisma.sql`
      LEFT JOIN (
        SELECT image_id, min(${searchColorDistance}) as dist
        FROM ItemColor
        GROUP BY image_id
        having dist <= ${colorTolerance}
      ) as f on a.image_id = f.image_id
    `;
  }

  const shouldJoinZone = options.includeZone || zoneFilterSQL.length > 0;
  const isCountMode = options.mode === 'count';
  // Count mode is used by onlyStats=true. It keeps every filter valid, but avoids payload-only
  // joins and columns. The needs* flags explain which filters/sorts require each optional join.
  const isSaleStatusFilter = typeFilters.some((type) =>
    ['ets', 'hts', 'regular', '!ets', '!hts', '!regular'].includes(type)
  );

  const needsPrices = priceFilter.length > 0 || restockProfit !== '' || sortBy === 'price';
  const needsOwlsPrice = ncValueFilter.length > 0 || sortBy === 'ncValue';
  const needsItemColor = isColorSearch || !!colorSqlInside || sortBy === 'color';

  const includePrices = !isCountMode || needsPrices;
  const includeNcValues = !isCountMode;
  const includeSaleStats = !isCountMode || isSaleStatusFilter;
  const includeOwlsPrice = !isCountMode || needsOwlsPrice;
  const includeNcMallData = !isCountMode;

  // Small helper to keep the SQL template readable when optional select/join fragments are empty.
  const sqlIf = (condition: boolean, sql: Prisma.Sql) => (condition ? sql : Prisma.empty);

  // Select fragments define the temp table shape. Some null aliases are intentionally kept in
  // count mode because filters/sorts below still reference temp.price, temp.stats, or temp.owlsValueMin.
  const itemColorSelect = sqlIf(
    !isCountMode || needsItemColor,
    isCountMode
      ? Prisma.sql`, b.lab_l, b.lab_a, b.lab_b, b.hsv_h, b.hsv_s, b.hsv_v`
      : Prisma.sql`, b.lab_l, b.lab_a, b.lab_b, b.population, b.rgb_r, b.rgb_g, b.rgb_b, b.hex, b.hsv_h, b.hsv_s, b.hsv_v`
  );
  const priceSelect = includePrices
    ? Prisma.sql`, c.addedAt as priceAdded, c.price, c.noInflation_id`
    : Prisma.sql`, null as price`;
  const ncValueSelect = sqlIf(
    includeNcValues,
    Prisma.sql`, d.addedAt as ncValueAddedAt, d.minValue, d.maxValue, d.valueRange`
  );
  const saleStatsSelect = includeSaleStats
    ? Prisma.sql`, s.totalSold, s.totalItems, s.stats, s.daysPeriod, s.addedAt as saleAdded`
    : Prisma.sql`, null as stats`;
  const owlsPriceSelect = includeOwlsPrice
    ? Prisma.sql`, o.pricedAt as owlsPriced, o.value as owlsValue, o.valueMin as owlsValueMin`
    : Prisma.sql`, null as owlsValueMin`;
  const ncMallSelect = sqlIf(
    includeNcMallData,
    Prisma.sql`, n.price as ncPrice, n.saleBegin, n.saleEnd, n.discountBegin, n.discountEnd, n.discountPrice`
  );

  const priceJoin = sqlIf(
    includePrices,
    Prisma.sql`LEFT JOIN ItemPrices as c on c.item_iid = a.internal_id and c.isLatest = 1`
  );
  const ncValueJoin = sqlIf(
    includeNcValues,
    Prisma.sql`LEFT JOIN ncValues as d on d.item_iid = a.internal_id and d.isLatest = 1`
  );
  const saleStatsJoin = sqlIf(
    includeSaleStats,
    Prisma.sql`LEFT JOIN SaleStats as s on s.item_iid = a.internal_id and s.isLatest = 1 and s.stats != "unknown"`
  );
  const owlsPriceJoin = sqlIf(
    includeOwlsPrice,
    Prisma.sql`LEFT JOIN owlsPrice as o on o.item_iid = a.internal_id and o.isLatest = 1`
  );
  const ncMallJoin = sqlIf(
    includeNcMallData,
    Prisma.sql`LEFT JOIN NcMallData as n on n.item_iid = a.internal_id and n.active = 1`
  );
  const zoneJoin = sqlIf(
    shouldJoinZone,
    Prisma.sql`LEFT JOIN WearableData w on w.item_iid = a.internal_id and w.isCanonical = 1`
  );
  const petpetSelect = sqlIf(
    petpetSQL.length > 0,
    Prisma.sql`, pc.isCanonical as p2Canonical, pc.color_id, pc.petpet_id, pc.isUnpaintable`
  );

  // Base SELECT: this is intentionally a derived table. Outer WHERE/SORT clauses can then be
  // assembled once and reused by normal search, count mode, and search stats.
  const tempQuery = Prisma.sql`
    SELECT a.*${itemColorSelect}
      ${priceSelect}
      ${ncValueSelect}
      ${saleStatsSelect}
      ${owlsPriceSelect}
      ${ncMallSelect}
      ${isColorSearch ? Prisma.sql`, f.dist` : Prisma.empty}
      ${!isColorSearch && colorSqlInside ? Prisma.sql`, ${colorSqlInside} as dist` : Prisma.empty}
      ${shouldJoinZone ? Prisma.sql`, w.zone_label` : Prisma.empty}
      ${petpetSelect}
    FROM Items as a
    ${searchColorJoin}
    LEFT JOIN ItemColor as b on a.image_id = b.image_id and ${
      isColorSearch
        ? Prisma.sql`${searchColorItemDistance} = f.dist`
        : Prisma.sql`${colorTypeSQL} ${colorSqlInside ? Prisma.sql`and b.population > 0` : Prisma.empty}`
    }
    ${priceJoin}
    ${ncValueJoin}
    ${saleStatsJoin}
    ${owlsPriceJoin}
    ${ncMallJoin}
    ${zoneJoin}
    ${petpetJoin}
  `;

  // ORDER BY is also emitted as a fragment so callers can omit it for pure count queries.
  let sortQuery;

  if (sortBy === 'name') sortQuery = Prisma.sql`ORDER BY temp.name`;
  else if (sortBy === 'price') sortQuery = Prisma.sql`ORDER BY temp.price`;
  else if (sortBy === 'added') sortQuery = Prisma.sql`ORDER BY temp.addedAt`;
  else if (sortBy === 'ncValue') sortQuery = Prisma.sql`ORDER BY temp.owlsValueMin`;
  else if (sortBy === 'color' && isColorSearch) sortQuery = Prisma.sql`ORDER BY dist`;
  else if (sortBy === 'color')
    sortQuery = Prisma.sql`ORDER BY temp.hsv_h ${
      sortDir === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`
    }, temp.hsv_s ${sortDir === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`}, temp.hsv_v`;
  else if (sortBy === 'weight') sortQuery = Prisma.sql`ORDER BY temp.weight`;
  else if (sortBy === 'estVal') sortQuery = Prisma.sql`ORDER BY temp.est_val`;
  else if (sortBy === 'id') sortQuery = Prisma.sql`ORDER BY temp.item_id`;
  else if (sortBy === 'rarity') sortQuery = Prisma.sql`ORDER BY temp.rarity`;
  else if (sortBy === 'match')
    sortQuery = Prisma.sql`ORDER BY temp.name = ${originalQuery} DESC, MATCH (temp.name) AGAINST (${originalQuery} IN NATURAL LANGUAGE MODE) desc, temp.name`;
  else sortQuery = isColorSearch ? Prisma.sql`ORDER BY dist` : Prisma.sql`ORDER BY temp.name`;

  // Text search predicate. Color search bypasses fulltext because the query has already been
  // interpreted as a color target.
  let fulltext;

  if (isColorSearch || query === '') fulltext = Prisma.sql`1`;
  else if (mode === 'natural')
    fulltext = Prisma.sql`MATCH (temp.name) AGAINST (${originalQuery} IN NATURAL LANGUAGE MODE)`;
  else if (mode === 'boolean')
    fulltext = Prisma.sql`MATCH (temp.name) AGAINST (${query} IN BOOLEAN MODE)`;
  else if (mode === 'all')
    fulltext = Prisma.sql`MATCH (temp.name, temp.description) AGAINST (${query} IN BOOLEAN MODE) OR temp.name LIKE ${`%${originalQuery}%`} OR temp.description LIKE ${`%${originalQuery}%`}`;
  else if (mode === 'description')
    fulltext = Prisma.sql`MATCH (temp.description) AGAINST (${query} IN BOOLEAN MODE) OR temp.description LIKE ${`%${originalQuery}%`}`;
  else if (mode === 'fuzzy' && options.enableFuzzySearch) {
    fulltext = Prisma.sql`bounded_edit_dist_t(${originalQuery.toLowerCase()}, LOWER(temp.name), 6) <= 6`;
    sortQuery = Prisma.sql`ORDER BY bounded_edit_dist_t(${originalQuery.toLowerCase()}, LOWER(temp.name), 6), name`;
    sortDir = 'asc';
  } else if (mode === 'not') {
    fulltext = Prisma.sql`temp.name NOT LIKE ${`%${originalQuery}%`}`;
  } else
    fulltext = Prisma.sql`MATCH (temp.name) AGAINST (${query} IN BOOLEAN MODE) OR temp.name LIKE ${`%${originalQuery}%`}`;

  // Final WHERE: every predicate references temp.*, which lets callers wrap tempQuery however
  // they need without rebuilding filter logic.
  const whereSQL: Prisma.Sql[] = [Prisma.sql`(${fulltext})`, Prisma.sql`temp.canonical_id is null`];

  if (isColorSearch) whereSQL.push(Prisma.sql`temp.dist is not null`);
  if (catFiltersSQL.length > 0) whereSQL.push(Prisma.sql`${Prisma.join(catFiltersSQL, ' AND ')}`);
  if (typeFiltersSQL.length > 0) whereSQL.push(Prisma.sql`${Prisma.join(typeFiltersSQL, ' AND ')}`);
  if (statusFiltersSQL.length > 0)
    whereSQL.push(Prisma.sql`${Prisma.join(statusFiltersSQL, ' AND ')}`);
  if (numberFilters.length > 0) whereSQL.push(Prisma.sql`${Prisma.join(numberFilters, ' AND ')}`);
  if (colorSqlOutside && !isColorNeg)
    whereSQL.push(Prisma.sql`${colorSqlOutside} <= ${colorTolerance}`);
  if (colorSqlOutside && isColorNeg)
    whereSQL.push(Prisma.sql`${colorSqlOutside} > ${colorTolerance}`);
  if (zoneFilterSQL.length > 0) whereSQL.push(Prisma.sql`${Prisma.join(zoneFilterSQL, ' AND ')}`);
  if (options.list?.id) {
    const hiddenQuery = !options.list.includeHidden
      ? Prisma.sql`AND li.isHidden = 0`
      : Prisma.empty;
    whereSQL.push(
      Prisma.sql`exists (select 1 from listitems li where li.item_iid = temp.internal_id and li.list_id = ${options.list.id} ${hiddenQuery})`
    );
  }
  if (petpetSQL.length > 0) whereSQL.push(Prisma.sql`${Prisma.join(petpetSQL, ' AND ')}`);
  if (options.forceCategory) whereSQL.push(Prisma.sql`temp.category = ${options.forceCategory}`);
  if (options.isRestock) whereSQL.push(Prisma.sql`temp.rarity <= 100`);

  return {
    originalQuery,
    query,
    filters,
    page,
    limit,
    isColorSearch,
    sortDir,
    tempQuery,
    whereQuery: Prisma.sql`WHERE ${Prisma.join(whereSQL, ' AND ')}`,
    sortQuery,
  };
}

const getRestockQuery = (
  multiplier: number,
  minProfit: number,
  includeUnpriced = false
) => Prisma.sql`
(
  (temp.rarity <= 84 AND temp.price - GREATEST(100, temp.est_val * 1.9) * ${multiplier} >= ${minProfit} ) OR
  (temp.rarity >= 85 AND temp.rarity <= 89 AND temp.price - GREATEST(2500, temp.est_val * 1.9) * ${multiplier} >= ${minProfit} ) OR
  (temp.rarity >= 90 AND temp.rarity <= 94 AND temp.price - GREATEST(5000, temp.est_val * 1.9) * ${multiplier} >= ${minProfit} ) OR
  (temp.rarity >= 95 AND temp.rarity <= 100 AND temp.price - GREATEST(1000, temp.est_val * 1.9) * ${multiplier} >= ${minProfit} ) 
  ${includeUnpriced ? Prisma.sql` OR temp.price IS NULL` : Prisma.empty}
)
`;
