import { NextApiRequest, NextApiResponse } from 'next';
import type { WP_REST_API_Post } from 'wp-types';
import { getImagePalette } from '../../v1/lists/[username]';
import { wp } from '.';
import { WP_Article } from '../../../../types';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import he from 'he';

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

  const posts = posts_res.data.map(async (post: WP_REST_API_Post) => {
    const thumburl: string | null =
      ((post._embedded?.['wp:featuredmedia']?.[0] as any)?.source_url || '').replace(
        'https://',
        'https://i0.wp.com/',
      ) || null;

    return {
      id: post.id,
      title: he.decode(post.title.rendered),
      content: post.content.rendered,
      excerpt: he.decode(post.excerpt.rendered.replace(/<[^>]+>/g, '')),
      slug: post.slug,
      date: post.date_gmt,
      thumbnail: thumburl || null,
      palette: thumburl ? await getImagePalette(thumburl, true) : null,
    };
  });

  const posts_data = await Promise.all(posts);

  return posts_data[0] ?? null;
};
