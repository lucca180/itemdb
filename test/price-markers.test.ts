import { describe, expect, it, vi } from 'vitest';
import type { ListItemInfo, UserList } from '@types';

vi.mock('server-only', () => ({}));

vi.mock('@pages/api/v1/items/[id_name]/lists', () => ({
  getItemLists: vi.fn(),
}));

vi.mock('@utils/prisma', () => ({
  default: {
    manualPriceMarkerItem: { findMany: vi.fn() },
  },
}));

import { resolveManualMarkers, resolveOfficialListMarkers } from '@app/server/items/priceMarkers';
import { buildPriceTableData } from '@app/_components/Item/Price/itemPriceUtils';
import { buildPriceChartModel } from '@components/Charts/priceChartModel';
import type { ManualPriceMarker } from '@prisma/generated/client';

const now = new Date('2024-06-15T12:00:00.000Z');

function listFixture(overrides: Partial<UserList> & Pick<UserList, 'name'>): UserList {
  const { name, ...rest } = overrides;
  return {
    internal_id: 1,
    name,
    description: null,
    owner: {
      id: 'u',
      username: 'official',
      neopetsUser: null,
      lastSeen: '2024-01-01T00:00:00.000Z',
    },
    slug: 'test-list',
    coverURL: null,
    colorHex: '#336699',
    purpose: 'none',
    official: true,
    officialTag: ['Event'],
    visibility: 'public',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    sortBy: 'name',
    sortDir: 'asc',
    order: null,
    itemCount: 1,
    itemInfo: [],
    seriesType: 'listDates',
    seriesStart: '2024-03-01T00:00:00.000Z',
    seriesEnd: null,
    dynamicType: null,
    lastSync: null,
    linkedListId: null,
    canBeLinked: false,
    userTag: null,
    highlight: null,
    highlightText: null,
    ...rest,
  };
}

describe('resolveOfficialListMarkers', () => {
  it('maps an open-ended listDates series to an officialList marker', () => {
    const markers = resolveOfficialListMarkers(
      [
        listFixture({
          name: 'Spring Event',
          seriesStart: '2024-03-01T00:00:00.000Z',
          seriesEnd: null,
        }),
      ],
      { firstSeen: '2020-01-01T00:00:00.000Z' },
      now
    );

    expect(markers).toHaveLength(1);
    expect(markers[0]).toMatchObject({
      type: 'officialList',
      title: 'Spring Event',
      slug: 'test-list',
      endAt: null,
      isPoint: false,
      description: null,
    });
    expect(markers[0].id).toBe('officialList-1');
    expect(markers[0].startAt).toBe(new Date('2024-03-01T00:00:00.000Z').toJSON());
  });

  it('marks open itemAddition as isPoint', () => {
    const itemInfo = {
      internal_id: 10,
      list_id: 1,
      item_iid: 99,
      addedAt: '2024-02-10T00:00:00.000Z',
      updatedAt: '2024-02-10T00:00:00.000Z',
      amount: 1,
      capValue: null,
      imported: false,
      order: null,
      isHighlight: false,
      isHidden: false,
      seriesStart: null,
      seriesEnd: null,
    } satisfies ListItemInfo;

    const markers = resolveOfficialListMarkers(
      [
        listFixture({
          name: 'Added Somewhere',
          seriesType: 'itemAddition',
          seriesStart: null,
          seriesEnd: null,
          itemInfo: [itemInfo],
        }),
      ],
      { firstSeen: '2020-01-01T00:00:00.000Z' },
      now
    );

    expect(markers).toHaveLength(1);
    expect(markers[0].isPoint).toBe(true);
    expect(markers[0].endAt).toBeNull();
  });

  it('hides series that start or end in the future', () => {
    const markers = resolveOfficialListMarkers(
      [
        listFixture({
          name: 'Future',
          seriesStart: '2025-01-01T00:00:00.000Z',
          seriesEnd: null,
        }),
      ],
      { firstSeen: '2020-01-01T00:00:00.000Z' },
      now
    );

    expect(markers).toHaveLength(0);
  });

  it('skips series whose end is before the item firstSeen', () => {
    const markers = resolveOfficialListMarkers(
      [
        listFixture({
          name: 'Too Old',
          seriesStart: '2018-01-01T00:00:00.000Z',
          seriesEnd: '2019-01-01T00:00:00.000Z',
        }),
      ],
      { firstSeen: '2020-01-01T00:00:00.000Z' },
      now
    );

    expect(markers).toHaveLength(0);
  });

  it('clamps startAt to item firstSeen', () => {
    const markers = resolveOfficialListMarkers(
      [
        listFixture({
          name: 'Long Event',
          seriesStart: '2018-01-01T00:00:00.000Z',
          seriesEnd: '2024-04-01T00:00:00.000Z',
        }),
      ],
      { firstSeen: '2020-06-15T00:00:00.000Z' },
      now
    );

    expect(markers).toHaveLength(1);
    expect(markers[0].startAt).toBe(new Date('2020-06-15T00:00:00.000Z').toJSON());
    expect(markers[0].endAt).toBe(new Date('2024-04-01T00:00:00.000Z').toJSON());
  });

  it('marks same-day ranges as isPoint', () => {
    const markers = resolveOfficialListMarkers(
      [
        listFixture({
          name: 'One Day',
          seriesStart: '2024-04-10T08:00:00.000Z',
          seriesEnd: '2024-04-10T20:00:00.000Z',
        }),
      ],
      { firstSeen: '2020-01-01T00:00:00.000Z' },
      now
    );

    expect(markers).toHaveLength(1);
    expect(markers[0].isPoint).toBe(true);
    expect(markers[0].endAt).not.toBeNull();
  });
});

