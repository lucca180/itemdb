import { NextApiRequest, NextApiResponse } from 'next';
import type { WP_REST_API_Post } from 'wp-types';
import { wp } from '.';
import { WP_Article } from '../../../../types';
import { getWpThumbnail, mapWpPost } from '@utils/wp/mapWpPost';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const x = await wp_getBySlug(req.query.slug as string);
    return res.status(200).json(x);
  }

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export const wp_getBySlug = async (slug: string): Promise<WP_Article | null> => {
  const posts_res = await wp.get('/posts/', {
    params: {
      _embed: true,
      slug,
    },
  });

  const posts: Promise<WP_Article>[] = posts_res.data.map((post: WP_REST_API_Post) => {
    const thumbUrl = getWpThumbnail(post);
    return mapWpPost(post, thumbUrl ? isLebron(post.slug, thumbUrl) : null);
  });

  const posts_data = await Promise.all(posts);

  return posts_data[0] ?? null;
};

const isLebron = (slug: string, thumb: string) => {
  if (slug === 'lebron') return 'https://blog.itemdb.com.br/wp-content/uploads/2025/07/lakers.png';
  return thumb;
};
