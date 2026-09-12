import { NextApiRequest, NextApiResponse } from 'next';
import Axios from 'axios';
import type { WP_REST_API_Post } from 'wp-types';
import { WP_Article } from '../../../../types';
import { getWpThumbnail, mapWpPost } from '@utils/wp/mapWpPost';

export const wp = Axios.create({
  baseURL: process.env.WORDPRESS_URL + '/',
});

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    let { limit, page, ignorePatch } = req.query as any;
    limit = parseInt(limit as string) || 5;
    page = parseInt(page as string) || 1;
    ignorePatch = ignorePatch === 'true';

    const posts = await wp_getLatestPosts(limit, page, ignorePatch);

    return res.status(200).json(posts);
  }

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export const wp_getLatestPosts = async (
  limit = 5,
  page = 1,
  ignorePatch = false
): Promise<WP_Article[]> => {
  const posts_res = await wp.get('/posts', {
    params: {
      _embed: true,
      per_page: Math.min(limit * 2, 100),
      page: page,
      categories_exclude: ignorePatch ? 2 : undefined,
    },
  });

  const posts = posts_res.data.map((post: WP_REST_API_Post) =>
    mapWpPost(post, getWpThumbnail(post))
  );

  const posts_data = await Promise.all(posts);

  return posts_data.filter((post) => post.category?.toLowerCase() !== 'hidden').slice(0, limit);
};
