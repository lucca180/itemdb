/**
 * "Suggest price context" for item price entries.
 *
 * Users (logged in or not) suggest the context of one price entry (why it spiked, an event, a
 * restock...), or a correction of the current one. Each suggestion is one `DataCollecting` row
 * (`type = PRICE_CONTEXT_SUGGESTION_TYPE`, `subject_id = ItemPrices.internal_id`,
 * `note = suggested context`). Admins review them in the "Price context" tab of
 * `/admin/list-suggestions`: approving writes `ItemPrices.priceContext` (admin may edit the text
 * first), rejecting just marks the rows as processed.
 *
 * Flow:
 * - {@link submitPriceContextSuggestion}: user submission (server action on the item page)
 * - {@link listPendingPriceContextSuggestions}: admin queue
 * - {@link resolvePriceContextSuggestions}: admin approve/reject
 *   (`POST /api/admin/price-context/suggestions`)
 *
 * This service owns all input validation; callers only handle auth/transport.
 */
import 'server-only';

import Chance from 'chance';
import { Webhook, EmbedBuilder } from '@tycrek/discord-hookr';
import prisma from '@utils/prisma';
import { itemSectionCacheTags } from '@utils/appCacheTags';
import { revalidateAppCacheTags } from '@utils/revalidateAppCacheTags';
import { LogService } from '@services/ActionLogService';
import { ItemService } from '@services/ItemService';
import type { ItemV2For, User } from '@types';
import {
  MAX_PRICE_CONTEXT_SUGGESTION_LENGTH,
  MAX_PRICE_CONTEXT_SUGGESTIONS_PER_DAY,
  PRICE_CONTEXT_SUGGESTION_TYPE,
} from '@utils/prices/priceContextSuggestionConstants';

const DAY = 1000 * 60 * 60 * 24;

/** Expected validation failures; returned to the client as-is so it can show a message. */
export type PriceContextSuggestionErrorCode =
  | 'forbidden'
  | 'invalid-price'
  | 'invalid-action'
  | 'empty-context'
  | 'context-too-long'
  | 'same-as-current'
  | 'already-suggested'
  | 'too-many-requests';

/** Thrown for expected input/permission errors (maps to a 4xx / `success: false`). */
export class PriceContextSuggestionError extends Error {
  code: PriceContextSuggestionErrorCode;

  constructor(code: PriceContextSuggestionErrorCode) {
    super(code);
    this.name = 'PriceContextSuggestionError';
    this.code = code;
  }
}

const chance = new Chance();

function normalizePriceId(value: unknown): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Untrusted context text → trimmed text; throws when empty or longer than the column. */
function normalizeContext(value: unknown): string {
  const context = typeof value === 'string' ? value.trim() : '';
  if (!context) throw new PriceContextSuggestionError('empty-context');
  if (context.length > MAX_PRICE_CONTEXT_SUGGESTION_LENGTH)
    throw new PriceContextSuggestionError('context-too-long');

  return context;
}

/**
 * Who a suggestion belongs to, for deduping and rate limiting: the user id, or (logged out) the
 * IP among anonymous rows. `null` when a logged-out request has no IP, so nothing can be matched.
 */
function authorFilter(user: User | null, ip: string | null | undefined) {
  if (user) return { user_id: user.id };
  if (!ip) return null;

  return { user_id: null, ip_address: ip };
}

type SubmitPriceContextSuggestionParams = {
  priceId: unknown;
  context: unknown;
  /** `null` for logged-out users (deduped and rate limited by `ip`). */
  user: User | null;
  ip?: string | null;
};

/**
 * Stores a context suggestion for a confirmed price entry. Throws when the text is the same as
 * the current context, when the author already has a pending suggestion for that price, or when
 * the IP (the user, if there's no IP) went over the daily limit.
 */
