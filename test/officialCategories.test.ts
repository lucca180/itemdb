import { describe, expect, it, vi } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { UserList } from '@types';
import {
  getOfficialCategory,
  getOfficialCategoryByTag,
  officialCategories,
  officialCategorySlugs,
  RESERVED_OFFICIAL_SLUGS,
} from '@app/[locale]/lists/official/_categories';
import {
  DEFAULT_SECTIONS,
  listLabels,
  resolveCategory,
  resolveSections,
} from '@app/[locale]/lists/official/_categories/resolve';
import type { OfficialCategoryConfig } from '@app/[locale]/lists/official/_categories/types';

const findMany = vi.fn();
vi.mock('@utils/prisma', () => ({ default: { userList: { findMany } } }));

let nextId = 1;
const list = (slug: string, extra: Partial<UserList> = {}) =>
  ({
    internal_id: nextId++,
    slug,
    name: slug,
    createdAt: '2020-01-01T00:00:00.000Z',
    seriesStart: null,
    seriesEnd: null,
    ...extra,
  }) as unknown as UserList;

const slugsOf = (lists: UserList[]) => lists.map((l) => l.slug);

const baseConfig: Omit<OfficialCategoryConfig, 'layout'> = {
  slug: 'test',
  name: 'Test',
  tags: ['test'],
  color: '#000000',
  image: 'https://example.com/x.png',
  description: 'Test',
};

describe('official category registry', () => {
  it('uses unique, kebab-case, non-numeric, non-reserved slugs', () => {
    expect(new Set(officialCategorySlugs).size).toBe(officialCategorySlugs.length);
    for (const slug of officialCategorySlugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(slug).not.toMatch(/^\d+$/);
      expect(RESERVED_OFFICIAL_SLUGS).not.toContain(slug);
      expect(officialCategories[slug].slug).toBe(slug);
    }
  });

  it('maps every official tag to a single category', () => {
    const seen = new Map<string, string>();
    for (const c of Object.values(officialCategories)) {
      for (const tag of c.tags) {
        const key = tag.toLowerCase();
        expect(seen.get(key), `tag "${tag}" is in two categories`).toBeUndefined();
        seen.set(key, c.slug);
      }
    }
  });

  it('picks an extra list (`lists.slugs`) in a single category', () => {
    const seen = new Map<string, string>();
    for (const c of Object.values(officialCategories)) {
      for (const slug of c.lists?.slugs ?? []) {
        expect(seen.get(slug), `list "${slug}" is in two categories`).toBeUndefined();
        seen.set(slug, c.slug);
      }
    }
  });

  it('looks categories up by slug and by official tag, case-insensitively', () => {
    expect(getOfficialCategory('Quest-Log')?.slug).toBe('quest-log');
    expect(getOfficialCategory('weekly-quest-prize')).toBeNull();
    expect(getOfficialCategoryByTag('Quest Log')?.slug).toBe('quest-log');
    expect(getOfficialCategoryByTag('Festival of Neggs 2026')?.slug).toBe('festival-of-neggs');
    expect(getOfficialCategoryByTag('Neopies 2026')).toBeNull();
  });
});

