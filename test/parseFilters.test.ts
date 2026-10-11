import { describe, expect, it } from 'vitest';
import { parseFilters } from '@utils/parseFilters';

const toBoolean = (query: string) => parseFilters(query, false)[1];

describe('parseFilters boolean query sanitization', () => {
  // Each of these used to reach MATCH ... IN BOOLEAN MODE and fail with MariaDB error 1064.
  it.each([
    ['* greater yellow collectable scarab', '+greater +yellow +collectable +scarab'],
    ['*foo', '+foo'],
    ['foo *', '+foo'],
    ['foo**', '+foo*'],
    ['+*foo', '+foo'],
    ['foo ~', '+foo'],
    ['foo~', '+foo'],
    ['- foo', '+foo'],
    ['~+foo', '+foo'],
    ['(foo bar-)', '+(foo bar)'],
    ['foo "bar', '+foo +bar'],
    ['foo ()', '+foo'],
  ])('sanitizes %j', (input, expected) => {
    expect(toBoolean(input)).toBe(expected);
  });

  it.each(['*', '-', '~', '<', '> <', '()', '"'])('drops operator-only query %j', (input) => {
    expect(toBoolean(input)).toBe('');
  });

  it.each([
    ['yellow scarab', '+yellow +scarab'],
    ['nc*', '+nc*'],
    ['--foo', '-foo'],
    ['>foo', '>foo'],
    ['"foo bar" baz*', '+"foo bar" +baz*'],
  ])('keeps valid query %j', (input, expected) => {
    expect(toBoolean(input)).toBe(expected);
  });

  // InnoDB would read "+hand-painted" as "+hand -painted"
  it.each([
    ['digi-space glasses', '+"digi-space" +glasses'],
    ['x-ray goggles', '+"x-ray" +goggles'],
    ['-digi-space glasses', '-"digi-space" +glasses'],
    ['(digi-space glasses) foo', '+("digi-space" glasses) +foo'],
    ['5-in-1 game', '"5-in-1" +game'],
    ['hand-pai* vase', '+hand +pai* +vase'],
  ])('quotes hyphenated word %j', (input, expected) => {
    expect(toBoolean(input)).toBe(expected);
  });

  it.each([
    ['"yellow scarab" collectable', '+"yellow scarab" +collectable'],
    ['"a fish"', '+"a fish"'],
    ['"case of the missing"', '+"case of the missing"'],
    ['-"yellow scarab" scarab', '-"yellow scarab" +scarab'],
    ['(foo "bar baz")', '+(foo "bar baz")'],
  ])('requires phrase %j', (input, expected) => {
    expect(toBoolean(input)).toBe(expected);
  });

  // a required phrase of only stopwords/short words would match nothing
  it.each([
    ['"of the" fish', '"of the" +fish'],
    ['"a" fish', '"a" +fish'],
  ])('keeps stopword-only phrase optional %j', (input, expected) => {
    expect(toBoolean(input)).toBe(expected);
  });

  it.each([
    ['"yellow scarab" @3', '+"yellow scarab" @3'],
    ['"yellow scarab"@3 fish', '+"yellow scarab" @3 +fish'],
    ['scarab @3', '+scarab'],
    ['foo@bar', '+foobar'],
  ])('keeps @N only after a phrase: %j', (input, expected) => {
    expect(toBoolean(input)).toBe(expected);
  });
});

describe('parseFilters inline filters', () => {
  it('parses camelCase filters regardless of case', () => {
    const [filters, query] = parseFilters(
      'Scarab priceMin:1000 PRICEMAX:5000 sortBy:estVal sortDir:DESC colorType:Vibrant'
    );

    expect(query).toBe('scarab');
    expect(filters.price).toEqual(['1000', '5000']);
    expect(filters.sortBy).toBe('estVal');
    expect(filters.sortDir).toBe('desc');
    expect(filters.colorType).toBe('vibrant');
  });

  it('fills the missing side of a range with an empty string', () => {
    expect(parseFilters('foo rarityMax:100')[0].rarity).toEqual(['', '100']);
    expect(parseFilters('foo weightMin:5')[0].weight).toEqual(['5', '']);
    expect(parseFilters('foo')[0].price).toEqual([]);
  });

  it('collects every occurrence of a repeated filter', () => {
    const [filters, query] = parseFilters('cat:food scarab cat:toy -cat:"neocash items",gift');

    expect(query).toBe('scarab');
    expect(filters.category).toEqual(['food', 'toy', '!neocash items', '!gift']);
  });

  it.each(['boolean', 'natural', 'fuzzy', 'name'])('accepts mode:%s', (mode) => {
    expect(parseFilters(`foo mode:${mode}`)[0].mode).toBe(mode);
  });

  it('ignores unknown modes', () => {
    expect(parseFilters('foo mode:whatever')[0].mode).toBe('name');
  });
});