export async function submitPriceContextSuggestion({
  priceId,
  context,
  user,
  ip,
}: SubmitPriceContextSuggestionParams): Promise<{ success: true }> {
  if (user?.banned) throw new PriceContextSuggestionError('forbidden');

  const parsedPriceId = normalizePriceId(priceId);
  if (!parsedPriceId) throw new PriceContextSuggestionError('invalid-price');

  const note = normalizeContext(context);

  const price = await prisma.itemPrices.findUnique({
    where: { internal_id: parsedPriceId },
    select: {
      internal_id: true,
      item_iid: true,
      price: true,
      addedAt: true,
      priceContext: true,
      manual_check: true,
    },
  });

  // unconfirmed prices (pending manual check) aren't shown to users
  if (!price || !price.item_iid || price.manual_check !== null)
    throw new PriceContextSuggestionError('invalid-price');

  if (note === price.priceContext?.trim()) throw new PriceContextSuggestionError('same-as-current');

  const author = authorFilter(user, ip);
  const rateLimitFilter = ip ? { ip_address: ip } : user ? { user_id: user.id } : null;

  const [pendingFromAuthor, recentCount] = await Promise.all([
    author
      ? prisma.dataCollecting.count({
          where: {
            type: PRICE_CONTEXT_SUGGESTION_TYPE,
            subject_id: price.internal_id,
            processed: false,
            ...author,
          },
        })
      : 0,
    rateLimitFilter
      ? prisma.dataCollecting.count({
          where: {
            type: PRICE_CONTEXT_SUGGESTION_TYPE,
            addedAt: { gte: new Date(Date.now() - DAY) },
            ...rateLimitFilter,
          },
        })
      : 0,
  ]);

  if (pendingFromAuthor > 0) throw new PriceContextSuggestionError('already-suggested');
  if (recentCount >= MAX_PRICE_CONTEXT_SUGGESTIONS_PER_DAY)
    throw new PriceContextSuggestionError('too-many-requests');

  await prisma.dataCollecting.create({
    data: {
      type: PRICE_CONTEXT_SUGGESTION_TYPE,
      instance_id: chance.hash({ length: 15 }),
      item_iid: price.item_iid,
      subject_id: price.internal_id,
      note,
      user_id: user?.id ?? null,
      ip_address: ip ?? '-1',
    },
  });

  // fire-and-forget: a Discord failure must not fail the user's submission
  sendSuggestionWebhook({
    itemIid: price.item_iid,
    value: price.price.toNumber(),
    addedAt: price.addedAt,
    currentContext: price.priceContext,
    context: note,
    username: user?.username ?? null,
  }).catch(console.error);

  return { success: true };
}

// --- admin queue types (serialized to the dashboard client) ---

/** A single user suggestion for a price entry. */
export type PriceContextSuggestionRequest = {
  username: string | null;
  context: string;
  addedAt: string;
};

/** One price entry with every pending suggestion for it. */
export type PriceContextSuggestionGroup = {
  price: {
    price_id: number;
    value: number;
    addedAt: string;
    inflated: boolean;
    /** Current `ItemPrices.priceContext`. */
    context: string | null;
  };
  item_iid: number;
  item: ItemV2For<'minimal'> | null;
  /** Newest first. */
  requests: PriceContextSuggestionRequest[];
  /** addedAt of the most recent request. */
  lastAt: string;
};

/**
 * Every pending suggestion, grouped by price entry (most recent suggestion first). Suggestions for
 * deleted or unconfirmed prices are left out.
 */
export async function listPendingPriceContextSuggestions(): Promise<PriceContextSuggestionGroup[]> {
  const rows = await prisma.dataCollecting.findMany({
    where: { type: PRICE_CONTEXT_SUGGESTION_TYPE, processed: false, subject_id: { not: null } },
    select: {
      subject_id: true,
      note: true,
      addedAt: true,
      user: { select: { username: true } },
    },
    orderBy: { addedAt: 'desc' },
  });

  if (!rows.length) return [];

  const priceIds = [...new Set(rows.map((row) => row.subject_id as number))];

  const prices = await prisma.itemPrices.findMany({
    where: { internal_id: { in: priceIds }, manual_check: null, item_iid: { not: null } },
    select: {
      internal_id: true,
      item_iid: true,
      price: true,
      addedAt: true,
      noInflation_id: true,
      priceContext: true,
    },
  });

  if (!prices.length) return [];

  const itemIids = [...new Set(prices.map((price) => price.item_iid as number))];
  const items = await ItemService.getManyItems(
    { type: 'id', data: itemIids.map(String) },
    { intent: 'minimal', cached: false, limit: itemIids.length }
  );

  const priceMap = new Map(prices.map((price) => [price.internal_id, price]));

  // rows are sorted by addedAt desc, so insertion order keeps the most recent prices first
  const grouped = new Map<number, PriceContextSuggestionRequest[]>();

  for (const row of rows) {
    const priceId = row.subject_id as number;
    if (!priceMap.has(priceId) || !row.note) continue;

    if (!grouped.has(priceId)) grouped.set(priceId, []);
    grouped.get(priceId)!.push({
      username: row.user?.username ?? null,
      context: row.note,
      addedAt: row.addedAt.toJSON(),
    });
  }

  return [...grouped.entries()].map(([priceId, requests]) => {
    const price = priceMap.get(priceId)!;
    const itemIid = price.item_iid as number;

    return {
      price: {
        price_id: price.internal_id,
        value: price.price.toNumber(),
        addedAt: price.addedAt.toJSON(),
        inflated: !!price.noInflation_id,
        context: price.priceContext,
      },
      item_iid: itemIid,
      item: items[itemIid] ?? null,
      requests,
      lastAt: requests[0].addedAt,
    };
  });
}

