import { describe, expect, test } from 'vitest';
import { isValidOptionalOwnerHash, isValidOwnerHash, omitOwnerHash } from '@utils/ownerHash';

describe('owner hash validation', () => {
  test('accepts a lowercase SHA-256 hex digest', () => {
    expect(isValidOwnerHash('a'.repeat(64))).toBe(true);
  });

  test('rejects missing, malformed, and uppercase values', () => {
    expect(isValidOwnerHash(undefined)).toBe(false);
    expect(isValidOwnerHash('a'.repeat(63))).toBe(false);
    expect(isValidOwnerHash('g'.repeat(64))).toBe(false);
    expect(isValidOwnerHash('A'.repeat(64))).toBe(false);
  });

  test('accepts an absent optional hash and rejects null', () => {
    expect(isValidOptionalOwnerHash(undefined)).toBe(true);
    expect(isValidOptionalOwnerHash(null)).toBe(false);
  });

  test('removes ownerHash without changing the source object', () => {
    const source = { owner: 'abc***', ownerHash: 'a'.repeat(64), trade_id: 1 };

    expect(omitOwnerHash(source)).toEqual({ owner: 'abc***', trade_id: 1 });
    expect(source.ownerHash).toBe('a'.repeat(64));
  });
});