describe('resolveCategory — tracks', () => {
  const config: OfficialCategoryConfig = {
    ...baseConfig,
    layout: {
      type: 'tracks',
      tracks: [
        {
          id: 'weekly',
          title: 'Weekly',
          current: { slugs: ['weekly-prize'] },
          history: { slugPrefix: 'old-weekly-', title: 'Past weekly pools' },
        },
        { id: 'daily', title: 'Daily', label: 'Every day', current: { slugs: ['daily-prize'] } },
      ],
    },
    archive: { slugs: ['retired-prize'] },
    labels: [{ match: { slugPrefix: 'old-weekly-special-' }, label: 'Special' }],
  };

  const lists = [
    list('weekly-prize'),
    list('daily-prize'),
    list('old-weekly-1', { seriesStart: '2025-01-01T00:00:00.000Z' }),
    list('old-weekly-special-1', { seriesStart: '2025-06-01T00:00:00.000Z' }),
    list('old-weekly-2', { seriesStart: '2025-03-01T00:00:00.000Z' }),
    list('retired-prize'),
    list('tutorial'),
  ];

  const resolved = resolveCategory(config, lists);

  it('splits current lists, newest-first history, archive and unmatched lists', () => {
    if (resolved.type !== 'tracks') throw new Error('expected tracks');
    const [weekly, daily] = resolved.tracks;

    expect(slugsOf(weekly.current)).toEqual(['weekly-prize']);
    expect(slugsOf(weekly.history)).toEqual([
      'old-weekly-special-1',
      'old-weekly-2',
      'old-weekly-1',
    ]);
    expect(slugsOf(daily.current)).toEqual(['daily-prize']);
    expect(slugsOf(resolved.archive)).toEqual(['retired-prize']);
    expect(slugsOf(resolved.other)).toEqual(['tutorial']);
  });

  it('uses config titles and labels as written, with fallbacks', () => {
    if (resolved.type !== 'tracks') throw new Error('expected tracks');
    const [weekly, daily] = resolved.tracks;

    expect(weekly.historyTitle).toBe('Past weekly pools');
    expect(weekly.label).toBe('Weekly');
    expect(daily.label).toBe('Every day');
    expect(daily.historyTitle).toBe('Daily · past pools');
  });

  it('applies config labels by slug', () => {
    expect(listLabels(config, list('old-weekly-special-9')).map((l) => l.label)).toEqual([
      'Special',
    ]);
    expect(listLabels(config, list('old-weekly-9'))).toEqual([]);
  });
});

describe('resolveCategory — editions', () => {
  const config: OfficialCategoryConfig = {
    ...baseConfig,
    layout: {
      type: 'editions',
      evergreen: { slugs: ['cup-sign-up-prizes'], title: 'Every edition' },
      editionOrder: ['cup-', 'premium-cup-'],
      editionDates: { 2026: { start: '2026-05-01' } },
    },
  };

  const lists = [
    list('premium-cup-2026', {
      seriesStart: '2026-04-20T00:00:00.000Z',
      seriesEnd: '2026-05-10T00:00:00.000Z',
    }),
    list('cup-2026', {
      seriesStart: '2026-04-20T00:00:00.000Z',
      seriesEnd: '2026-05-10T00:00:00.000Z',
    }),
    list('cup-2024', {
      seriesStart: '2024-04-20T00:00:00.000Z',
      seriesEnd: '2024-05-10T00:00:00.000Z',
    }),
    list('cup-2010'),
    list('cup-sign-up-prizes'),
    list('cup-mascot'),
  ];

  const resolved = resolveCategory(config, lists);

  it('keeps the newest edition as latest even after it ended', () => {
    if (resolved.type !== 'editions') throw new Error('expected editions');
    expect(resolved.latest?.year).toBe(2026);
    expect(slugsOf(resolved.latest!.lists)).toEqual(['cup-2026', 'premium-cup-2026']);
  });

  it('groups past editions by seriesStart year or a year in the slug', () => {
    if (resolved.type !== 'editions') throw new Error('expected editions');
    expect(resolved.past.map((e) => e.year)).toEqual([2024, 2010]);
    expect(slugsOf(resolved.evergreen!.lists)).toEqual(['cup-sign-up-prizes']);
    expect(slugsOf(resolved.other)).toEqual(['cup-mascot']);
  });

  it('prefers editionDates over list dates', () => {
    if (resolved.type !== 'editions') throw new Error('expected editions');
    expect(resolved.latest).toMatchObject({
      start: '2026-05-01',
      end: null,
      datesFromConfig: true,
    });
    expect(resolved.past[0]).toMatchObject({
      start: '2024-04-20T00:00:00.000Z',
      end: '2024-05-10T00:00:00.000Z',
      datesFromConfig: false,
    });
  });
});

