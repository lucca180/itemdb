/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-empty-function */
/** @type {import('next-sitemap').IConfig} */
import { getServerSideSitemapIndexLegacy } from 'next-sitemap';
import { GetServerSideProps } from 'next';
import prisma from '../../utils/prisma';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const page = ctx.query.page as string;
  const siteURL = 'https://itemdb.com.br';

  if (!page || isNaN(parseInt(page)))
    return getServerSideSitemapIndexLegacy(
      ctx,
      [...Array(80)].map((_, i) => `${siteURL}/sitemaps/${i}.xml`)
    );

  const [itemInfo, officialLists] = await Promise.all([
    prisma.items.findMany({
      select: {
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: 950,
      skip: parseInt(page) * 950,
    }),
    prisma.userList.findMany({
      where: {
        official: true,
      },
      select: {
        internal_id: true,
      },
      take: 50,
      skip: parseInt(page) * 50,
    }),
  ]);

  const officialListsPaths = officialLists.map(
    (list) => `${siteURL}/lists/official/${list.internal_id}`
  );

  const itemPaths = itemInfo.map((item) => `${siteURL}/item/${item.slug}`);

  return getServerSideSitemapIndexLegacy(ctx, [...officialListsPaths, ...itemPaths]);
};

// Default export to prevent next.js errors
export default function Sitemap() {}
