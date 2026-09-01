import prisma from '@utils/prisma';

export type ListImportMeta = Record<string, unknown>;

function parsePositiveInt(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

function descriptionHasAlbumId(description: string | null | undefined, albumId: number): boolean {
  if (!description) return false;
  return new RegExp(`[&?]page_id=${albumId}(?!\\d)`).test(description);
}

async function findOfficialStampAlbumListId(albumId: number): Promise<number | null> {
  const albums = await prisma.userList.findMany({
    where: {
      official: true,
      official_tag: 'stamps',
      description: {
        contains: `&page_id=${albumId}`,
      },
    },
    select: {
      internal_id: true,
      description: true,
    },
  });

  const match = albums.find((album) => descriptionHasAlbumId(album.description, albumId));
  return match?.internal_id ?? null;
}

export async function resolveImportRecommendedListId(input: {
  meta?: ListImportMeta | null;
  list_id?: string | number | null;
}): Promise<number | null> {
  const albumId = parsePositiveInt(input.meta?.albumID);
  if (albumId !== null) {
    const fromDb = await findOfficialStampAlbumListId(albumId);
    if (fromDb) return fromDb;
  }

  return parsePositiveInt(input.meta?.list_id) ?? parsePositiveInt(input.list_id);
}