describe('resolveCategory — groups fallback', () => {
  it('puts every list in "other" when there are no groups', () => {
    const config: OfficialCategoryConfig = {
      ...baseConfig,
      layout: { type: 'groups', groups: [] },
    };
    const resolved = resolveCategory(config, [list('a'), list('b')]);
    expect(slugsOf(resolved.other)).toEqual(['a', 'b']);
  });

  it('pulls featured lists out of "other"', () => {
    const config: OfficialCategoryConfig = {
      ...baseConfig,
      layout: { type: 'groups', featured: { slugs: ['b'], label: 'Top' }, groups: [] },
    };
    const resolved = resolveCategory(config, [list('a'), list('b')]);
    if (resolved.type !== 'groups') throw new Error('expected groups');
    expect(slugsOf(resolved.featured.lists)).toEqual(['b']);
    expect(resolved.featured.label).toBe('Top');
    expect(slugsOf(resolved.other)).toEqual(['a']);
  });

  it('adds the most viewed lists after the pinned ones, keeping them in their groups', () => {
    const config: OfficialCategoryConfig = {
      ...baseConfig,
      layout: { type: 'groups', featured: { slugs: ['pinned'], popular: 2 }, groups: [] },
    };
    const lists = [list('pinned'), list('a'), list('b'), list('c'), list('d')];
    const pageviews = { pinned: 999, a: 10, b: 50, c: 30 };

    const resolved = resolveCategory(config, lists, pageviews);
    if (resolved.type !== 'groups') throw new Error('expected groups');
    expect(slugsOf(resolved.featured.lists)).toEqual(['pinned']);
    expect(slugsOf(resolved.featured.popular)).toEqual(['b', 'c']);
    expect(slugsOf(resolved.other)).toEqual(['a', 'b', 'c', 'd']);

    const noViews = resolveCategory(config, lists);
    if (noViews.type !== 'groups') throw new Error('expected groups');
    expect(noViews.featured.popular).toEqual([]);
  });
});

describe('resolveSections', () => {
  const config = (sections?: OfficialCategoryConfig['sections']): OfficialCategoryConfig => ({
    ...baseConfig,
    layout: { type: 'groups', groups: [] },
    sections,
  });

  it('uses the default order when not configured', () => {
    expect(resolveSections(config())).toEqual(DEFAULT_SECTIONS);
  });

  it('keeps the configured order, drops duplicates and appends missing sections', () => {
    expect(resolveSections(config(['faq', ['featured', 'faq'], 'main']))).toEqual([
      'faq',
      ['featured'],
      'main',
      'intro',
      'other',
      'archive',
      'related',
    ]);
  });
});

describe('createListSlug', () => {
  it('never gives an official list a category or reserved slug', async () => {
    const { createListSlug } = await import('@pages/api/v1/lists/[username]');
    findMany.mockResolvedValue([]);

    expect(await createListSlug('Quest Log', 'user', true)).toBe('quest-log-2');
    expect(await createListSlug('Cat', 'user', true)).toBe('cat-2');
    expect(await createListSlug('Quest Log', 'user', false)).toBe('quest-log');
  });
});

describe('official category routes', () => {
  const officialDir = join(process.cwd(), 'app', '[locale]', 'lists', 'official');
  // Folders under /lists/official that are not categories.
  const NON_CATEGORY_FOLDERS = ['cat'];
  const folders = readdirSync(officialDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name)
    .filter((name) => !NON_CATEGORY_FOLDERS.includes(name));

  it('has one static route folder per registry category, and no orphan folders', () => {
    expect([...folders].sort()).toEqual([...officialCategorySlugs].sort());
  });

  it.each(officialCategorySlugs)('route folder "%s" renders its own category', (slug) => {
    const page = join(officialDir, slug, 'page.tsx');
    expect(existsSync(page)).toBe(true);
    expect(readFileSync(page, 'utf8')).toContain(`const SLUG = '${slug}';`);
  });

  it('keeps reserved names out of the registry', () => {
    for (const name of NON_CATEGORY_FOLDERS) expect(RESERVED_OFFICIAL_SLUGS).toContain(name);
  });
});
