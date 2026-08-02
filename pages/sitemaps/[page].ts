import {
  getServerSideSitemapLegacy,
  getServerSideSitemapIndexLegacy,
  ISitemapField,
} from 'next-sitemap';
import { GetServerSideProps } from 'next';
import prisma from '@utils/prisma';
import { restockShopInfo, slugify } from '@utils/utils';
import { listCategoriesData } from '@utils/lists/listCategoriesData';
import { allSpecies, findPetColorName, petColorSlug } from '@utils/pet-utils';
import { fetchAllNeopetsColors } from '@utils/pet-colors';
import { wp } from '@pages/api/wp/posts';
import { loadPetStylesSitemapPaths } from '@utils/petStyles/sitemapPaths';
import { SITE_URL, STATIC_SITEMAP_PATHS, bilingualSitemapFields } from '@utils/sitemap';

const ITEMS_PER_PAGE = 5000;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const page = ctx.query.page as string;
  const siteURL = SITE_URL;

  if (!page || isNaN(parseInt(page))) {
    const itemCount = await prisma.items.count();
    const pageCount = Math.max(1, Math.ceil(itemCount / ITEMS_PER_PAGE));
    return getServerSideSitemapIndexLegacy(
      ctx,
      [...Array(pageCount)].map((_, i) => `${siteURL}/sitemaps/${i}.xml`)
    );
  }

  const pageNum = parseInt(page);

  const [
    itemInfo,
    officialLists,
    colorSpecies,
    articleFields,
    petStylesSitemapPaths,
    allNeopetsColors,
  ] = await Promise.all([
    prisma.items.findMany({
      select: {
        slug: true,
        updatedAt: true,
        prices: {
          select: {
            addedAt: true,
          },
        },
        owlsPrice: {
          select: {
            addedAt: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: ITEMS_PER_PAGE,
      skip: pageNum * ITEMS_PER_PAGE,
    }),
    prisma.userList.findMany({
      where: {
        official: true,
      },
      select: {
        internal_id: true,
        updatedAt: true,
        slug: true,
      },
      take: 50,
      skip: pageNum * 50,
    }),
    prisma.colorSpecies.findMany({
      skip: pageNum * 200,
      take: 200,
    }),
    pageNum === 0 ? loadArticleSitemapFields() : Promise.resolve([] as ISitemapField[]),
    pageNum === 0 ? loadPetStylesSitemapPaths() : Promise.resolve([] as string[]),
    fetchAllNeopetsColors(),
  ]);

  const staticPaths: ISitemapField[] =
    pageNum === 0 ? STATIC_SITEMAP_PATHS.flatMap((path) => bilingualSitemapFields(path)) : [];

  const petStylesPaths: ISitemapField[] = petStylesSitemapPaths.flatMap((path) =>
    bilingualSitemapFields(path)
  );

  const officialListsPaths: ISitemapField[] = officialLists.flatMap((list) =>
    bilingualSitemapFields(
      `/lists/official/${list.slug ?? list.internal_id}`,
      list.updatedAt.toISOString()
    )
  );

  const itemPaths: ISitemapField[] = itemInfo.flatMap((item) => {
    let lastMod = item.updatedAt;

    if (item.prices.length > 0) {
      const priceChange = item.prices.reduce((prev, current) => {
        return prev.addedAt > current.addedAt ? prev : current;
      }).addedAt;

      if (priceChange > lastMod) lastMod = priceChange;
    }

    if (item.owlsPrice.length > 0) {
      const owlsChange = item.owlsPrice.reduce((prev, current) => {
        return prev.addedAt > current.addedAt ? prev : current;
      }).addedAt;

      if (owlsChange > lastMod) lastMod = owlsChange;
    }

    return bilingualSitemapFields(`/item/${item.slug}`, lastMod.toISOString());
  });

  const colorSpeciesPaths: ISitemapField[] = colorSpecies.flatMap((info, i) => {
    const speciesName = allSpecies[info.species_id];
    const colorName = findPetColorName(info.color_id, allNeopetsColors);

    const locArr: ISitemapField[] = [];

    if (i === 0) {
      Object.values(allNeopetsColors)
        .slice(pageNum, (pageNum + 1) * 100)
        .forEach((color) => {
          locArr.push(...bilingualSitemapFields(`/rainbow-pool/${petColorSlug(color)}`));
        });

      Object.values(allSpecies)
        .slice(pageNum, (pageNum + 1) * 100)
        .forEach((species) => {
          locArr.push(...bilingualSitemapFields(`/rainbow-pool/${petColorSlug(species)}`));
        });
    }

    if (!speciesName || !colorName) return locArr;

    const speciesSlug = petColorSlug(speciesName);
    const colorSlug = petColorSlug(colorName);
    if (!speciesSlug || !colorSlug) return locArr;

    return [...locArr, ...bilingualSitemapFields(`/rainbow-pool/${speciesSlug}/${colorSlug}`)];
  });

  const restockPaths: ISitemapField[] = Object.values(restockShopInfo)
    .slice(pageNum * 10, pageNum * 10 + 10)
    .flatMap((shop) => bilingualSitemapFields(`/restock/${slugify(shop.name)}`));

  const officialListsCats: ISitemapField[] = Object.values(listCategoriesData)
    .slice(pageNum * 10, pageNum * 10 + 10)
    .flatMap((cat) => bilingualSitemapFields(`/lists/official/cat/${slugify(cat.id)}`));

  const speciesOutfitsPaths: ISitemapField[] = Object.values(allSpecies)
    .slice(pageNum * 10, pageNum * 10 + 10)
    .flatMap((species) => bilingualSitemapFields(`/hub/outfits/${species.toLowerCase()}`));

  const allPaths: ISitemapField[] = [
    ...staticPaths,
    ...articleFields,
    ...petStylesPaths,
    ...restockPaths,
    ...officialListsPaths,
    ...itemPaths,
    ...colorSpeciesPaths,
    ...officialListsCats,
    ...speciesOutfitsPaths,
  ];

  if (allPaths.length === 0) {
    return {
      notFound: true,
    };
  }

  return getServerSideSitemapLegacy(ctx, allPaths);
};

async function loadArticleSitemapFields(): Promise<ISitemapField[]> {
  try {
    const fields: ISitemapField[] = [];
    for (let page = 1; page <= 20; page++) {
      const { data } = await wp.get('/posts', {
        params: {
          per_page: 100,
          page,
          _fields: 'slug,modified_gmt,date_gmt',
        },
      });

      const batch = data as { slug: string; modified_gmt?: string; date_gmt?: string }[];
      if (!batch.length) break;

      for (const post of batch) {
        if (!post.slug) continue;
        fields.push(
          ...bilingualSitemapFields(
            `/articles/${post.slug}`,
            post.modified_gmt || post.date_gmt || undefined
          )
        );
      }

      if (batch.length < 100) break;
    }

    return fields;
  } catch {
    return [];
  }
}

// Default export to prevent next.js errors
export default function Sitemap() {}
