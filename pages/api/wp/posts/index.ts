import { NextApiRequest, NextApiResponse } from 'next';
import Axios from 'axios';
import type { WP_REST_API_Post } from 'wp-types';
import { getImagePalette } from '../../v1/lists/[username]';
import { WP_Article } from '../../../../types';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import he from 'he';

export const wp = Axios.create({
  baseURL: process.env.WORDPRESS_URL + '/wp-json/wp/v2',
});

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const posts = await wp_getLatestPosts();
    return res.status(200).json(posts);
  }

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export const wp_getLatestPosts = async (limit = 5, page = 1): Promise<WP_Article[]> => {
  const posts_res = await wp.get('/posts', {
    params: {
      per_page: limit,
      page: page,
    },
  });

  const posts = posts_res.data.map(async (post: WP_REST_API_Post) => {
    return {
      id: post.id,
      title: he.decode(post.title.rendered),
      content: post.content.rendered,
      excerpt: he.decode(post.excerpt.rendered.replace(/<[^>]+>/g, '')),
      slug: post.slug,
      date: post.date_gmt,
      thumbnail: post.fimg_url || null,
      palette: post.fimg_url ? await getImagePalette(post.fimg_url as string, true) : null,
    };
  });

  const posts_data = await Promise.all(posts);

  return posts_data;
};
