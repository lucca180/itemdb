import prisma from '@utils/prisma';

export const STAMPS_PER_PAGE = 25;

export type StampGoalData = {
  avatarImage: string;
  /** Album page title, e.g. "HAUNTED WOODS" (from "Stamp Album - Haunted Woods") */
  title: string;
  /** Album positions 1..25 with the stamp image (null if the official list has no image) */
  stamps: { pos: number; image: string | null }[];
  /** Bit `pos - 1` is set when the user owns the stamp at that position */
  ownedMask: number;
  ownedCount: number;
};

const AVATAR_BASE_URL = 'https://images.neopets.com/neoboards/avatars/';

// official_tag casing varies in the DB ("Stamps"/"stamps")
export const isStampAlbum = (l: { official: boolean; official_tag: string | null } | null) =>
  !!l && l.official && l.official_tag?.toLowerCase() === 'stamps';

/** "Stamp Album - Haunted Woods" -> "HAUNTED WOODS" */
export const stampAlbumTitle = (listName: string) =>
  // some list names have leading spaces (" Stamp Album - Lost Desert")
  listName
    .trim()
    .replace(/^stamp album\s*[-–:]\s*/i, '')
    .trim()
    .toUpperCase();

export const toAvatarUrl = (image: string) =>
  /^https?:\/\//.test(image)
    ? image.replace(/^http:\/\//, 'https://')
    : AVATAR_BASE_URL + image.replace(/^\/+/, '');

/**
 * Resolves the stamp album page behind a list and which stamps the list owner has.
 *
 * - A user list must be linked to an official `stamps` list; owned stamps are the ones the user
 *   hid in their list (the checklist convention).
 * - An official `stamps` list resolves to itself with nothing owned.
 * - `officialOnly` rejects user lists (used by the sample images, which take an album id).
 * - The album page must have an avatar (AvatarSolution) — otherwise there is no goal to show.
 */
export async function getStampGoalData(
  listId: number,
  options: { officialOnly?: boolean } = {}
): Promise<StampGoalData | null> {
  const list = await prisma.userList.findUnique({
    where: { internal_id: listId },
    select: {
      internal_id: true,
      name: true,
      official: true,
      official_tag: true,
      linkedList: { select: { internal_id: true, name: true, official: true, official_tag: true } },
    },
  });

  if (!list) return null;

  let album: { internal_id: number; name: string };
  if (isStampAlbum(list)) album = list;
  else if (!options.officialOnly && isStampAlbum(list.linkedList)) album = list.linkedList!;
  else return null;
  const albumListId = album.internal_id;

  const [avatar, albumItems] = await Promise.all([
    prisma.avatarSolution.findFirst({
      where: { list_id: albumListId },
      orderBy: { internal_id: 'asc' },
      select: { image: true },
    }),
    prisma.listItems.findMany({
      where: { list_id: albumListId },
      orderBy: [{ order: 'asc' }, { internal_id: 'asc' }],
      select: { item_iid: true, order: true, item: { select: { image: true } } },
    }),
  ]);

  if (!avatar || albumItems.length === 0) return null;

  // positions come from the album order; fall back to the row order when it is missing
  const stamps = albumItems.slice(0, STAMPS_PER_PAGE).map((row, i) => ({
    iid: row.item_iid,
    pos: row.order && row.order >= 1 && row.order <= STAMPS_PER_PAGE ? row.order : i + 1,
    image: row.item.image,
  }));

  let ownedMask = 0;
  if (albumListId !== list.internal_id) {
    const hidden = await prisma.listItems.findMany({
      where: {
        list_id: list.internal_id,
        isHidden: true,
        item_iid: { in: stamps.map((s) => s.iid) },
      },
      select: { item_iid: true },
    });

    const owned = new Set(hidden.map((h) => h.item_iid));
    for (const stamp of stamps) if (owned.has(stamp.iid)) ownedMask |= 1 << (stamp.pos - 1);
  }

  return {
    avatarImage: toAvatarUrl(avatar.image),
    title: stampAlbumTitle(album.name ?? ''),
    stamps: stamps.map(({ pos, image }) => ({ pos, image })),
    ownedMask,
    ownedCount: countBits(ownedMask),
  };
}

export const countBits = (mask: number) => {
  let count = 0;
  for (let m = mask; m; m &= m - 1) count++;
  return count;
};
