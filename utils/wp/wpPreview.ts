import Axios from 'axios';
import type { WP_REST_API_Post } from 'wp-types';
import { WP_Article } from '@types';
import { getWpThumbnail, mapWpPost } from './mapWpPost';

const wpAuth = Axios.create({
  baseURL: process.env.WORDPRESS_URL + '/',
  auth:
    process.env.WORDPRESS_PREVIEW_USER && process.env.WORDPRESS_PREVIEW_APP_PASSWORD
      ? {
          username: process.env.WORDPRESS_PREVIEW_USER,
          password: process.env.WORDPRESS_PREVIEW_APP_PASSWORD,
        }
      : undefined,
});

// Fetches a single post by id with an authenticated (Application Password) request,
// so drafts/private posts are visible. Intended for internal use only, gated by a
// signed preview token — never exposed as a public API route.
export const wp_getPreviewById = async (id: number): Promise<WP_Article | null> => {
  try {
    const res = await wpAuth.get(`/posts/${id}`, {
      params: { _embed: true, context: 'edit' },
    });

    const post: WP_REST_API_Post = res.data;
    if (!post?.id) return null;

    return await mapWpPost(post, getWpThumbnail(post));
  } catch {
    return null;
  }
};
