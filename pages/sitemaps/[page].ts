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
import { restockShopInfo, slugify } from '../../utils/utils';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const page = ctx.query.page as string;
  const siteURL = 'https://itemdb.com.br';

  if (!page || isNaN(parseInt(page)))
    return getServerSideSitemapIndexLegacy(
      ctx,
      [...Array(70)].map((_, i) => `${siteURL}/sitemaps/${i}.xml`),
    );

  const [itemInfo, officialLists] = await Promise.all([
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
      take: 990,
      skip: parseInt(page) * 990,
    }),
    prisma.userList.findMany({
      where: {
        official: true,
      },
      select: {
        internal_id: true,
        updatedAt: true,
      },
      take: 10,
      skip: parseInt(page) * 10,
    }),
  ]);

  const officialListsPaths: ISitemapField[] = officialLists
    .map((list) => [
      {
        loc: `${siteURL}/lists/official/${list.internal_id}`,
        alternateRefs: [
          {
            href: `${siteURL}/pt/lists/official/${list.internal_id}`,
            hreflang: 'pt',
          },
          {
            href: `${siteURL}/lists/official/${list.internal_id}`,
            hreflang: 'en',
          },
        ],
        lastmod: list.updatedAt.toISOString(),
      },
      {
        loc: `${siteURL}/pt/lists/official/${list.internal_id}`,
        alternateRefs: [
          {
            href: `${siteURL}/pt/lists/official/${list.internal_id}`,
            hreflang: 'pt',
          },
          {
            href: `${siteURL}/lists/official/${list.internal_id}`,
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

  return getServerSideSitemapLegacy(ctx, [...restockPaths, ...officialListsPaths, ...itemPaths]);
};

// Default export to prevent next.js errors
export default function Sitemap() {}
