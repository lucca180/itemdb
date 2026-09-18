import type { ItemData, ItemFindAt } from '@types';
import {
  DiscordActionRowComponent,
  DiscordButtonComponent,
  DiscordComponentEmbedPayload,
  DiscordEmbedComponent,
  hexToDiscordColor,
} from '@app/utils/discordComponentEmbed';
import { needsNPPrices } from '@app/_components/Item/itemPageGates';
import { truncateItemOgDescription } from '@app/_components/Item/seo/buildItemMetaDescription';
import { loadNCMallData } from '@app/_components/Item/loadUtils';
import { isMallDiscounted } from '@components/Items/NCMallCard';
import { getCachedNow } from '@utils/getCachedNow';
import { getRestockPrice } from '@utils/utils';

/** itemdb's Discord application emoji, used on the "View on itemdb" link button. */
const ITEMDB_EMOJI = { id: '1082484097856847872', name: 'itemdb' };

/** Same icons/order as tarnumBot's `getItemButtons` (itemdbManager.ts) — no `name`, matching how those emoji have always been sent. */
const FIND_AT_BUTTONS: { key: keyof ItemFindAt; emojiId: string }[] = [
  { key: 'shopWizard', emojiId: '1088692135068446722' },
  { key: 'trading', emojiId: '1088692308033155102' },
  { key: 'auction', emojiId: '1088692277246963732' },
  { key: 'safetyDeposit', emojiId: '1088692508856430662' },
  { key: 'closet', emojiId: '1088692525822390352' },
  { key: 'restockShop', emojiId: '1088692470365302804' },
];

/** Action rows hold at most 5 components. */
function chunkIntoRows(buttons: DiscordButtonComponent[]): DiscordActionRowComponent[] {
  const rows: DiscordActionRowComponent[] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push({ type: 1, components: buttons.slice(i, i + 5) });
  }
  return rows;
}

const numberFormatter = new Intl.NumberFormat('en-US');

type PriceLines = { price: string | null; ncEstimate: string | null };

/**
 * Price prefers a live NC Mall price (with discount) over the NP price. If the item is
 * NC but isn't currently buyable in the mall, the NC value estimate (itemdb/Lebron) goes
 * in its own field instead, same distinction the item page's NCTradeValueBadge makes.
 */
async function buildPriceLines(item: ItemData): Promise<PriceLines> {
  if (item.isNC) {
    const [ncMallData, now] = await Promise.all([loadNCMallData(item.internal_id), getCachedNow()]);
    const isBuyable =
      !!ncMallData?.active && (!ncMallData.saleEnd || new Date(ncMallData.saleEnd).getTime() > now);

    if (ncMallData && isBuyable) {
      const price = isMallDiscounted(ncMallData, now)
        ? `~~${ncMallData.price} NC~~ **${ncMallData.discountPrice} NC**`
        : ncMallData.price > 0
          ? `${ncMallData.price} NC`
          : 'Free';
      return { price, ncEstimate: null };
    }

    if (item.ncValue) {
      const label = item.ncValue.source === 'lebron' ? 'Lebron Value' : 'itemdb Value';
      return { price: null, ncEstimate: `**${label}:** ${item.ncValue.range}` };
    }

    return { price: null, ncEstimate: null };
  }

  if (needsNPPrices(item) && item.price.value) {
    return { price: `${numberFormatter.format(item.price.value)} NP`, ncEstimate: null };
  }

  return { price: null, ncEstimate: null };
}

/** "Easy to Sell" / "Hard to Sell" only — a "Normal" status isn't worth a line in a compact preview. */
function saleStatusLine(item: ItemData): string | null {
  if (item.saleStatus?.status === 'ets') return '**Sale Status:** Easy to Sell';
  if (item.saleStatus?.status === 'hts') return '**Sale Status:** Hard to Sell';
  return null;
}

/** Same [min, max] range and "Restock Price" label as ItemRestockInfo.tsx, including live special-day discounts. */
function restockPriceLine(item: ItemData): string | null {
  if (!item.findAt?.restockShop) return null;
  const prices = getRestockPrice(item);
  if (!prices) return null;

  const [min, max] = prices;
  const range =
    min !== max
      ? `${numberFormatter.format(min)} - ${numberFormatter.format(max)} NP`
      : `${numberFormatter.format(min)} NP`;

  return `**Restock Price:** ${range}`;
}

/** Same DTI render + cache-busting hash used for the item's wearable Product JSON-LD (ItemBreadcrumb.tsx). */
function wearablePreviewUrl(item: ItemData): string | null {
  if (!item.isWearable) return null;
  const cacheHash = item.cacheHash ? `?hash=${item.cacheHash}` : '';
  return `https://itemdb.com.br/api/cache/preview/${item.image_id}.png${cacheHash}`;
}

type BuildItemDiscordEmbedInput = {
  item: ItemData;
  canonical: string;
};

export async function buildItemDiscordEmbed({
  item,
  canonical,
}: BuildItemDiscordEmbedInput): Promise<DiscordComponentEmbedPayload> {
  const accent_color = hexToDiscordColor(item.color.hex);
  const { price, ncEstimate } = await buildPriceLines(item);
  const descriptionLine = truncateItemOgDescription(item.description);
  const saleStatus = saleStatusLine(item);
  const restockPrice = restockPriceLine(item);
  const wearablePreview = wearablePreviewUrl(item);

  const findAtButtons: DiscordButtonComponent[] = FIND_AT_BUTTONS.filter(
    ({ key }) => item.findAt?.[key]
  ).map(({ key, emojiId }) => ({
    type: 2,
    style: 5,
    url: item.findAt[key]!,
    emoji: { id: emojiId },
  }));

  const itemdbButton: DiscordButtonComponent = {
    type: 2,
    style: 5,
    url: canonical,
    label: 'View on itemdb',
    emoji: ITEMDB_EMOJI,
  };

  const components: DiscordEmbedComponent[] = [
    {
      type: 9,
      components: [
        { type: 10, content: `# ${item.name}` },
        ...(descriptionLine ? [{ type: 10 as const, content: `*${descriptionLine}*` }] : []),
      ],
      accessory: { type: 11, media: { url: item.image } },
    },
    { type: 14, spacing: 1 },
    ...(price ? [{ type: 10 as const, content: `**Price:** ${price}` }] : []),
    ...(ncEstimate ? [{ type: 10 as const, content: ncEstimate }] : []),
    ...(saleStatus ? [{ type: 10 as const, content: saleStatus }] : []),
    ...(restockPrice ? [{ type: 10 as const, content: restockPrice }] : []),
    ...(item.comment ? [{ type: 10 as const, content: `**Notes:** ${item.comment}` }] : []),
    ...(wearablePreview
      ? [
          {
            type: 12 as const,
            items: [{ media: { url: wearablePreview }, description: item.name }],
          },
        ]
      : []),
    ...chunkIntoRows([itemdbButton, ...findAtButtons]),
  ];

  return {
    component: {
      type: 17,
      ...(accent_color !== undefined ? { accent_color } : {}),
      components,
    },
  };
}
