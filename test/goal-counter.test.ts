import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createCanvas } from '@napi-rs/canvas';

const prismaMock = vi.hoisted(() => ({
  userList: { findUnique: vi.fn() },
  avatarSolution: { findFirst: vi.fn() },
  listItems: { findMany: vi.fn() },
}));

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock('@utils/prisma', () => ({ default: prismaMock }));

import {
  GOAL_BACKGROUNDS,
  GOAL_VARIANTS,
  decodeGoalConfig,
  encodeGoalConfig,
  variantSupportsPaper,
} from '@utils/goalCounter/config';
import { getStampGoalData, type StampGoalData } from '@utils/goalCounter/stampGoalData';
import { GOAL_SIZES, renderStampGoal } from '@utils/goalCounter/renderStampGoal';
import { GET } from '@app/goal/lists/[list_id]/[code]/route';
import { getGoalCounterAlbum, getListGoalCounter } from '@utils/goalCounter/eligibility';

const ALBUM_ID = 100;
const USER_LIST_ID = 200;

const albumRows = Array.from({ length: 25 }, (_, i) => ({
  item_iid: 1000 + i,
  order: i + 1,
  item: { image: `https://images.neopets.com/items/stamp_${i + 1}.gif` },
}));

// the DB stores the tag as "Stamps"
const userList = (
  linkedList: unknown = { internal_id: ALBUM_ID, official: true, official_tag: 'Stamps' }
) => ({
  internal_id: USER_LIST_ID,
  official: false,
  official_tag: null,
  linkedList,
});

const avatar = { image: 'stampsHaunted3192.gif' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('goal counter config', () => {
  test('round-trips every variant and background', () => {
    const codes = new Set<string>();
    for (const variant of GOAL_VARIANTS) {
      for (const bg of GOAL_BACKGROUNDS) {
        if (bg === 'paper' && !variantSupportsPaper(variant)) continue;
        const code = encodeGoalConfig({ variant, bg });
        expect(code).toMatch(/^[0-9a-z]{3}$/);
        expect(decodeGoalConfig(code)).toEqual({ variant, bg });
        codes.add(code);
      }
    }
    expect(codes.size).toBe(8);
  });

  test('forces transparent background on variants without paper', () => {
    expect(encodeGoalConfig({ variant: 'mosaic', bg: 'paper' })).toBe(
      encodeGoalConfig({ variant: 'mosaic', bg: 'transparent' })
    );
  });

  test('rejects malformed and tampered codes', () => {
    expect(decodeGoalConfig('')).toBeNull();
    expect(decodeGoalConfig('abcd')).toBeNull();
    expect(decodeGoalConfig('ZZZ')).toBeNull();
    expect(decodeGoalConfig('zzz')).toBeNull();

    const valid = encodeGoalConfig({ variant: 'page-value', bg: 'paper' });
    const tampered = (parseInt(valid, 36) ^ 1).toString(36).padStart(3, '0');
    expect(decodeGoalConfig(tampered)).toBeNull();
  });
});

describe('getStampGoalData', () => {
  test('builds the owned mask from hidden items of a linked list', async () => {
    prismaMock.userList.findUnique.mockResolvedValue(userList());
    prismaMock.avatarSolution.findFirst.mockResolvedValue(avatar);
    prismaMock.listItems.findMany
      .mockResolvedValueOnce(albumRows)
      .mockResolvedValueOnce([{ item_iid: 1000 }, { item_iid: 1002 }, { item_iid: 1024 }]);

    const data = await getStampGoalData(USER_LIST_ID);

    expect(data).not.toBeNull();
    expect(data!.ownedCount).toBe(3);
    expect(data!.ownedMask).toBe((1 << 0) | (1 << 2) | (1 << 24));
    expect(data!.stamps).toHaveLength(25);
    expect(data!.avatarImage).toBe(
      'https://images.neopets.com/neoboards/avatars/stampsHaunted3192.gif'
    );

    expect(prismaMock.listItems.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ list_id: USER_LIST_ID, isHidden: true }),
      })
    );
  });

  test('resolves an official stamp list to itself with nothing owned', async () => {
    prismaMock.userList.findUnique.mockResolvedValue({
      internal_id: ALBUM_ID,
      official: true,
      official_tag: 'stamps',
      linkedList: null,
    });
    prismaMock.avatarSolution.findFirst.mockResolvedValue({
      ...avatar,
      image: 'http://x.test/a.gif',
    });
    prismaMock.listItems.findMany.mockResolvedValueOnce(albumRows);

    const data = await getStampGoalData(ALBUM_ID);

    expect(data!.ownedMask).toBe(0);
    expect(data!.avatarImage).toBe('https://x.test/a.gif');
    expect(prismaMock.listItems.findMany).toHaveBeenCalledTimes(1);
  });

  test('returns null when the list is not linked to a stamp album', async () => {
    prismaMock.userList.findUnique.mockResolvedValue(
      userList({ internal_id: 5, official: true, official_tag: 'gallery' })
    );
    expect(await getStampGoalData(USER_LIST_ID)).toBeNull();
    expect(prismaMock.avatarSolution.findFirst).not.toHaveBeenCalled();
  });

  test('returns null when the album has no avatar', async () => {
    prismaMock.userList.findUnique.mockResolvedValue(userList());
    prismaMock.avatarSolution.findFirst.mockResolvedValue(null);
    prismaMock.listItems.findMany.mockResolvedValueOnce(albumRows);

    expect(await getStampGoalData(USER_LIST_ID)).toBeNull();
  });
});