describe('buildPriceTableData', () => {
  it('resolves i18n badgeText and keeps title for list name', () => {
    const prices = [
      {
        price_id: 1,
        value: 100,
        addedAt: '2024-05-01T00:00:00.000Z',
        inflated: false,
        isLatest: true,
      },
    ];

    const t = (key: string) => {
      if (key === 'ItemPage.added-to') return 'Added to';
      if (key === 'ItemPage.available-at') return 'Available at';
      if (key === 'ItemPage.unavailable-at') return 'Unavailable at';
      return key;
    };

    const rows = buildPriceTableData(
      prices,
      [
        {
          id: 'officialList-1',
          type: 'officialList',
          title: 'Open',
          description: null,
          slug: 'open',
          color: '#abc',
          startAt: '2024-04-01T00:00:00.000Z',
          endAt: null,
          isPoint: true,
        },
        {
          id: 'officialList-2',
          type: 'officialList',
          title: 'Window',
          description: 'Seasonal drop',
          slug: 'window',
          color: '#def',
          startAt: '2024-03-01T00:00:00.000Z',
          endAt: '2024-03-31T00:00:00.000Z',
          isPoint: false,
        },
      ],
      t
    );

    const markerRows = rows.filter((row) => row.marker);
    expect(markerRows).toHaveLength(3);
    expect(markerRows.map((row) => row.badgeText).sort()).toEqual(
      ['Added to', 'Available at', 'Unavailable at'].sort()
    );
    expect(markerRows.find((row) => row.badgeText === 'Added to')?.title).toBe('Open');
    expect(markerRows.find((row) => row.description === 'Seasonal drop')?.title).toBe('Window');
  });

  it('uses marker.badgeText when already provided (manual markers)', () => {
    const rows = buildPriceTableData(
      [],
      [
        {
          id: 'manual-1',
          type: 'manual',
          title: 'Event',
          badgeText: 'Price spike',
          description: null,
          color: '#fff',
          startAt: '2024-04-01T00:00:00.000Z',
          endAt: null,
          isPoint: true,
        },
      ],
      (key) => key
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].badgeText).toBe('Price spike');
    expect(rows[0].title).toBe('Event');
  });

  it('resolves auto i18n badge when manual badgeText is null', () => {
    const t = (key: string) => {
      if (key === 'ItemPage.added-to') return 'Added to';
      if (key === 'ItemPage.available-at') return 'Available at';
      if (key === 'ItemPage.unavailable-at') return 'Unavailable at';
      return key;
    };

    const rows = buildPriceTableData(
      [],
      [
        {
          id: 'manual-auto',
          type: 'manual',
          title: 'Drop window',
          badgeText: null,
          description: null,
          color: '#abc',
          startAt: '2024-03-01T00:00:00.000Z',
          endAt: '2024-03-31T00:00:00.000Z',
          isPoint: false,
        },
      ],
      t
    );

    expect(rows.map((row) => row.badgeText).sort()).toEqual(
      ['Available at', 'Unavailable at'].sort()
    );
  });

  it('hides badge when manual badgeText is an empty string', () => {
    const rows = buildPriceTableData(
      [],
      [
        {
          id: 'manual-hidden',
          type: 'manual',
          title: 'Just a title',
          badgeText: '',
          description: null,
          color: '#abc',
          startAt: '2024-04-01T00:00:00.000Z',
          endAt: null,
          isPoint: true,
        },
      ],
      (key) => key
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].badgeText).toBeUndefined();
    expect(rows[0].title).toBe('Just a title');
  });

  it('uses custom badge and description at start, translated closing badge at end', () => {
    const t = (key: string) => (key === 'ItemPage.unavailable-at' ? 'Unavailable at' : key);
    const rows = buildPriceTableData(
      [],
      [
        {
          id: 'manual-range',
          type: 'manual',
          title: 'Event title',
          badgeText: 'Event begins',
          description: 'Event details',
          color: '#abc',
          startAt: '2024-04-01T18:00:00.000Z',
          endAt: '2024-04-10T18:00:00.000Z',
          isPoint: false,
        },
      ],
      t
    ).filter((row) => row.marker);

    const start = rows.find((row) => row.markerEdge === 'start');
    const end = rows.find((row) => row.markerEdge === 'end');
    expect(start).toMatchObject({
      markerId: 'manual-range',
      badgeText: 'Event begins',
      description: 'Event details',
    });
    expect(end).toMatchObject({
      markerId: 'manual-range',
      badgeText: 'Unavailable at',
      description: null,
    });
  });

  it('keeps description on both range edges when title is absent', () => {
    const rows = buildPriceTableData(
      [],
      [
        {
          id: 'manual-description-only',
          type: 'manual',
          title: null,
          badgeText: '',
          description: 'Only context',
          color: '#abc',
          startAt: '2024-04-01T18:00:00.000Z',
          endAt: '2024-04-10T18:00:00.000Z',
          isPoint: false,
        },
      ]
    ).filter((row) => row.marker);

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.description === 'Only context')).toBe(true);
    expect(new Set(rows.map((row) => `${row.markerId}-${row.markerEdge}`)).size).toBe(2);
  });
});

