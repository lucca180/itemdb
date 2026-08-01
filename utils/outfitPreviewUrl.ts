/**
 * Client-safe outfit preview URL builder (no Redis / Prisma / API imports).
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
