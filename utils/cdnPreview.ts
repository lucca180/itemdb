import { petColorSlug } from '@utils/pet-utils';
import { buildOutfitPreviewUrl, outfitPreviewPathHash } from '@utils/outfitPreviewUrl';

export const ITEMDB_CDN = 'https://cdn.itemdb.com.br';

export type PreviewSources = {
  cdn: string;
  api: string;
};

function withOptionalHash(url: string, hash?: string | null): string {
  if (!hash) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}hash=${hash}`;
}

/** Wearable / style-token body preview. */
export function wearablePreviewSources(imageId: string, hash?: string | null): PreviewSources {
  const id = imageId.replace(/\.png$/i, '');
  return {
    cdn: withOptionalHash(`${ITEMDB_CDN}/preview/${id}.png`, hash),
    api: withOptionalHash(`/api/cache/preview/${id}.png`, hash),
  };
}

/** Bare pet color combo preview. */
export function petColorPreviewSources(
  speciesName: string,
  colorName: string,
  hash?: string | null
): PreviewSources {
  const id = `${petColorSlug(speciesName)}_${petColorSlug(colorName)}`;
  return {
    cdn: withOptionalHash(`${ITEMDB_CDN}/colors/${id}.png`, hash),
    api: withOptionalHash(`/api/cache/preview/color/${id}.png`, hash),
  };
}

/** Pet color preview from thumbnail slugs already used by the color API. */
export function petColorPreviewSourcesFromSlugs(
  speciesSlug: string,
  colorSlug: string,
  hash?: string | null
): PreviewSources {
  const id = `${speciesSlug}_${colorSlug}`;
  return {
    cdn: withOptionalHash(`${ITEMDB_CDN}/colors/${id}.png`, hash),
    api: withOptionalHash(`/api/cache/preview/color/${id}.png`, hash),
  };
}

/**
 * Extra CDN object for partial color previews (`null_baby` → also store that key).
 * Full combos return null — they already match the resolved file.
 */
export function colorPreviewAliasPath(requestedId: string, resolvedId: string): string | null {
  const requested = requestedId.replace(/\.png$/i, '');
  const resolved = resolvedId.replace(/\.png$/i, '');
  if (!requested || requested === resolved) return null;
  return `colors/${requested}.png`;
}

/** Skip CDN and hit the API cache route (user-triggered refresh). */
export function previewSourcesForceApi(apiSrc: string, refreshId: number): PreviewSources {
  const sep = apiSrc.includes('?') ? '&' : '?';
  const api = `${apiSrc}${sep}refresh=true&refresh_id=${refreshId}`;
  return { cdn: api, api };
}

/** Clothed / multi-item outfit preview (hash must match outfit API). */
export function outfitPreviewSources(
  items: { internal_id: number }[],
  speciesId?: number | null,
  colorId?: number | null
): PreviewSources {
  const itemIds = items.map((item) => item.internal_id);
  const pathHash = outfitPreviewPathHash(itemIds, speciesId, colorId);
  return {
    cdn: `${ITEMDB_CDN}/preview/${pathHash}.png`,
    api: buildOutfitPreviewUrl(items, speciesId, colorId),
  };
}

/**
 * Resolve CDN/API sources for a combo tile preview URL.
 * Known colors use pet-color paths; wearable CDN URLs fall back via image id.
 */
export function comboTilePreviewSources(
  speciesName: string,
  colorName: string,
  previewUrl: string,
  isUnknownColor: boolean
): PreviewSources {
  if (!isUnknownColor) {
    return petColorPreviewSources(speciesName, colorName);
  }
  const match = previewUrl.match(/\/preview\/([^/?#]+)\.png/i);
  if (match?.[1]) return wearablePreviewSources(match[1]);
  return { cdn: previewUrl, api: previewUrl };
}
