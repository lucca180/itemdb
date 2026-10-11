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
    ['foo-bar', '+foo-bar'],
    ['"foo bar" baz*', '"foo bar" +baz*'],
  ])('keeps valid query %j', (input, expected) => {
    expect(toBoolean(input)).toBe(expected);
  });
});
