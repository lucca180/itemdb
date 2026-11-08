import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  userList: {
    findMany: vi.fn(),
  },
}));

vi.mock('@utils/prisma', () => ({ default: prismaMock }));
vi.mock('@utils/googleCloud', () => ({ CheckAuth: vi.fn() }));
vi.mock('@utils/triggerAppRevalidation', () => ({ triggerAppRevalidation: vi.fn() }));
vi.mock('@services/ListService', () => ({ ListService: {} }));
vi.mock('@services/OfficialListLogService', () => ({ logOfficialListAction: vi.fn() }));

import { createListSlug } from '@pages/api/v1/lists/[username]/index';

const taken = (...slugs: string[]) =>
  prismaMock.userList.findMany.mockResolvedValue(slugs.map((slug) => ({ slug })));

describe('createListSlug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    taken();
  });

  test('uses the plain slug when it is free', async () => {
    taken('book-award-checklist-2');
    expect(await createListSlug('Book Award (Checklist)', 'u1', false)).toBe(
      'book-award-checklist'
    );
  });

  test('adds -2 when the slug is taken', async () => {
    taken('book-award-checklist');
    expect(await createListSlug('Book Award (Checklist)', 'u1', false)).toBe(
      'book-award-checklist-2'
    );
  });

  test('skips suffixes that are already taken', async () => {
    taken('book-award-checklist', 'book-award-checklist-2');
    expect(await createListSlug('Book Award (Checklist)', 'u1', false)).toBe(
      'book-award-checklist-3'
    );
  });

  test('fills the lowest free suffix', async () => {
    taken('book-award-checklist', 'book-award-checklist-3');
    expect(await createListSlug('Book Award (Checklist)', 'u1', false)).toBe(
      'book-award-checklist-2'
    );
  });

  test('ignores longer slugs that only share the prefix', async () => {
    taken('book-award-checklist', 'book-award-checklist-kacheek');
    expect(await createListSlug('Book Award (Checklist)', 'u1', false)).toBe(
      'book-award-checklist-2'
    );
  });

  test("a personal list checks all of the owner's lists, official ones included", async () => {
    await createListSlug('My List', 'u1', false);
    const { where } = prismaMock.userList.findMany.mock.calls[0][0];
    expect(where).toEqual({ slug: { startsWith: 'my-list' }, OR: [{ user_id: 'u1' }] });
  });

  test("an official list checks the owner's lists and every official list", async () => {
    await createListSlug('Event Prizes', 'u1', true);
    const { where } = prismaMock.userList.findMany.mock.calls[0][0];
    expect(where).toEqual({
      slug: { startsWith: 'event-prizes' },
      OR: [{ user_id: 'u1' }, { official: true }],
    });
  });

  test('leaves the renamed list out', async () => {
    await createListSlug('My List', 'u1', true, 20);
    const { where } = prismaMock.userList.findMany.mock.calls[0][0];
    expect(where.NOT).toEqual({ internal_id: 20 });
  });
});
