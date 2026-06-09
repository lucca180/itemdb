import type { ItemData } from '@types';
import { isMME } from '@pages/api/v1/items/[id_name]/mme';
import { shouldShowTradeLists } from '@utils/utils';

export const isPetDayCapsule = (name: string) => /Day Y\d+ Mini Mystery Capsule/i.test(name);

export function needsTradeLists(item: ItemData) {
  return shouldShowTradeLists(item);
}

export function needsNPPrices(item: ItemData) {
  return !item.isNC && item.status?.toLowerCase() !== 'no trade';
}

export function needsNCTrade(item: ItemData) {
  return item.isNC;
}

export function needsNCMall(item: ItemData) {
  return item.isNC;
}

export function needsDrops(item: ItemData) {
  return item.useTypes.canOpen !== 'false';
}

export function needsPetpet(item: ItemData) {
  return !item.isNC && !item.isWearable && !item.isBD && !item.isNeohome;
}

export function needsRecipes(item: ItemData) {
  return !item.isNC;
}

export function needsDye(item: ItemData) {
  return item.isNC && item.isWearable;
}

export function needsMME(item: ItemData) {
  return isMME(item.name);
}

export function needsTradeCard(item: ItemData) {
  return !item.isNC && item.status === 'active';
}

export function needsRestockLastSeen(item: ItemData) {
  return !!item.findAt.restockShop;
}

export function needsWearableData(item: ItemData) {
  return item.isWearable;
}

export function needsOutfitSection(item: ItemData) {
  return !item.isWearable && isPetDayCapsule(item.name) && item.useTypes.canOpen !== 'false';
}

export function needsLebronTradeHistory(item: ItemData) {
  return item.isNC && item.status !== 'no trade';
}
