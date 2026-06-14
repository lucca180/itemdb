import { getPathname } from '@i18n/navigation';
import type { ShopInfo } from '@types';
import { restockShopInfo, slugify } from '@utils/utils';

export type RestockShopRouteResult =
  | { type: 'redirect'; destination: string }
  | { type: 'notFound' }
  | { type: 'ok'; shop: ShopInfo };

export function resolveRestockShopSlug(id: string): ShopInfo | null {
  return Object.values(restockShopInfo).find((shop) => slugify(shop.name) === id) ?? null;
}

export function resolveRestockShopForMetadata(id: string): ShopInfo | null {
  if (!Number.isNaN(Number(id))) {
    return restockShopInfo[id] ?? null;
  }

  const shopInfo = resolveRestockShopSlug(id);
  if (!shopInfo || Number(shopInfo.id) < 0) return null;
  return shopInfo;
}

export function resolveRestockShopRoute(
  id: string,
  locale: string,
  options?: { history?: boolean }
): RestockShopRouteResult {
  const historySuffix = options?.history ? '/history' : '';

  if (!Number.isNaN(Number(id))) {
    const shopById = restockShopInfo[id];
    if (shopById) {
      return {
        type: 'redirect',
        destination: getPathname({
          locale,
          href: `/restock/${slugify(shopById.name)}${historySuffix}`,
        }),
      };
    }
    return { type: 'notFound' };
  }

  const shopInfo = resolveRestockShopSlug(id);
  if (!shopInfo || Number(shopInfo.id) < 0) return { type: 'notFound' };
  return { type: 'ok', shop: shopInfo };
}

export function getRestockShopPathname(shop: ShopInfo, history = false) {
  const suffix = history ? '/history' : '';
  return `/restock/${slugify(shop.name)}${suffix}` as const;
}
