/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import {
  faerielandShops,
  getDateNST,
  getItemFindAtLinks,
  halloweenShops,
  isMissingInfo,
  tyrannianShops,
} from '../../../../utils/utils';
import { ItemData, SearchFilters } from '../../../../types';
import Color from 'color';
import { Prisma } from '@prisma/client';
import qs from 'qs';
import { parseFilters } from '../../../../utils/parseFilters';
import requestIp from 'request-ip';
import { redis_setItemCount } from '../../redis/checkapi';

const ENV_FUZZY_SEARCH = process.env.HAS_FUZZY_SEARCH === 'true';

const DISABLE_SALE_STATS = process.env.DISABLE_SALE_STATS === 'true';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' || !req.url)
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const reqQuery = qs.parse(req.url.split('?')[1]) as any;
  const query = (reqQuery.s as string)?.trim() ?? '';
  const skipStats = reqQuery.skipStats === 'true';
  const onlyStats = reqQuery.onlyStats === 'true';

  reqQuery.page = parseInt(reqQuery.page as string) || 1;
  reqQuery.limit = parseInt(reqQuery.limit as string) || 48;
  reqQuery.limit = Math.min(reqQuery.limit, 3000);

  const result = await doSearch(query, reqQuery, !skipStats, 0, false, onlyStats);

  const ip = requestIp.getClientIp(req);
  await redis_setItemCount(ip, result.content.length, req);

  res.json(result);
}

const validColorTypes = [
  'vibrant',
  'darkvibrant',
  'lightvibrant',
  'muted',
  'darkmuted',
  'lightmuted',
  'population',
];