function manualMarkerFixture(
  overrides: Partial<ManualPriceMarker> & Pick<ManualPriceMarker, 'internal_id'>
): ManualPriceMarker {
  return {
    internal_id: overrides.internal_id,
    badgeText: 'badgeText' in overrides ? (overrides.badgeText ?? null) : 'Released',
    title: 'title' in overrides ? (overrides.title ?? null) : 'Grand Event',
    description: 'description' in overrides ? (overrides.description ?? null) : null,
    color: overrides.color ?? '#123456',
    startAt: overrides.startAt ?? new Date('2024-03-01T00:00:00.000Z'),
    endAt: 'endAt' in overrides ? (overrides.endAt ?? null) : null,
    isPoint: overrides.isPoint ?? false,
    createdBy: overrides.createdBy ?? null,
    createdAt: overrides.createdAt ?? new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2024-01-01T00:00:00.000Z'),
  };
}

describe('resolveManualMarkers', () => {
  it('passes admin fields through and marks type manual (no slug)', () => {
    const [marker] = resolveManualMarkers(
      [
        manualMarkerFixture({
          internal_id: 7,
          badgeText: 'Retired',
          title: 'Retirement',
          description: 'Left the shop',
          color: '#abcdef',
          startAt: new Date('2024-04-01T00:00:00.000Z'),
          endAt: null,
          isPoint: true,
        }),
      ],
      { firstSeen: '2024-01-01T00:00:00.000Z' },
      now
    );

    expect(marker).toMatchObject({
      id: 'manual-7',
      type: 'manual',
      title: 'Retirement',
      badgeText: 'Retired',
      description: 'Left the shop',
      color: '#abcdef',
      isPoint: true,
      endAt: null,
    });
    expect(marker).not.toHaveProperty('slug');
  });

  it('clamps startAt to the item firstSeen', () => {
    const [marker] = resolveManualMarkers(
      [
        manualMarkerFixture({
          internal_id: 1,
          startAt: new Date('2024-01-01T00:00:00.000Z'),
        }),
      ],
      { firstSeen: '2024-02-15T00:00:00.000Z' },
      now
    );

    expect(marker.startAt).toBe(new Date('2024-02-15T00:00:00.000Z').toJSON());
  });

  it('hides markers that are still partially in the future', () => {
    const resolved = resolveManualMarkers(
      [
        manualMarkerFixture({
          internal_id: 1,
          startAt: new Date('2024-05-01T00:00:00.000Z'),
          endAt: new Date('2024-12-31T00:00:00.000Z'),
        }),
      ],
      { firstSeen: '2024-01-01T00:00:00.000Z' },
      now
    );

    expect(resolved).toHaveLength(0);
  });

  it('skips markers whose window ended before the item existed', () => {
    const resolved = resolveManualMarkers(
      [
        manualMarkerFixture({
          internal_id: 1,
          startAt: new Date('2023-01-01T00:00:00.000Z'),
          endAt: new Date('2023-02-01T00:00:00.000Z'),
        }),
      ],
      { firstSeen: '2024-01-01T00:00:00.000Z' },
      now
    );

    expect(resolved).toHaveLength(0);
  });
  it('filters markers with null badgeText, title, and description', () => {
    const resolved = resolveManualMarkers(
      [
        manualMarkerFixture({
          internal_id: 3,
          badgeText: null,
          title: null,
          description: null,
        }),
      ],
      { firstSeen: '2024-01-01T00:00:00.000Z' },
      now
    );

    expect(resolved).toHaveLength(0);
  });

  it('coerces same-day manual ranges into isPoint with null endAt', () => {
    const [marker] = resolveManualMarkers(
      [
        manualMarkerFixture({
          internal_id: 9,
          startAt: new Date('2024-04-10T18:00:00.000Z'),
          endAt: new Date('2024-04-10T18:00:00.000Z'),
          isPoint: false,
        }),
      ],
      { firstSeen: '2024-01-01T00:00:00.000Z' },
      now
    );

    expect(marker.isPoint).toBe(true);
    expect(marker.endAt).toBeNull();
  });
});