describe('goal counter eligibility', () => {
  test('skips official and unlinked lists without querying', async () => {
    expect(await getListGoalCounter({ official: true, linkedListId: ALBUM_ID })).toBeNull();
    expect(await getListGoalCounter({ official: false, linkedListId: null })).toBeNull();
    expect(prismaMock.userList.findUnique).not.toHaveBeenCalled();
  });

  test('returns the avatar of a linked stamp album', async () => {
    prismaMock.userList.findUnique.mockResolvedValue({ official: true, official_tag: 'Stamps' });
    prismaMock.avatarSolution.findFirst.mockResolvedValue({
      name: 'Stamp Collector - Mystery Island',
      image: 'http://images.neopets.com/neoboards/avatars/stampsMystery2352.gif',
    });

    expect(await getListGoalCounter({ official: false, linkedListId: ALBUM_ID })).toEqual({
      albumListId: ALBUM_ID,
      avatarName: 'Stamp Collector - Mystery Island',
      avatarImage: 'https://images.neopets.com/neoboards/avatars/stampsMystery2352.gif',
    });
  });

  test('rejects albums that are not stamps or have no avatar', async () => {
    prismaMock.userList.findUnique.mockResolvedValue({ official: true, official_tag: 'Gallery' });
    prismaMock.avatarSolution.findFirst.mockResolvedValue({ name: 'x', image: 'x.gif' });
    expect(await getGoalCounterAlbum(ALBUM_ID)).toBeNull();

    prismaMock.userList.findUnique.mockResolvedValue({ official: true, official_tag: 'stamps' });
    prismaMock.avatarSolution.findFirst.mockResolvedValue(null);
    expect(await getGoalCounterAlbum(ALBUM_ID)).toBeNull();
  });
});

// ---------- rendering (offline: fetch returns generated PNGs) ---------- //

const fakePng = (color: string) => {
  const c = createCanvas(50, 50);
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 50, 50);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(10, 10, 20, 20);
  return c.toBuffer('image/png');
};

const realFetch = globalThis.fetch;
const stubFetch = () =>
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    // next/og loads its own wasm/fonts through fetch; only fake remote images
    if (!/^https?:\/\//.test(url)) return realFetch(input, init);
    return new Response(new Uint8Array(fakePng(url.includes('avatars') ? '#2f5d4a' : '#c0392b')), {
      status: 200,
    });
  });

const pngSize = (buf: Buffer) => ({ width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) });

const sampleData = (ownedMask: number): StampGoalData => ({
  avatarImage: 'https://images.neopets.com/neoboards/avatars/test.gif',
  stamps: albumRows.map((r) => ({ pos: r.order, image: r.item.image })),
  ownedMask,
  ownedCount: 0, // recomputed by the renderer
});

describe('renderStampGoal', () => {
  test.each(GOAL_VARIANTS)('renders %s as a PNG of the expected size', async (variant) => {
    const fetchSpy = stubFetch();
    const bgs = variantSupportsPaper(variant) ? GOAL_BACKGROUNDS : (['transparent'] as const);

    for (const bg of bgs) {
      const png = await renderStampGoal(sampleData(0b1011), { variant, bg });
      expect(png.subarray(1, 4).toString()).toBe('PNG');
      const [width, height] = GOAL_SIZES[variant];
      expect(pngSize(png)).toEqual({ width, height });
    }

    fetchSpy.mockRestore();
  });
});

// ---------- route ---------- //

const callRoute = (listId: string, code: string) =>
  GET(new Request(`http://localhost/goal/lists/${listId}/${code}`), {
    params: Promise.resolve({ list_id: listId, code }),
  });

describe('GET /goal/lists/[list_id]/[code]', () => {
  const code = encodeGoalConfig({ variant: 'page-header', bg: 'paper' });

  const mockLinkedList = (hidden: { item_iid: number }[]) => {
    prismaMock.userList.findUnique.mockResolvedValue(userList());
    prismaMock.avatarSolution.findFirst.mockResolvedValue(avatar);
    prismaMock.listItems.findMany.mockResolvedValueOnce(albumRows).mockResolvedValueOnce(hidden);
  };

  test('404s on invalid list id, code or extension', async () => {
    expect((await callRoute('abc', `${code}.png`)).status).toBe(404);
    expect((await callRoute('200', 'zzz.png')).status).toBe(404);
    expect((await callRoute('200', code)).status).toBe(404);
    expect(prismaMock.userList.findUnique).not.toHaveBeenCalled();
  });

  test('404s when the list has no stamp goal', async () => {
    prismaMock.userList.findUnique.mockResolvedValue(null);
    expect((await callRoute('200', `${code}.png`)).status).toBe(404);
  });

  test('renders the PNG with browser/CDN cache headers', async () => {
    const fetchSpy = stubFetch();
    mockLinkedList([{ item_iid: 1001 }, { item_iid: 1003 }]);

    const res = await callRoute('200', `${code}.png`);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=300');
    const png = Buffer.from(await res.arrayBuffer());
    const [width, height] = GOAL_SIZES['page-header'];
    expect(pngSize(png)).toEqual({ width, height });

    fetchSpy.mockRestore();
  });

  test('returns 500 without caching when rendering fails', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (!/^https?:\/\//.test(url)) return realFetch(input, init);
      return new Response('nope', { status: 503 });
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockLinkedList([]);

    const res = await callRoute('200', `${code}.png`);

    expect(res.status).toBe(500);
    expect(res.headers.get('Cache-Control')).toBe('no-store');

    fetchSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
