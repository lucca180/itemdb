import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createCanvas } from '@napi-rs/canvas';

const prismaMock = vi.hoisted(() => ({
  userList: { findUnique: vi.fn() },
  avatarSolution: { findFirst: vi.fn() },
  listItems: { findMany: vi.fn(), count: vi.fn() },
  $queryRaw: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock('@utils/prisma', () => ({ default: prismaMock }));

import {
  COLLECTION_VARIANTS,
  GOAL_TARGET_MAX,
  STAMP_VARIANTS,
  VARIANT_BACKGROUNDS,
  decodeGoalConfig,
  encodeGoalConfig,
} from '@utils/goalCounter/config';
import {
  getStampGoalData,
  stampAlbumTitle,
  type StampGoalData,
} from '@utils/goalCounter/stampGoalData';
import {
  getCollectionGoalData,
  type CollectionGoalData,
} from '@utils/goalCounter/collectionGoalData';
import { GOAL_SIZES } from '@utils/goalCounter/renderShared';
import { renderStampGoal } from '@utils/goalCounter/renderStampGoal';
import { renderCollectionGoal } from '@utils/goalCounter/renderCollectionGoal';
import { GET } from '@app/goal/lists/[list_id]/[code]/route';
import { GET as sampleGET } from '@app/goal/sample/[sample]/[code]/route';
import { getGoalCounterAlbum, getListGoalCounter } from '@utils/goalCounter/eligibility';

const ALBUM_ID = 100;
const USER_LIST_ID = 200;
const NEODECK_ID = 248;

const albumRows = Array.from({ length: 25 }, (_, i) => ({
  item_iid: 1000 + i,
  order: i + 1,
  item: { image: `https://images.neopets.com/items/stamp_${i + 1}.gif` },
}));

// the DB stores the tag as "Stamps"
const userList = (
  linkedList: unknown = {
    internal_id: ALBUM_ID,
    name: 'Stamp Album - Haunted Woods',
    official: true,
    official_tag: 'Stamps',
  }
) => ({
  internal_id: USER_LIST_ID,
  official: false,
  official_tag: null,
  linkedList,
});

const neodeckChecklist = () => ({
  internal_id: USER_LIST_ID,
  official: false,
  slug: null,
  linkedList: { internal_id: NEODECK_ID, official: true, slug: 'neodeck' },
});

const avatar = { image: 'stampsHaunted3192.gif' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('goal counter config', () => {
  test('keeps the v1 codes already handed out for stamps', () => {
    const known = {
      '1nj': { variant: 'mosaic', bg: 'transparent' },
      '1od': { variant: 'reveal', bg: 'transparent' },
      '1lf': { variant: 'page-header', bg: 'transparent' },
      '1l6': { variant: 'page-header', bg: 'paper' },
      '1m9': { variant: 'page-value', bg: 'transparent' },
      '1m0': { variant: 'page-value', bg: 'paper' },
      '1qv': { variant: 'page-legend', bg: 'transparent' },
      '1qm': { variant: 'page-legend', bg: 'paper' },
    } as const;
    for (const [code, config] of Object.entries(known)) {
      expect(encodeGoalConfig(config)).toBe(code);
      expect(decodeGoalConfig(code)).toEqual(config);
    }
  });

  test('round-trips the original stamp variants as v1', () => {
    for (const variant of STAMP_VARIANTS.filter((v) => v !== 'stamp-classic')) {
      for (const bg of VARIANT_BACKGROUNDS[variant]) {
        const code = encodeGoalConfig({ variant, bg });
        expect(code).toMatch(/^[0-9a-z]{3}$/);
        expect(decodeGoalConfig(code)).toEqual({ variant, bg });
      }
    }
  });

  test('round-trips the stamp classic as v2, without a target', () => {
    for (const bg of VARIANT_BACKGROUNDS['stamp-classic']) {
      for (const showNumber of [true, false]) {
        const code = encodeGoalConfig({ variant: 'stamp-classic', bg, showNumber, target: 99 });
        expect(code).toMatch(/^[0-9a-z]{6}$/);
        expect(decodeGoalConfig(code)).toEqual({
          variant: 'stamp-classic',
          bg,
          showNumber,
          target: null,
        });
      }
    }
  });

  test('round-trips collection variants with number and target options as v2', () => {
    const codes = new Set<string>();
    for (const variant of COLLECTION_VARIANTS) {
      for (const bg of VARIANT_BACKGROUNDS[variant]) {
        for (const target of [null, 1, 500, GOAL_TARGET_MAX]) {
          for (const showNumber of [true, false]) {
            const code = encodeGoalConfig({ variant, bg, showNumber, target });
            expect(code).toMatch(/^[0-9a-z]{6}$/);
            expect(decodeGoalConfig(code)).toEqual({ variant, bg, showNumber, target });
            codes.add(code);
          }
        }
      }
    }
    expect(codes.size).toBe(2 * 4 * 2);
  });

  test('normalizes unsupported options', () => {
    expect(encodeGoalConfig({ variant: 'mosaic', bg: 'paper' })).toBe(
      encodeGoalConfig({ variant: 'mosaic', bg: 'transparent' })
    );
    // stamps ignore the collection options
    expect(encodeGoalConfig({ variant: 'mosaic', bg: 'transparent', showNumber: false })).toBe(
      '1nj'
    );
    // targets are clamped; stamps ignore them
    expect(
      decodeGoalConfig(encodeGoalConfig({ variant: 'classic', bg: 'transparent', target: 50000 }))
    ).toMatchObject({ target: GOAL_TARGET_MAX });
    expect(encodeGoalConfig({ variant: 'mosaic', bg: 'transparent', target: 10 })).toBe('1nj');
  });

  test('rejects malformed and tampered codes', () => {
    expect(decodeGoalConfig('')).toBeNull();
    expect(decodeGoalConfig('abcd')).toBeNull();
    expect(decodeGoalConfig('ZZZ')).toBeNull();
    expect(decodeGoalConfig('zzz')).toBeNull();
    expect(decodeGoalConfig('zzzzzz')).toBeNull();

    const v1 = encodeGoalConfig({ variant: 'page-value', bg: 'paper' });
    expect(decodeGoalConfig((parseInt(v1, 36) ^ 1).toString(36).padStart(3, '0'))).toBeNull();

    const v2 = encodeGoalConfig({ variant: 'classic', bg: 'paper', target: 123 });
    expect(decodeGoalConfig((parseInt(v2, 36) ^ 1).toString(36).padStart(6, '0'))).toBeNull();
  });
});

describe('getStampGoalData', () => {
  test('turns the album list name into the counter title', () => {
    expect(stampAlbumTitle('Stamp Album - Mystery Island')).toBe('MYSTERY ISLAND');
    // some names in the DB have leading spaces
    expect(stampAlbumTitle(' Stamp Album - Lost Desert')).toBe('LOST DESERT');
    expect(stampAlbumTitle('Stamp Album: Snowy Valley')).toBe('SNOWY VALLEY');
  });

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
    expect(data!.title).toBe('HAUNTED WOODS');
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

describe('getCollectionGoalData', () => {
  test('counts hidden items that are still in the official list', async () => {
    prismaMock.userList.findUnique.mockResolvedValue(neodeckChecklist());
    prismaMock.listItems.count.mockResolvedValue(365);
    prismaMock.$queryRaw.mockResolvedValueOnce([{ n: BigInt(187) }]);

    const data = await getCollectionGoalData(USER_LIST_ID);

    expect(data).toEqual({
      collection: 'neodeck',
      title: 'NEODECK',
      iconImage: 'https://images.neopets.com/nt/ntimages/162_wocky_cards.gif',
      owned: 187,
      total: 365,
    });
    expect(prismaMock.listItems.count).toHaveBeenCalledWith({
      where: { list_id: NEODECK_ID, isHidden: false },
    });
  });

  test('resolves the official collection list to itself with nothing owned', async () => {
    prismaMock.userList.findUnique.mockResolvedValue({
      internal_id: NEODECK_ID,
      official: true,
      slug: 'neodeck',
      linkedList: null,
    });
    prismaMock.listItems.count.mockResolvedValue(365);

    const data = await getCollectionGoalData(NEODECK_ID);

    expect(data).toMatchObject({ owned: 0, total: 365 });
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
  });

  test('returns null for lists that are not collection checklists', async () => {
    prismaMock.userList.findUnique.mockResolvedValue(userList());
    expect(await getCollectionGoalData(USER_LIST_ID)).toBeNull();
    expect(prismaMock.listItems.count).not.toHaveBeenCalled();
  });
});

describe('goal counter eligibility', () => {
  test('skips official and unlinked lists without querying', async () => {
    expect(await getListGoalCounter({ official: true, linkedListId: ALBUM_ID })).toBeNull();
    expect(await getListGoalCounter({ official: false, linkedListId: null })).toBeNull();
    expect(prismaMock.userList.findUnique).not.toHaveBeenCalled();
  });

  test('returns the avatar of a linked stamp album', async () => {
    prismaMock.userList.findUnique.mockResolvedValue({
      official: true,
      official_tag: 'Stamps',
      slug: 'stamp-album-mystery-island',
      name: 'Stamp Album - Mystery Island',
    });
    prismaMock.avatarSolution.findFirst.mockResolvedValue({
      name: 'Stamp Collector - Mystery Island',
      image: 'http://images.neopets.com/neoboards/avatars/stampsMystery2352.gif',
    });

    expect(await getListGoalCounter({ official: false, linkedListId: ALBUM_ID })).toEqual({
      kind: 'stamps',
      albumListId: ALBUM_ID,
      name: 'Stamp Collector - Mystery Island',
      image: 'https://images.neopets.com/neoboards/avatars/stampsMystery2352.gif',
    });
  });

  test('returns the collection of a linked checklist', async () => {
    prismaMock.userList.findUnique.mockResolvedValue({
      official: true,
      official_tag: 'Contests',
      slug: 'gourmet-food',
      name: 'Gourmet Food',
    });

    expect(await getGoalCounterAlbum(72)).toEqual({
      kind: 'collection',
      collection: 'gourmet-food',
      albumListId: 72,
      name: 'Gourmet Food',
      image: 'https://images.neopets.com/spotlight/hub/icons/gourmet.png',
    });
    expect(prismaMock.avatarSolution.findFirst).not.toHaveBeenCalled();
  });

  test('rejects other lists and stamp albums without an avatar', async () => {
    prismaMock.userList.findUnique.mockResolvedValue({
      official: true,
      official_tag: 'Gallery',
      slug: 'some-gallery',
      name: 'x',
    });
    expect(await getGoalCounterAlbum(ALBUM_ID)).toBeNull();

    prismaMock.userList.findUnique.mockResolvedValue({
      official: true,
      official_tag: 'stamps',
      slug: 'stamp-album-x',
      name: 'x',
    });
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
  title: 'HAUNTED WOODS',
  stamps: albumRows.map((r) => ({ pos: r.order, image: r.item.image })),
  ownedMask,
  ownedCount: 0, // recomputed by the renderer
});

const collectionData = (owned: number): CollectionGoalData => ({
  collection: 'book-award',
  title: 'BOOK AWARD',
  iconImage: 'https://images.neopets.com/spotlight/hub/icons/bookaward_lg.png',
  owned,
  total: 3695,
});

describe('renderStampGoal', () => {
  test.each(STAMP_VARIANTS)('renders %s as a PNG of the expected size', async (variant) => {
    const fetchSpy = stubFetch();

    for (const bg of VARIANT_BACKGROUNDS[variant]) {
      const png = await renderStampGoal(sampleData(0b1011), { variant, bg });
      expect(png.subarray(1, 4).toString()).toBe('PNG');
      const [width, height] = GOAL_SIZES[variant];
      expect(pngSize(png)).toEqual({ width, height });
    }

    fetchSpy.mockRestore();
  });
});

describe('renderCollectionGoal', () => {
  test.each(COLLECTION_VARIANTS)('renders %s in every background', async (variant) => {
    const fetchSpy = stubFetch();

    for (const bg of VARIANT_BACKGROUNDS[variant]) {
      for (const [owned, target, showNumber] of [
        [0, null, true],
        [1204, null, true],
        [1204, 1500, false],
      ] as const) {
        const png = await renderCollectionGoal(collectionData(owned), {
          variant,
          bg,
          showNumber,
          target,
        });
        expect(png.subarray(1, 4).toString()).toBe('PNG');
        const [width, height] = GOAL_SIZES[variant];
        expect(pngSize(png)).toEqual({ width, height });
      }
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
  const collectionCode = encodeGoalConfig({ variant: 'classic', bg: 'paper', target: 250 });

  const mockLinkedList = (hidden: { item_iid: number }[]) => {
    prismaMock.userList.findUnique.mockResolvedValue(userList());
    prismaMock.avatarSolution.findFirst.mockResolvedValue(avatar);
    prismaMock.listItems.findMany.mockResolvedValueOnce(albumRows).mockResolvedValueOnce(hidden);
  };

  test('404s on invalid list id, code or extension', async () => {
    expect((await callRoute('abc', `${code}.png`)).status).toBe(404);
    expect((await callRoute('200', 'zzz.png')).status).toBe(404);
    expect((await callRoute('200', 'abcd.png')).status).toBe(404);
    expect((await callRoute('200', code)).status).toBe(404);
    expect(prismaMock.userList.findUnique).not.toHaveBeenCalled();
  });

  test('404s when the list has no stamp goal', async () => {
    prismaMock.userList.findUnique.mockResolvedValue(null);
    expect((await callRoute('200', `${code}.png`)).status).toBe(404);
  });

  test('404s when a collection code is used on a stamp checklist', async () => {
    prismaMock.userList.findUnique.mockResolvedValue(userList());
    expect((await callRoute('200', `${collectionCode}.png`)).status).toBe(404);
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

  test('renders a collection counter for a linked checklist', async () => {
    const fetchSpy = stubFetch();
    prismaMock.userList.findUnique.mockResolvedValue(neodeckChecklist());
    prismaMock.listItems.count.mockResolvedValue(365);
    prismaMock.$queryRaw.mockResolvedValueOnce([{ n: 187 }]);

    const res = await callRoute('200', `${collectionCode}.png`);

    expect(res.status).toBe(200);
    const png = Buffer.from(await res.arrayBuffer());
    const [width, height] = GOAL_SIZES.classic;
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

describe('GET /goal/sample/[sample]/[code]', () => {
  const callSample = (sample: string, code: string) =>
    sampleGET(new Request(`http://localhost/goal/sample/${sample}/${code}`), {
      params: Promise.resolve({ sample, code }),
    });

  const stampCode = encodeGoalConfig({ variant: 'stamp-classic', bg: 'paper' });
  const collectionCode = encodeGoalConfig({ variant: 'classic', bg: 'transparent', target: 500 });

  const mockOfficialAlbum = () => {
    prismaMock.userList.findUnique.mockResolvedValue({
      internal_id: ALBUM_ID,
      name: 'Stamp Album - Mystery Island',
      official: true,
      official_tag: 'Stamps',
      linkedList: null,
    });
    prismaMock.avatarSolution.findFirst.mockResolvedValue(avatar);
    prismaMock.listItems.findMany.mockResolvedValue(albumRows);
  };

  test('404s on unknown samples and codes of the other kind', async () => {
    expect((await callSample('gallery', `${stampCode}.png`)).status).toBe(404);
    expect((await callSample('stamps', `${stampCode}.png`)).status).toBe(404);
    expect((await callSample(`stamps-${ALBUM_ID}`, `${collectionCode}.png`)).status).toBe(404);
    expect((await callSample('neodeck', `${stampCode}.png`)).status).toBe(404);
    expect((await callSample('neodeck', 'zzz.png')).status).toBe(404);
    expect(prismaMock.userList.findUnique).not.toHaveBeenCalled();
  });

  test('only accepts official album ids, never a user list', async () => {
    prismaMock.userList.findUnique.mockResolvedValue(userList());
    expect((await callSample(`stamps-${USER_LIST_ID}`, `${stampCode}.png`)).status).toBe(404);
    expect(prismaMock.listItems.findMany).not.toHaveBeenCalled();
  });

  test('renders the album page with fixed progress and a long cache', async () => {
    const fetchSpy = stubFetch();
    mockOfficialAlbum();

    for (const [code, variant] of [
      [stampCode, 'stamp-classic'],
      [encodeGoalConfig({ variant: 'mosaic', bg: 'transparent' }), 'mosaic'],
    ] as const) {
      const res = await callSample(`stamps-${ALBUM_ID}`, `${code}.png`);
      expect(res.status).toBe(200);
      expect(res.headers.get('Cache-Control')).toContain('s-maxage=604800');
      const [width, height] = GOAL_SIZES[variant];
      expect(pngSize(Buffer.from(await res.arrayBuffer()))).toEqual({ width, height });
    }

    // the sample never reads anyone's hidden items
    expect(prismaMock.listItems.findMany).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isHidden: true }) })
    );
    fetchSpy.mockRestore();
  });

  test('renders collection samples without database access', async () => {
    const fetchSpy = stubFetch();

    const res = await callSample('gourmet-food', `${collectionCode}.png`);
    expect(res.status).toBe(200);
    const [width, height] = GOAL_SIZES.classic;
    expect(pngSize(Buffer.from(await res.arrayBuffer()))).toEqual({ width, height });

    expect(prismaMock.userList.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