export async function doSearch(
  query: string,
  filters?: SearchFilters,
  includeStats = true,
  list_id = 0,
  includeHidden = false,
  onlyStats = false
) {
  const originalQuery = query;
  const [queryFilters, querySanitezed] = parseFilters(originalQuery, false);

  query = querySanitezed.trim() ?? '';

  filters = { ...queryFilters, ...filters };

  let { page, limit } = filters;

  page = page - 1;

  const isColorSearch = !!query.match(/^#[0-9A-Fa-f]{6}$/);

  if (page < 0) page = 0;
  if (limit < 1) limit = 1;
  if (limit > 10000) limit = 10000;

  let categoryFilters = (filters.category as string[]) ?? [];
  let typeFilters = (filters.type as string[]) ?? [];
  let statusFilters = (filters.status as string[]) ?? [];
  let zoneFilters = (filters.zone as string[]) ?? [];

  const colorTolerance = isNaN(Number(filters.colorTolerance as string))
    ? 750
    : Number(filters.colorTolerance);
  const colorType =
    (filters.colorType as string) && validColorTypes.includes(filters.colorType.toLowerCase())
      ? filters.colorType
      : 'vibrant';

  const priceFilter = (filters.price as string[]) ?? [];
  const weightFilter = (filters.weight as string[]) ?? [];
  const rarityFilter = (filters.rarity as string[]) ?? [];
  const estValFilter = (filters.estVal as string[]) ?? [];
  const owlsFilter = (filters.owlsValue as string[]) ?? [];
  const petpetColor = (filters.petpetColor as string[]) ?? [];
  const petpetSpecies = (filters.petpetSpecies as string[]) ?? [];
  const petpetOnlyPaintable = (filters.petpetOnlyPaintable as boolean) ?? false;
  const restockProfit = (filters.restockProfit as string) ?? '';

  let colorFilter = (filters.color as string) ?? '';

  const sortBy = (filters.sortBy as string) ?? 'name';
  let sortDir = (filters.sortDir as string) ?? 'asc';
  const mode = (filters.mode as string) ?? 'name';

  if (categoryFilters && !Array.isArray(categoryFilters)) categoryFilters = [categoryFilters];
  if (typeFilters && !Array.isArray(typeFilters)) typeFilters = [typeFilters];
  if (statusFilters && !Array.isArray(statusFilters)) statusFilters = [statusFilters];
  if (zoneFilters && !Array.isArray(zoneFilters)) zoneFilters = [zoneFilters];

  const hiddenQuery = !includeHidden ? Prisma.sql`AND isHidden = 0` : Prisma.empty;

  const catFiltersSQL = [];

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

  const zoneFilterSQL = [];

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

  const typeFiltersSQL = [];

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
    }
  }

  const statusFiltersSQL = [];

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

  const numberFilters = [];
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

  if (owlsFilter.length > 0) {
    if (owlsFilter[0] !== '')
      numberFilters.push(Prisma.sql`temp.owlsValueMin >= ${parseInt(owlsFilter[0])}`);
    if (owlsFilter[1] !== '')
      numberFilters.push(Prisma.sql`temp.owlsValueMin <= ${parseInt(owlsFilter[1])}`);
  }

  if (restockProfit !== '' && !isNaN(Number(restockProfit))) {
    const minProfit = Number(restockProfit);
    const includeUnpriced = filters.restockIncludeUnpriced;
    const todayNST = getDateNST();

    if (todayNST.getDate() === 3) {
      numberFilters.push(getRestockQuery(0.5, minProfit, includeUnpriced));
    }

    // may 12
    else if (todayNST.getMonth() === 4 && todayNST.getDate() === 12) {
      numberFilters.push(Prisma.sql`
        ((temp.category in (${Prisma.join(tyrannianShops)}) AND ${getRestockQuery(
        0.2,
        minProfit,
        includeUnpriced
      )}) OR (${getRestockQuery(1, minProfit, includeUnpriced)}))
      `);
    }

    //aug 20
    else if (todayNST.getMonth() === 7 && todayNST.getDate() === 20) {
      numberFilters.push(Prisma.sql`
        ((temp.category = 'usuki doll' AND ${getRestockQuery(
          0.33,
          minProfit,
          includeUnpriced
        )}) OR (${getRestockQuery(1, minProfit, includeUnpriced)}))
      `);
    }

    // sept 20
    else if (todayNST.getMonth() === 8 && todayNST.getDate() === 20) {
      numberFilters.push(Prisma.sql`
        ((temp.category in (${Prisma.join(faerielandShops)}) AND ${getRestockQuery(
        0.5,
        minProfit,
        includeUnpriced
      )}) OR (${getRestockQuery(1, minProfit, includeUnpriced)}))
      `);
    }

    // oct 31
    else if (todayNST.getMonth() === 9 && todayNST.getDate() === 31) {
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

  let petpetJoin = Prisma.empty;
  const petpetSQL = [];
  if (petpetColor.length > 0 || petpetSpecies.length > 0) {
    petpetJoin = Prisma.sql`LEFT JOIN PetpetColors as pc on pc.item_iid = a.internal_id`;

    if (petpetSpecies.length > 0)
      petpetSQL.push(Prisma.sql`petpet_id in (${Prisma.join(petpetSpecies)})`);

    if (petpetColor.length > 0)
      petpetSQL.push(Prisma.sql`color_id in (${Prisma.join(petpetColor)})`);

    if (petpetOnlyPaintable) petpetSQL.push(Prisma.sql`isUnpaintable = 0`);
  }

  let colorSql_inside;
  let colorSql_outside;
  let isColorNeg = false;
  if (colorFilter.match(/#[0-9A-Fa-f]{6}$/gm)) {
    if (colorFilter.startsWith('!')) {
      isColorNeg = true;
      colorFilter = colorFilter.slice(1);
    }

    const parsedColor = Color(colorFilter);
    const [l, a, b] = parsedColor.lab().array();
    colorSql_inside = Prisma.sql`(POWER(b.lab_l-${l},2)+POWER(b.lab_a-${a},2)+POWER(b.lab_b-${b},2))`;
    colorSql_outside = Prisma.sql`(POWER(temp.lab_l-${l},2)+POWER(temp.lab_a-${a},2)+POWER(temp.lab_b-${b},2))`;
  }

  let colorTypeSQL;
  if (colorType === 'population') colorTypeSQL = Prisma.sql`b.isMaxPopulation = 1`;
  else colorTypeSQL = Prisma.sql`b.type = ${colorType}`;

  let sortSQL;

  if (sortBy === 'name') sortSQL = Prisma.sql`ORDER BY temp.name`;
  else if (sortBy === 'price') sortSQL = Prisma.sql`ORDER BY temp.price`;
  else if (sortBy === 'added') sortSQL = Prisma.sql`ORDER BY temp.addedAt`;
  else if (sortBy === 'owls') sortSQL = Prisma.sql`ORDER BY temp.owlsValueMin`;
  else if (sortBy === 'color' && isColorSearch) sortSQL = Prisma.sql`ORDER BY dist`;
  else if (sortBy === 'color')
    sortSQL = Prisma.sql`ORDER BY temp.hsv_h ${
      sortDir === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`
    }, temp.hsv_s ${sortDir === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`}, temp.hsv_v`;
  else if (sortBy === 'weight') sortSQL = Prisma.sql`ORDER BY temp.weight`;
  else if (sortBy === 'estVal') sortSQL = Prisma.sql`ORDER BY temp.est_val`;
  else if (sortBy === 'id') sortSQL = Prisma.sql`ORDER BY temp.item_id`;
  else if (sortBy === 'rarity') sortSQL = Prisma.sql`ORDER BY temp.rarity`;
  else if (sortBy === 'match')
    sortSQL = Prisma.sql`ORDER BY temp.name = ${originalQuery} DESC, MATCH (temp.name) AGAINST (${originalQuery} IN NATURAL LANGUAGE MODE) desc, temp.name`;
  else sortSQL = isColorSearch ? Prisma.sql`ORDER BY dist` : Prisma.sql`ORDER BY temp.name`;

  let fulltext;

  if (query === '') fulltext = Prisma.sql`1`;
  else if (mode === 'natural')
    fulltext = Prisma.sql`MATCH (temp.name) AGAINST (${query} IN NATURAL LANGUAGE MODE) OR temp.name LIKE ${`%${originalQuery}%`}`;
  else if (mode === 'all')
    fulltext = Prisma.sql`MATCH (temp.name, temp.description) AGAINST (${query} IN BOOLEAN MODE) OR temp.name LIKE ${`%${originalQuery}%`} OR temp.description LIKE ${`%${originalQuery}%`}`;
  else if (mode === 'description')
    fulltext = Prisma.sql`MATCH (temp.description) AGAINST (${query} IN BOOLEAN MODE) OR temp.description LIKE ${`%${originalQuery}%`}`;
  else if (mode === 'fuzzy' && ENV_FUZZY_SEARCH) {
    fulltext = Prisma.sql`bounded_edit_dist_t(${originalQuery.toLowerCase()}, LOWER(temp.name), 6) <= 6`;
    sortSQL = Prisma.sql`ORDER BY bounded_edit_dist_t(${originalQuery.toLowerCase()}, LOWER(temp.name), 6), name`;
    sortDir = 'asc';
  } else if (mode === 'not') {
    fulltext = Prisma.sql`temp.name NOT LIKE ${`%${originalQuery}%`}`;
  } else
    fulltext = Prisma.sql`MATCH (temp.name) AGAINST (${query} IN BOOLEAN MODE) OR temp.name LIKE ${`%${originalQuery}%`}`;

  let resultRaw;

  const statsQuery =
    !includeStats && !onlyStats ? Prisma.sql`` : Prisma.sql`,count(*) OVER() AS full_count`;

  if (isColorSearch) {
    const colorQuery = Color(query);
    const [l, a, b] = colorQuery.lab().array();

    resultRaw = (await prisma.$queryRaw`
      SELECT ${!onlyStats ? Prisma.sql`*` : Prisma.sql`1`} ${statsQuery} FROM (
        SELECT a.*, b.lab_l, b.lab_a, b.lab_b, b.population, b.rgb_r, 
        b.rgb_g, b.rgb_b, b.hex, b.hsv_h, b.hsv_s, b.hsv_v, f.dist,
        c.addedAt as priceAdded, c.price, c.noInflation_id, 
        d.pricedAt as owlsPriced, d.value as owlsValue, d.valueMin as owlsValueMin,
        s.totalSold, s.totalItems, s.stats, s.daysPeriod, s.addedAt as saleAdded,
        n.price as ncPrice, n.saleBegin, n.saleEnd, n.discountBegin, n.discountEnd, n.discountPrice
        FROM Items as a
        LEFT JOIN (
                SELECT image_id, min((POWER(lab_l-${l},2)+POWER(lab_a-${a},2)+POWER(lab_b-${b},2))) as dist
                FROM ItemColor
                GROUP BY image_id 
                having dist <= ${colorTolerance}
            ) as f on a.image_id = f.image_id
        LEFT JOIN ItemColor as b on a.image_id = b.image_id and (POWER(b.lab_l-${l},2)+POWER(b.lab_a-${a},2)+POWER(b.lab_b-${b},2)) = f.dist
        LEFT JOIN ItemPrices as c on c.item_iid = a.internal_id and c.isLatest = 1
        LEFT JOIN OwlsPrice as d on d.item_iid = a.internal_id and d.isLatest = 1
        LEFT JOIN SaleStats as s on s.item_iid = a.internal_id and s.isLatest = 1 and s.stats != "unknown"
        LEFT JOIN NcMallData as n on n.item_iid = a.internal_id and n.active = 1
      ) as temp
        
        WHERE temp.dist is not null and temp.canonical_id is null

        ${
          catFiltersSQL.length > 0
            ? Prisma.sql` AND ${Prisma.join(catFiltersSQL, ' AND ')}`
            : Prisma.empty
        }
        ${
          typeFiltersSQL.length > 0
            ? Prisma.sql` AND ${Prisma.join(typeFiltersSQL, ' AND ')}`
            : Prisma.empty
        }
        ${
          statusFiltersSQL.length > 0
            ? Prisma.sql` AND ${Prisma.join(statusFiltersSQL, ' AND ')}`
            : Prisma.empty
        }
        ${
          numberFilters.length > 0
            ? Prisma.sql` AND ${Prisma.join(numberFilters, ' AND ')}`
            : Prisma.empty
        }

        ${
          !!list_id
            ? Prisma.sql` AND exists (select 1 from listitems li where li.item_iid = temp.internal_id and list_id = ${list_id} ${hiddenQuery})`
            : Prisma.empty
        }
        
        ${sortSQL}
        ${sortDir === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`}
        LIMIT ${limit} OFFSET ${page * limit}
        `) as any[];
  } else {
    query = `%${query}%`;
    resultRaw = (await prisma.$queryRaw`
      SELECT ${!onlyStats ? Prisma.sql`*` : Prisma.sql`1`} ${statsQuery} FROM (
        SELECT a.*, b.lab_l, b.lab_a, b.lab_b, b.population, b.rgb_r, b.rgb_g, b.rgb_b, b.hex, b.hsv_h, b.hsv_s, b.hsv_v,
          c.addedAt as priceAdded, c.price, c.noInflation_id, 
          d.pricedAt as owlsPriced, d.value as owlsValue, d.valueMin as owlsValueMin,
          s.totalSold, s.totalItems, s.stats, s.daysPeriod, s.addedAt as saleAdded,
          n.price as ncPrice, n.saleBegin, n.saleEnd, n.discountBegin, n.discountEnd, n.discountPrice
          ${colorSql_inside ? Prisma.sql`, ${colorSql_inside} as dist` : Prisma.empty}
          ${zoneFilterSQL.length > 0 ? Prisma.sql`, w.zone_label` : Prisma.empty}
          ${
            petpetSQL.length > 0
              ? Prisma.sql`, pc.color_id, pc.petpet_id, pc.isUnpaintable`
              : Prisma.empty
          }
        FROM Items as a
        LEFT JOIN ItemColor as b on a.image_id = b.image_id and ${colorTypeSQL} ${
      colorSql_inside ? Prisma.sql`and b.population > 0` : Prisma.empty
    }
        LEFT JOIN itemPrices as c on c.item_iid = a.internal_id and c.isLatest = 1
        LEFT JOIN OwlsPrice as d on d.item_iid = a.internal_id and d.isLatest = 1
        LEFT JOIN SaleStats as s on s.item_iid = a.internal_id and s.isLatest = 1 and s.stats != "unknown"
        LEFT JOIN NcMallData as n on n.item_iid = a.internal_id and n.active = 1
        ${
          zoneFilterSQL.length > 0
            ? Prisma.sql`LEFT JOIN WearableData w on w.item_iid = a.internal_id and w.isCanonical = 1`
            : Prisma.empty
        }
        ${petpetJoin}
      ) as temp
            
      WHERE (${fulltext}) and temp.canonical_id is null

      ${
        catFiltersSQL.length > 0
          ? Prisma.sql` AND ${Prisma.join(catFiltersSQL, ' AND ')}`
          : Prisma.empty
      }
      ${
        typeFiltersSQL.length > 0
          ? Prisma.sql` AND ${Prisma.join(typeFiltersSQL, ' AND ')}`
          : Prisma.empty
      }
      ${
        statusFiltersSQL.length > 0
          ? Prisma.sql` AND ${Prisma.join(statusFiltersSQL, ' AND ')}`
          : Prisma.empty
      }
      ${
        numberFilters.length > 0
          ? Prisma.sql` AND ${Prisma.join(numberFilters, ' AND ')}`
          : Prisma.empty
      }
      ${
        colorSql_outside && !isColorNeg
          ? Prisma.sql` AND ${colorSql_outside} <= ${colorTolerance}`
          : Prisma.empty
      }
      ${
        colorSql_outside && isColorNeg
          ? Prisma.sql` AND ${colorSql_outside} > ${colorTolerance}`
          : Prisma.empty
      }

      ${
        !!zoneFilterSQL.length
          ? Prisma.sql` AND ${Prisma.join(zoneFilterSQL, ' AND ')}`
          : Prisma.empty
      }

      ${
        !!list_id
          ? Prisma.sql` AND exists (select 1 from listitems li where li.item_iid = temp.internal_id and list_id = ${list_id} ${hiddenQuery})`
          : Prisma.empty
      }

      ${petpetSQL.length > 0 ? Prisma.sql` AND ${Prisma.join(petpetSQL, ' AND ')}` : Prisma.empty}

      ${!onlyStats ? sortSQL : Prisma.empty} 
      ${!onlyStats ? (sortDir === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`) : Prisma.empty}
      LIMIT ${limit} OFFSET ${page * limit}
    `) as any[];
  }

  const filteredResult = onlyStats ? [] : resultRaw;

  const itemList: ItemData[] = filteredResult.map((result: any) => {
    const item: ItemData = {
      internal_id: result.internal_id,
      canonical_id: result.canonical_id ?? null,
      image: result.image ?? '',
      image_id: result.image_id ?? '',
      item_id: result.item_id,
      rarity: result.rarity,
      name: result.name,
      type: result.type,
      // specialType: result.specialType,
      isNC: !!result.isNC,
      isBD: !!result.isBD,
      estVal: result.est_val,
      weight: result.weight,
      description: result.description ?? '',
      category: result.category,
      status: result.status,
      isNeohome: !!result.isNeohome,
      isWearable: !!result.specialType?.includes('wearable') || !!result.isWearable,
      firstSeen:
        (result.item_id >= 85020 && result.type !== 'pb'
          ? new Date(result.addedAt).toJSON()
          : null) ?? null,
      color: {
        hsv: [result.hsv_h, result.hsv_s, result.hsv_v],
        rgb: [result.rgb_r, result.rgb_g, result.rgb_b],
        lab: [result.lab_l, result.lab_a, result.lab_b],
        hex: result.hex,
        type: 'vibrant',
        population: result.population,
      },
      findAt: getItemFindAtLinks(result),
      isMissingInfo: false,
      price:
        result.status.toLowerCase() === 'no trade'
          ? { value: null, addedAt: null, inflated: false }
          : {
              value: result.price ? result.price.toNumber() : null,
              addedAt: result.priceAdded?.toJSON() ?? null,
              inflated: !!result.noInflation_id,
            },
      owls: result.owlsValue
        ? {
            value: result.owlsValue,
            pricedAt: result.owlsPriced.toJSON(),
            valueMin: result.owlsValueMin,
            buyable: result.owlsValue.toLowerCase().includes('buyable'),
          }
        : null,
      comment: result.comment ?? null,
      slug: result.slug ?? null,
      saleStatus:
        result.totalSold && !DISABLE_SALE_STATS
          ? {
              sold: result.totalSold,
              total: result.totalItems,
              percent: Math.round((result.totalSold / result.totalItems) * 100),
              status: result.stats,
              type: result.daysPeriod,
              addedAt: result.saleAdded.toJSON(),
            }
          : null,
      useTypes: {
        canEat: result.canEat,
        canRead: result.canRead,
        canOpen: result.canOpen,
        canPlay: result.canPlay,
      },
      mallData: !result.ncPrice
        ? null
        : {
            price: result.ncPrice,
            saleBegin: result.saleBegin ? result.saleBegin.toJSON() : null,
            saleEnd: result.saleEnd ? result.saleEnd.toJSON() : null,
            discountBegin: result.discountBegin ? result.discountBegin.toJSON() : null,
            discountEnd: result.discountEnd ? result.discountEnd.toJSON() : null,
            discountPrice: result.discountPrice,
          },
    };

    item.findAt = getItemFindAtLinks(item); // does have all the info we need :)
    item.isMissingInfo = isMissingInfo(item);

    return item;
  });

  return {
    content: itemList,
    page: page + 1,
    totalResults: parseInt(resultRaw?.[0]?.full_count ?? resultRaw.length),
    resultsPerPage: limit,
  };
}
// SELECT *,
// (POWER(h-15,2)+POWER(s-100,2)+POWER(l-45,2)) as dist
// FROM ItemColor
// WHERE (POWER(h-15,2)+POWER(s-100,2)+POWER(l-45,2)) <= 750
// ORDER BY dist

const getRestockQuery = (
  multiplier: number,
  minProfit: number,
  includeUnpriced = false
) => Prisma.sql`
(
  (temp.rarity <= 84 AND temp.price - GREATEST(100, temp.est_val * 1.9) * ${multiplier} >= ${minProfit} ) OR
  (temp.rarity >= 85 AND temp.rarity <= 89 AND temp.price - GREATEST(2500, temp.est_val * 1.9) * ${multiplier} >= ${minProfit} ) OR
  (temp.rarity >= 90 AND temp.rarity <= 94 AND temp.price - GREATEST(5000, temp.est_val * 1.9) * ${multiplier} >= ${minProfit} ) OR
  (temp.rarity >= 95 AND temp.rarity <= 99 AND temp.price - GREATEST(1000, temp.est_val * 1.9) * ${multiplier} >= ${minProfit} ) 
  ${includeUnpriced ? Prisma.sql` OR temp.price IS NULL` : Prisma.empty}
)
`;
