import objectHash from 'object-hash';

/**
 * Canonical CDN path hash for outfit previews.
 * Shared by the outfit API route and client CDN URL builders — keep in sync.
 */
export function outfitPreviewPathHash(
  itemIds: number[],
  speciesId?: number | null,
  colorId?: number | null
): string {
  // Keep version 2 + itemIds-only hash when no pet prefs (existing CDN keys).
  // When species/color are set, include them so clothed previews don't collide.
  return objectHash({
    version: 2,
    itemIds,
    ...(speciesId != null || colorId != null
      ? { speciesId: speciesId ?? null, colorId: colorId ?? null }
      : {}),
  });
}

/**
 * Client-safe outfit preview API URL builder (no Redis / Prisma / API imports).
 */
export function buildOutfitPreviewUrl(
  items: { internal_id: number }[],
  speciesId?: number | null,
  colorId?: number | null
): string {
  let url = '/api/cache/preview/outfit?';
  if (speciesId) url += `petId=${speciesId}&`;
  if (colorId) url += `colorId=${colorId}&`;
  for (const item of items) {
    url += `iid[]=${item.internal_id}&`;
  }
  return url;
}
