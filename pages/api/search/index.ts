/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import { getItemFindAtLinks, isMissingInfo } from '../../../utils/utils';
import { ItemData } from '../../../types';
import Color from 'color';
import { Prisma } from '@prisma/client';
import qs from 'qs';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' || !req.url)
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const reqQuery = qs.parse(req.url.split('?')[1]);
  let query = (reqQuery.s as string)?.trim() ?? '';
  let page = (parseInt(reqQuery.page as string) || 1) - 1;
  let limit = parseInt(reqQuery.limit as string) || 48;

  // if(!query) return res.status(400).json({error: 'invalid search query'});

  const isColorSearch = !!query.match(/^#[0-9A-Fa-f]{6}$/);

  if (page < 0) page = 0;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100;

  let categoryFilters = (reqQuery.category as string[]) ?? [];
  let typeFilters = (reqQuery.type as string[]) ?? [];
  let statusFilters = (reqQuery.status as string[]) ?? [];

  const priceFilter = (reqQuery.price as string[]) ?? [];
  const weightFilter = (reqQuery.weight as string[]) ?? [];
  const rarityFilter = (reqQuery.rarity as string[]) ?? [];
  const estValFilter = (reqQuery.estVal as string[]) ?? [];
  let vibrantColorFilter = (reqQuery.color as string) ?? '';

  const sortBy = (reqQuery.sortBy as string) ?? 'name';
  const sortDir = (reqQuery.sortDir as string) ?? 'asc';

  if (categoryFilters && !Array.isArray(categoryFilters)) categoryFilters = [categoryFilters];
  if (typeFilters && !Array.isArray(typeFilters)) typeFilters = [typeFilters];
  if (statusFilters && !Array.isArray(statusFilters)) statusFilters = [statusFilters];

  const catFiltersSQL = [];

  if (categoryFilters.length > 0) {
    const catNeg = categoryFilters
      .filter((o: string) => o.startsWith('!'))
      .map((o: string) => o.slice(1));
    const catTrue = categoryFilters.filter((o: string) => !o.startsWith('!'));

    if (catNeg.length > 0 && !catNeg.includes('Unknown'))
      catFiltersSQL.push(
        Prisma.sql`(temp.category NOT IN (${Prisma.join(catNeg)}) OR temp.category IS NULL)`
      );
    else if (catNeg.length > 0)
      catFiltersSQL.push(
        Prisma.sql`(temp.category NOT IN (${Prisma.join(catNeg)}) AND temp.category IS NOT NULL)`
      );

    if (catTrue.length > 0 && !catTrue.includes('Unknown'))
      catFiltersSQL.push(Prisma.sql`temp.category IN (${Prisma.join(catTrue)})`);
    else if (catTrue.length > 0)
      catFiltersSQL.push(
        Prisma.sql`(temp.category IN (${Prisma.join(catTrue)}) OR temp.category IS NULL)`
      );
  }

  const typeFiltersSQL = [];

  if (typeFilters.length > 0) {
    const typeNeg = typeFilters
      .filter((o: string) => o.startsWith('!'))
      .map((o: string) => o.slice(1));
    const typeTrue = typeFilters.filter((o: string) => !o.startsWith('!'));

    if (typeNeg.length > 0) {
      const type_column = typeNeg.filter((o: string) => o !== 'wearable' && o !== 'neohome');

      if (type_column.length > 0)
        typeFiltersSQL.push(Prisma.sql`temp.type NOT IN (${Prisma.join(type_column)})`);

      if (typeNeg.includes('wearable')) typeFiltersSQL.push(Prisma.sql`temp.isWearable = 0`);
      if (typeNeg.includes('neohome')) typeFiltersSQL.push(Prisma.sql`temp.isNeohome = 0`);
    }

    if (typeTrue.length > 0) {
      const type_column = typeTrue.filter((o: string) => o !== 'wearable' && o !== 'neohome');

      if (type_column.length > 0)
        typeFiltersSQL.push(Prisma.sql`temp.type IN (${Prisma.join(type_column)})`);

      if (typeTrue.includes('wearable')) typeFiltersSQL.push(Prisma.sql`temp.isWearable = 1`);
      if (typeTrue.includes('neohome')) typeFiltersSQL.push(Prisma.sql`temp.isNeohome = 1`);
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

  let colorSql_inside;
  let colorSql_outside;
  let isColorNeg = false;
  if (vibrantColorFilter.match(/#[0-9A-Fa-f]{6}$/gm)) {
    if (vibrantColorFilter.startsWith('!')) {
      isColorNeg = true;
      vibrantColorFilter = vibrantColorFilter.slice(1);
    }

    const colorFilter = Color(vibrantColorFilter);
    const [l, a, b] = colorFilter.lab().array();
    colorSql_inside = Prisma.sql`(POWER(b.lab_l-${l},2)+POWER(b.lab_a-${a},2)+POWER(b.lab_b-${b},2))`;
    colorSql_outside = Prisma.sql`(POWER(temp.lab_l-${l},2)+POWER(temp.lab_a-${a},2)+POWER(temp.lab_b-${b},2))`;
  }

  let sortSQL;

  if (sortBy === 'name') sortSQL = Prisma.sql`ORDER BY temp.name`;
  else if (sortBy === 'price') sortSQL = Prisma.sql`ORDER BY temp.price`;
  else if (sortBy === 'added') sortSQL = Prisma.sql`ORDER BY temp.addedAt`;
  else if (sortBy === 'color' && isColorSearch) sortSQL = Prisma.sql`ORDER BY dist`;
  else if (sortBy === 'color')
    sortSQL = Prisma.sql`ORDER BY temp.hsv_h ${
      sortDir === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`
    }, temp.hsv_s ${sortDir === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`}, temp.hsv_v`;
  else if (sortBy === 'weight') sortSQL = Prisma.sql`ORDER BY temp.weight`;
  else if (sortBy === 'estVal') sortSQL = Prisma.sql`ORDER BY temp.est_val`;
  else if (sortBy === 'id') sortSQL = Prisma.sql`ORDER BY temp.item_id`;
  else sortSQL = isColorSearch ? Prisma.sql`ORDER BY dist` : Prisma.sql`ORDER BY temp.name`;

  let resultRaw;

  if (isColorSearch) {
    const colorQuery = Color(query);
    const [l, a, b] = colorQuery.lab().array();

    resultRaw = (await prisma.$queryRaw`
      SELECT *,  count(*) OVER() AS full_count FROM (
        SELECT a.*, b.lab_l, b.lab_a, b.lab_b, b.population, b.rgb_r, 
        b.rgb_g, b.rgb_b, b.hex, b.hsv_h, b.hsv_s, b.hsv_v, d.dist,
        c.addedAt as priceAdded, c.price, c.noInflation_id
        FROM Items as a
        LEFT JOIN (
                SELECT image_id, min((POWER(lab_l-${l},2)+POWER(lab_a-${a},2)+POWER(lab_b-${b},2))) as dist
                FROM ItemColor
                GROUP BY image_id 
                having dist <= 750
            ) as d on a.image_id = d.image_id
        LEFT JOIN ItemColor as b on a.image_id = b.image_id and (POWER(b.lab_l-${l},2)+POWER(b.lab_a-${a},2)+POWER(b.lab_b-${b},2)) = d.dist
        LEFT JOIN (
          SELECT *
          FROM ItemPrices
          WHERE (item_iid, addedAt) IN (
              SELECT item_iid, MAX(addedAt)
              FROM ItemPrices
              GROUP BY item_iid
          ) AND manual_check IS null
        ) as c on c.item_iid = a.internal_id
      ) as temp
        
        WHERE temp.dist is not null

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
        
        ${sortSQL}
        ${sortDir === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`}
        LIMIT ${limit} OFFSET ${page * limit}
        `) as any[];
  } else {
    query = `%${query}%`;
    resultRaw = (await prisma.$queryRaw`
      SELECT *,  count(*) OVER() AS full_count FROM (
        SELECT a.*, b.lab_l, b.lab_a, b.lab_b, b.population, b.rgb_r, b.rgb_g, b.rgb_b, b.hex, b.hsv_h, b.hsv_s, b.hsv_v,
          c.addedAt as priceAdded, c.price, c.noInflation_id
          ${colorSql_inside ? Prisma.sql`, ${colorSql_inside} as dist` : Prisma.empty}
        FROM Items as a
        LEFT JOIN ItemColor as b on a.image_id = b.image_id and b.type = "Vibrant"
        LEFT JOIN (
          SELECT *
          FROM ItemPrices
          WHERE (item_iid, addedAt) IN (
              SELECT item_iid, MAX(addedAt)
              FROM ItemPrices
              GROUP BY item_iid
          ) AND manual_check IS null
        ) as c on c.item_iid = a.internal_id
      ) as temp
            
      WHERE (temp.name LIKE ${query})

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
        colorSql_outside && !isColorNeg ? Prisma.sql` AND ${colorSql_outside} <= 750` : Prisma.empty
      }
      ${colorSql_outside && isColorNeg ? Prisma.sql` AND ${colorSql_outside} > 750` : Prisma.empty}

      ${sortSQL} 
      ${sortDir === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`}
      LIMIT ${limit} OFFSET ${page * limit}
    `) as any[];
  }

  // const ids = resultRaw.map((o: { internal_id: any; }) => o.internal_id)
  const filteredResult = resultRaw;
  // .filter(({internal_id}: any, index: number) => !ids.includes(internal_id, index + 1))
  // .sort((a:any, b:any) =>  Math.floor(b.h) - Math.floor(a.h) || Math.floor(b.s) - Math.floor(a.s) || Math.floor(b.l) - Math.floor(a.l))

  const itemList: ItemData[] = filteredResult.map((result: any) => {
    const item: ItemData = {
      internal_id: result.internal_id,
      image: result.image ?? '',
      image_id: result.image_id ?? '',
      item_id: result.item_id,
      rarity: result.rarity,
      name: result.name,
      type: result.type,
      specialType: result.specialType,
      isNC: !!result.isNC,
      estVal: result.est_val,
      weight: result.weight,
      description: result.description ?? '',
      category: result.category,
      status: result.status,
      isNeohome: !!result.isNeohome,
      isWearable: !!result.specialType?.includes('wearable') || !!result.isWearable,
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
      price: {
        value: result.price,
        addedAt: result.priceAdded,
        inflated: !!result.noInflation_id,
      },
      comment: result.comment ?? null,
      slug: result.slug ?? null,
    };

    item.findAt = getItemFindAtLinks(item); // does have all the info we need :)
    item.isMissingInfo = isMissingInfo(item);

    return item;
  });

  res.json({
    content: itemList,
    page: page + 1,
    totalResults: parseInt(resultRaw?.[0]?.full_count ?? 0),
    resultsPerPage: limit,
  });
}

// SELECT *,
// (POWER(h-15,2)+POWER(s-100,2)+POWER(l-45,2)) as dist
// FROM ItemColor
// WHERE (POWER(h-15,2)+POWER(s-100,2)+POWER(l-45,2)) <= 750
// ORDER BY dist