export type ResolvePriceContextSuggestionsParams = {
  priceId: unknown;
  action: unknown;
  /** Text to write on approve (one of the suggestions, possibly edited by the admin). */
  context?: unknown;
  /** Already authorized by the caller; used for the action log. */
  admin: User;
};

/**
 * Approve writes `context` to the price entry; both actions mark every pending suggestion for
 * that price as processed, so several users' suggestions are resolved at once.
 */
export async function resolvePriceContextSuggestions({
  priceId,
  action,
  context,
  admin,
}: ResolvePriceContextSuggestionsParams): Promise<{ success: true; resolved: number }> {
  if (action !== 'approve' && action !== 'reject')
    throw new PriceContextSuggestionError('invalid-action');

  const parsedPriceId = normalizePriceId(priceId);
  if (!parsedPriceId) throw new PriceContextSuggestionError('invalid-price');

  const approvedContext = action === 'approve' ? normalizeContext(context) : null;

  const price = await prisma.itemPrices.findUnique({
    where: { internal_id: parsedPriceId },
    select: { internal_id: true, item_iid: true },
  });

  if (!price || !price.item_iid) throw new PriceContextSuggestionError('invalid-price');

  if (approvedContext) {
    await prisma.itemPrices.update({
      where: { internal_id: price.internal_id },
      data: { priceContext: approvedContext },
    });

    revalidateAppCacheTags([...itemSectionCacheTags(price.item_iid, 'np-prices')]);
  }

  const result = await prisma.dataCollecting.updateMany({
    where: {
      type: PRICE_CONTEXT_SUGGESTION_TYPE,
      subject_id: price.internal_id,
      processed: false,
    },
    data: {
      processed: true,
      approved: action === 'approve',
      processedAt: new Date(),
    },
  });

  await LogService.createLog(
    'priceContextSuggestion',
    { action, priceId: price.internal_id },
    String(price.item_iid),
    admin.id
  );

  return { success: true, resolved: result.count };
}

type SuggestionWebhookParams = {
  itemIid: number;
  value: number;
  addedAt: Date;
  currentContext: string | null;
  context: string;
  username: string | null;
};

/** Posts a Discord embed to FEEDBACK_WEBHOOK (no-op when it's not configured). */
async function sendSuggestionWebhook({
  itemIid,
  value,
  addedAt,
  currentContext,
  context,
  username,
}: SuggestionWebhookParams) {
  if (!process.env.FEEDBACK_WEBHOOK) return;
  const hook = new Webhook(process.env.FEEDBACK_WEBHOOK);

  const items = await ItemService.getManyItems(
    { type: 'id', data: [String(itemIid)] },
    { intent: 'minimal', cached: false, limit: 1 }
  );
  const item = items[itemIid];

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Price Context Suggestion' })
    .setTitle(item?.name ?? `#${itemIid}`)
    .setURL(`https://itemdb.com.br/item/${item?.slug ?? itemIid}`)
    .setDescription(
      currentContext
        ? 'Um usuário sugeriu uma correção de contexto de preço'
        : 'Um usuário sugeriu um contexto de preço'
    )
    .addField({
      name: 'Preço',
      value: `${value.toLocaleString('pt-BR')} NP · ${addedAt.toISOString().slice(0, 10)}`,
      inline: true,
    })
    .addField({
      name: 'Usuário',
      value: username ?? 'Deslogado',
      inline: true,
    })
    .addField({
      name: 'Sugestão',
      value: context.slice(0, 1024),
    });

  if (currentContext)
    embed.addField({
      name: 'Contexto atual',
      value: currentContext.slice(0, 1024),
    });

  embed.addField({
    name: 'Revisar',
    value: 'https://itemdb.com.br/admin/list-suggestions?tab=price-context',
  });

  if (item?.image.url) embed.setThumbnail({ url: item.image.url });

  hook.addEmbed(embed);
  await hook.send();
}
