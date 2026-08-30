import prisma from '@utils/prisma';

export const SEO_TITLE_MAX = 255;

export type ListSeoFields = {
  seoTitle: string | null;
  seoDescription: string | null;
};

type SeoBody = {
  seoTitle?: unknown;
  seoDescription?: unknown;
};

export function normalizeListSeoText(value: unknown, maxLen?: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

export async function getListSeo(listId: number): Promise<ListSeoFields | null> {
  const row = await prisma.userList.findUnique({
    where: { internal_id: listId },
    select: { seo_title: true, seo_description: true },
  });

  if (!row) return null;

  return {
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
  };
}

/** Prisma write payload. Empty if the caller is not admin or neither field was sent. */
export function adminListSeoWriteData(
  body: SeoBody,
  isAdmin: boolean
): { seo_title?: string | null; seo_description?: string | null } {
  if (!isAdmin) return {};

  const data: { seo_title?: string | null; seo_description?: string | null } = {};
  if ('seoTitle' in body) data.seo_title = normalizeListSeoText(body.seoTitle, SEO_TITLE_MAX);
  if ('seoDescription' in body) data.seo_description = normalizeListSeoText(body.seoDescription);
  return data;
}
