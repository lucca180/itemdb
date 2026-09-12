import type { WP_REST_API_Post } from 'wp-types';
import { getImagePalette } from '@pages/api/v1/lists/[username]';
import { WP_Article } from '@types';

// @ts-ignore
import he from 'he';

export function getWpThumbnail(post: WP_REST_API_Post): string | null {
  return (
    ((post._embedded?.['wp:featuredmedia']?.[0] as any)?.source_url || '').replace(
      'https://',
      'https://i0.wp.com/'
    ) || null
  );
}

export async function mapWpPost(
  post: WP_REST_API_Post,
  paletteSource: string | null
): Promise<WP_Article> {
  const thumbUrl = getWpThumbnail(post);
  const palette = paletteSource ? await getImagePalette(paletteSource, true) : null;
  const terms: any[] = post._embedded?.['wp:term']?.flat() || [];
  const categories = terms.filter((t) => t?.taxonomy === 'category');

  return {
    id: post.id,
    title: he.decode(post.title.rendered),
    content: post.content.rendered,
    excerpt: he.decode(post.excerpt.rendered.replace(/<[^>]+>/g, '')),
    slug: post.slug,
    date: post.date_gmt,
    updated: post.modified_gmt,
    category: categories.length > 0 ? categories[0].name : 'Uncategorized',
    thumbnail: thumbUrl || null,
    palette,
  };
}