describe('buildPriceChartModel', () => {
  const defaultSeries = {
    id: 'default',
    name: 'Price history',
    lineColor: '#fff',
    topColor: '#fff',
    bottomColor: '#fff0',
    startTime: Number.NEGATIVE_INFINITY,
    endTime: null,
  };

  const prices = [
    {
      price_id: 1,
      value: 100,
      addedAt: '2024-03-01T12:00:00.000Z',
      inflated: false,
      isLatest: false,
    },
    {
      price_id: 2,
      value: 200,
      addedAt: '2024-04-15T12:00:00.000Z',
      inflated: false,
      isLatest: false,
    },
    {
      price_id: 3,
      value: 300,
      addedAt: '2024-05-20T12:00:00.000Z',
      inflated: false,
      isLatest: true,
    },
  ];

  it('renders isPoint markers as seriesPoints and ranges as colored segments', () => {
    const { segments, seriesPoints } = buildPriceChartModel(
      prices,
      [
        {
          id: 'officialList-1',
          type: 'officialList',
          title: 'Point Event',
          description: 'Hello **world**',
          slug: 'point',
          color: '#abcabc',
          startAt: '2024-04-10T00:00:00.000Z',
          endAt: null,
          isPoint: true,
        },
        {
          id: 'officialList-2',
          type: 'officialList',
          title: 'Range Event',
          description: null,
          slug: 'range',
          color: '#112233',
          startAt: '2024-03-01T00:00:00.000Z',
          endAt: '2024-04-30T00:00:00.000Z',
          isPoint: false,
        },
      ],
      defaultSeries
    );

    expect(seriesPoints).toHaveLength(1);
    expect(seriesPoints[0]).toMatchObject({
      id: 'officialList-1',
      name: 'Point Event',
      description: 'Hello world',
    });

    const rangeSegments = segments.filter((segment) => segment.id === 'officialList-2');
    expect(rangeSegments.length).toBeGreaterThan(0);
    expect(rangeSegments[0].name).toBe('Range Event');
  });

  it('carries description onto range segments for chart tooltips', () => {
    const { segments } = buildPriceChartModel(
      prices,
      [
        {
          id: 'manual-range',
          type: 'manual',
          title: 'Sale',
          badgeText: null,
          description: 'Hello **world**',
          color: '#112233',
          startAt: '2024-03-01T00:00:00.000Z',
          endAt: '2024-04-30T00:00:00.000Z',
          isPoint: false,
        },
      ],
      defaultSeries
    );

    const rangeSegments = segments.filter((segment) => segment.id === 'manual-range');
    expect(rangeSegments.length).toBeGreaterThan(0);
    expect(rangeSegments[0].description).toBe('Hello world');
  });
});
