/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-empty-function */
/** @type {import('next-sitemap').IConfig} */
import {
  getServerSideSitemapLegacy,
  getServerSideSitemapIndexLegacy,
  ISitemapField,
} from 'next-sitemap';
import { GetServerSideProps } from 'next';
import prisma from '../../utils/prisma';
import { allNeopetsColors, allSpecies, restockShopInfo, slugify } from '../../utils/utils';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const page = ctx.query.page as string;
  const siteURL = 'https://itemdb.com.br';

  if (!page || isNaN(parseInt(page)))
    return getServerSideSitemapIndexLegacy(
      ctx,
      [...Array(70)].map((_, i) => `${siteURL}/sitemaps/${i}.xml`)
    );

  const [itemInfo, officialLists, colorSpecies] = await Promise.all([
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
      take: 5000,
      skip: parseInt(page) * 5000,
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
      skip: parseInt(page) * 50,
    }),
    prisma.colorSpecies.findMany({
      skip: parseInt(page) * 200,
      take: 200,
    }),
  ]);

  const officialListsPaths: ISitemapField[] = officialLists
    .map((list) => [
      {
        loc: `${siteURL}/lists/official/${list.slug ?? list.internal_id}`,
        alternateRefs: [
          {
            href: `${siteURL}/pt/lists/official/${list.slug ?? list.internal_id}`,
            hreflang: 'pt',
          },
          {
            href: `${siteURL}/lists/official/${list.slug ?? list.internal_id}`,
            hreflang: 'en',
          },
        ],
        lastmod: list.updatedAt.toISOString(),
      },
      {
        loc: `${siteURL}/pt/lists/official/${list.slug ?? list.internal_id}`,
        alternateRefs: [
          {
            href: `${siteURL}/pt/lists/official/${list.slug ?? list.internal_id}`,
            hreflang: 'pt',
          },
          {
            href: `${siteURL}/lists/official/${list.slug ?? list.internal_id}`,
            hreflang: 'en',
          },
        ],
        lastmod: list.updatedAt.toISOString(),
      },
    ])
    .flat();

  const itemPaths: ISitemapField[] = itemInfo
    .map((item) => {
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

      return [
        {
          loc: `${siteURL}/item/${item.slug}`,
          alternateRefs: [
            {
              href: `${siteURL}/pt/item/${item.slug}`,
              hreflang: 'pt',
            },
            {
              href: `${siteURL}/item/${item.slug}`,
              hreflang: 'en',
            },
          ],
          lastmod: lastMod.toISOString(),
        },
        {
          loc: `${siteURL}/pt/item/${item.slug}`,
          alternateRefs: [
            {
              href: `${siteURL}/pt/item/${item.slug}`,
              hreflang: 'pt',
            },
            {
              href: `${siteURL}/item/${item.slug}`,
              hreflang: 'en',
            },
          ],
          lastmod: lastMod.toISOString(),
        },
      ];
    })
    .flat();

  const colorSpeciesPaths: ISitemapField[] = colorSpecies
    .map((info, i) => {
      const speciesName = allSpecies[info.species_id]?.toLowerCase();
      const colorName = allNeopetsColors[info.color_id]?.toLowerCase();

      const locArr: ISitemapField[] = [];

      if (i === 0) {
        Object.values(allNeopetsColors)
          .slice(parseInt(page), (parseInt(page) + 1) * 100)
          .forEach((color) => {
            color = color.toLowerCase();
            locArr.push({
              loc: `${siteURL}/tools/rainbow-pool/${color}`,
              alternateRefs: [
                {
                  href: `${siteURL}/pt/tools/rainbow-pool/${color}`,
                  hreflang: 'pt',
                },
                {
                  href: `${siteURL}/tools/rainbow-pool/${color}`,
                  hreflang: 'en',
                },
              ],
            });
          });

        Object.values(allSpecies)
          .slice(parseInt(page), (parseInt(page) + 1) * 100)
          .forEach((species) => {
            species = species.toLowerCase();
            locArr.push({
              loc: `${siteURL}/tools/rainbow-pool/${species}`,
              alternateRefs: [
                {
                  href: `${siteURL}/pt/tools/rainbow-pool/${species}`,
                  hreflang: 'pt',
                },
                {
                  href: `${siteURL}/tools/rainbow-pool/${species}`,
                  hreflang: 'en',
                },
              ],
            });
          });
      }

      return [
        ...locArr,
        {
          loc: `${siteURL}/tools/rainbow-pool/${speciesName}/${colorName}`,
          alternateRefs: [
            {
              href: `${siteURL}/pt/tools/rainbow-pool/${speciesName}/${colorName}`,
              hreflang: 'pt',
            },
            {
              href: `${siteURL}/tools/rainbow-pool/${speciesName}/${colorName}`,
              hreflang: 'en',
            },
          ],
        },
        {
          loc: `${siteURL}/pt/tools/rainbow-pool/${speciesName}/${colorName}`,
          alternateRefs: [
            {
              href: `${siteURL}/pt/tools/rainbow-pool/${speciesName}/${colorName}`,
              hreflang: 'pt',
            },
            {
              href: `${siteURL}/tools/rainbow-pool/${speciesName}/${colorName}`,
              hreflang: 'en',
            },
          ],
        },
      ];
    })
    .flat();

  const restockPaths: ISitemapField[] = Object.values(restockShopInfo)
    .splice(parseInt(page) * 10, 10)
    .map((shop) => {
      const shopSlug = slugify(shop.name);
      return [
        {
          loc: `${siteURL}/restock/${shopSlug}`,
          alternateRefs: [
            {
              href: `${siteURL}/pt/restock/${shopSlug}`,
              hreflang: 'pt',
            },
            {
              href: `${siteURL}/restock/${shopSlug}`,
              hreflang: 'en',
            },
          ],
        },
        {
          loc: `${siteURL}/pt/restock/${shopSlug}`,
          alternateRefs: [
            {
              href: `${siteURL}/pt/restock/${shopSlug}`,
              hreflang: 'pt',
            },
            {
              href: `${siteURL}/restock/${shopSlug}`,
              hreflang: 'en',
            },
          ],
        },
      ];
    })
    .flat();

  return getServerSideSitemapLegacy(ctx, [
    ...restockPaths,
    ...officialListsPaths,
    ...itemPaths,
    ...colorSpeciesPaths,
  ]);
};

// Default export to prevent next.js errors
export default function Sitemap() {}
