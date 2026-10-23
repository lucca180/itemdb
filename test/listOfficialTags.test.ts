import { describe, expect, test } from 'vitest';
import { hasAnyOfficialTag, parseOfficialTagQuery } from '@services/list/listMappers';

describe('parseOfficialTagQuery', () => {
  test('splits, trims and lowercases comma-separated tags', () => {
    expect(parseOfficialTagQuery('Festival of Fears, Trick-or-Treat,NC Event')).toEqual([
      'festival of fears',
      'trick-or-treat',
      'nc event',
    ]);
  });

  test('ignores empty entries', () => {
    expect(parseOfficialTagQuery(' , Stamps ,')).toEqual(['stamps']);
    expect(parseOfficialTagQuery('')).toEqual([]);
  });
});

describe('hasAnyOfficialTag', () => {
  const tags = parseOfficialTagQuery('festival of fears, trick-or-treat');

  test('matches any of the tags, ignoring case', () => {
    expect(hasAnyOfficialTag({ officialTag: ['NC Event', 'Festival of Fears'] }, tags)).toBe(true);
    expect(hasAnyOfficialTag({ officialTag: ['Trick-or-Treat'] }, tags)).toBe(true);
  });

  test('needs an exact tag, not a substring', () => {
    expect(hasAnyOfficialTag({ officialTag: ['Festival of Fears 2026'] }, tags)).toBe(false);
    expect(hasAnyOfficialTag({ officialTag: [] }, tags)).toBe(false);
  });

  test('uncategorized matches untagged lists alongside other tags', () => {
    const withUncategorized = parseOfficialTagQuery('uncategorized, stamps');

    expect(hasAnyOfficialTag({ officialTag: [] }, withUncategorized)).toBe(true);
    expect(hasAnyOfficialTag({ officialTag: ['Stamps'] }, withUncategorized)).toBe(true);
    expect(hasAnyOfficialTag({ officialTag: ['Dailies'] }, withUncategorized)).toBe(false);
  });
});
