export const OWNER_HASH_PATTERN = /^[a-f0-9]{64}$/;

export const isValidOwnerHash = (value: unknown): value is string =>
  typeof value === 'string' && OWNER_HASH_PATTERN.test(value);

export const isValidOptionalOwnerHash = (value: unknown): value is string | undefined =>
  value === undefined || isValidOwnerHash(value);

export const omitOwnerHash = <T extends { ownerHash?: unknown }>(
  value: T
): Omit<T, 'ownerHash'> => {
  const result = { ...value };
  delete result.ownerHash;
  return result;
};
