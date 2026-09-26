/**
 * "Suggest missing item" for official lists.
 *
 * Users suggest items they think are missing from an official list; each suggested item is
 * stored as one `DataCollecting` row (`type = LIST_SUGGESTION_TYPE`, `subject_id = list id`).
 * Admins review them at `/admin/list-suggestions`: approving inserts the item into the list,
 * rejecting just marks the rows as processed.
 *
 * Flow:
 * - {@link submitListSuggestion}: user submission (server action on the list page)
 * - {@link listPendingSuggestions}: admin queue (admin page)
 * - {@link resolveSuggestions}: admin approve/reject (`POST /api/admin/list-suggestions`)
 *
 * This service owns all input validation; callers only handle auth/transport.
 */
import 'server-only';

import Chance from 'chance';
import { Webhook, EmbedBuilder } from '@tycrek/discord-hookr';
import prisma from '@utils/prisma';
import { revalidateListMutationCaches } from '@utils/revalidateAppCacheTags';
import { LogService } from '@services/ActionLogService';
import { ItemService } from '@services/ItemService';
import { ListService } from '@services/ListService';
import type { ItemV2For, User } from '@types';
import {
  LIST_SUGGESTION_TYPE,
  MAX_SUGGESTION_ITEMS,
  MAX_SUGGESTION_NOTE_LENGTH,
} from '@utils/list/listSuggestionsConstants';

/** Expected validation failures; returned to the client as-is so it can show a message. */
export type ListSuggestionErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'invalid-list'
  | 'invalid-items'
  | 'invalid-action'
  | 'too-many-items'
  | 'note-too-long'
  | 'already-in-list'
  | 'already-suggested';

/** Thrown for expected input/permission errors (maps to a 4xx / `success: false`). */
export class SuggestionInputError extends Error {
  code: ListSuggestionErrorCode;

  constructor(code: ListSuggestionErrorCode) {
    super(code);
    this.name = 'SuggestionInputError';
    this.code = code;
  }
}

const chance = new Chance();

/** Untrusted item id list (client/request body) → unique positive integers. */
function normalizeIids(itemIids: unknown): number[] {
  if (!Array.isArray(itemIids)) return [];

  return [...new Set(itemIids.map(Number))].filter((iid) => Number.isInteger(iid) && iid > 0);
}

type SubmitListSuggestionParams = {
  listId: number;
  itemIids: unknown;
  note?: string | null;
  user: User | null;
  ip?: string | null;
};

export type SubmitListSuggestionResult = {
  /** Stored as new suggestions. */
  created: number[];
  /** Skipped: already in the list (visible or hidden) or already pending from this user. */
  skipped: number[];
};

/**
 * Stores a user's "missing item" suggestion for an official, non-dynamic list.
 * One `DataCollecting` row per item, sharing an `instance_id` per submission.
 *
 * Items already in the list, or already pending from the same user, are skipped (so a user
 * can't inflate the request count). Throws when nothing is left to store.
 */
export async function submitListSuggestion({
  listId,
  itemIids,
  note,
  user,
  ip,
}: SubmitListSuggestionParams): Promise<SubmitListSuggestionResult> {
  // --- permission & input validation ---
  if (!user) throw new SuggestionInputError('unauthorized');
  if (user.banned || user.xp <= -300) throw new SuggestionInputError('forbidden');

  const uniqueIids = normalizeIids(itemIids);
  if (!uniqueIids.length) throw new SuggestionInputError('invalid-items');
  if (uniqueIids.length > MAX_SUGGESTION_ITEMS) throw new SuggestionInputError('too-many-items');

  const trimmedNote = note?.trim() || null;
  if (trimmedNote && trimmedNote.length > MAX_SUGGESTION_NOTE_LENGTH)
    throw new SuggestionInputError('note-too-long');

  const list = await prisma.userList.findUnique({
    where: { internal_id: listId },
    select: {
      internal_id: true,
      name: true,
      slug: true,
      cover_url: true,
      official: true,
      dynamicType: true,
    },
  });

  // dynamic lists are filled by their query, so manual suggestions make no sense there
  if (!list || !list.official || list.dynamicType) throw new SuggestionInputError('invalid-list');

  // drop ids that don't match a real item (DataCollecting.item_iid has a FK to Items)
  const items = await ItemService.getManyItems(
    { type: 'id', data: uniqueIids.map(String) },
    { intent: 'minimal', cached: false, limit: uniqueIids.length }
  );

  const validIids = uniqueIids.filter((iid) => !!items[iid]);
  if (!validIids.length) throw new SuggestionInputError('invalid-items');

  // --- dedupe against the list and against this user's pending suggestions ---
  const [inList, pendingFromUser] = await Promise.all([
    prisma.listItems.findMany({
      where: { list_id: list.internal_id, item_iid: { in: validIids } },
      select: { item_iid: true },
    }),
    prisma.dataCollecting.findMany({
      where: {
        type: LIST_SUGGESTION_TYPE,
        subject_id: list.internal_id,
        user_id: user.id,
        processed: false,
        item_iid: { in: validIids },
      },
      select: { item_iid: true },
    }),
  ]);

  const inListSet = new Set(inList.map((row) => row.item_iid));
  const pendingSet = new Set(pendingFromUser.map((row) => row.item_iid));

  const toCreate = validIids.filter((iid) => !inListSet.has(iid) && !pendingSet.has(iid));
  const skipped = validIids.filter((iid) => !toCreate.includes(iid));

  if (!toCreate.length) {
    throw new SuggestionInputError(inListSet.size ? 'already-in-list' : 'already-suggested');
  }

  // --- store: one row per item, grouped by instance_id (same as the data-collecting tool) ---
  const instanceId = chance.hash({ length: 15 });

  await prisma.dataCollecting.createMany({
    data: toCreate.map((iid) => ({
      type: LIST_SUGGESTION_TYPE,
      instance_id: instanceId,
      item_iid: iid,
      subject_id: list.internal_id,
      note: trimmedNote,
      user_id: user.id,
      ip_address: ip ?? '-1',
    })),
  });

  // fire-and-forget: a Discord failure must not fail the user's submission
  sendSuggestionWebhook({
    list,
    itemNames: toCreate.map((iid) => items[iid]?.name ?? `#${iid}`),
    note: trimmedNote,
    username: user.username,
  }).catch(console.error);

  return { created: toCreate, skipped };
}

// --- admin queue types (serialized to the dashboard client) ---

/** A single user request for an item. */
export type ListSuggestionRequest = {
  username: string | null;
  note: string | null;
  addedAt: string;
};

/** One suggested item on a list, with every pending request for it. */
export type ListSuggestionItem = {
  item_iid: number;
  item: ItemV2For<'minimal'> | null;
  /** Newest first. */
  requests: ListSuggestionRequest[];
  /** addedAt of the most recent request. */
  lastAt: string;
};

/** All pending suggested items for one official list. */
export type ListSuggestionGroup = {
  list: {
    internal_id: number;
    name: string;
    slug: string | null;
    cover_url: string | null;
    colorHex: string | null;
  };
  items: ListSuggestionItem[];
};

/**
 * Every pending suggestion, grouped by list, then by item (most recent first). Items that are
 * already in the list (e.g. added manually) are left out, so they drop off the queue without
 * being resolved.
 */
export async function listPendingSuggestions(): Promise<ListSuggestionGroup[]> {
  const rows = await prisma.dataCollecting.findMany({
    where: { type: LIST_SUGGESTION_TYPE, processed: false, subject_id: { not: null } },
    select: {
      item_iid: true,
      subject_id: true,
      note: true,
      addedAt: true,
      user: { select: { username: true } },
    },
    orderBy: { addedAt: 'desc' },
  });

  if (!rows.length) return [];

  // lists (only still-official ones) + which suggested items are already in their list
  const listIds = [...new Set(rows.map((row) => row.subject_id as number))];
  const itemIids = [...new Set(rows.map((row) => row.item_iid))];

  const [lists, inList, items] = await Promise.all([
    prisma.userList.findMany({
      where: { internal_id: { in: listIds }, official: true },
      select: { internal_id: true, name: true, slug: true, cover_url: true, colorHex: true },
    }),
    prisma.listItems.findMany({
      where: { list_id: { in: listIds }, item_iid: { in: itemIids } },
      select: { list_id: true, item_iid: true },
    }),
    ItemService.getManyItems(
      { type: 'id', data: itemIids.map(String) },
      { intent: 'minimal', cached: false, limit: itemIids.length }
    ),
  ]);

  const listMap = new Map(lists.map((list) => [list.internal_id, list]));
  const inListSet = new Set(inList.map((row) => `${row.list_id}_${row.item_iid}`));

  // rows are sorted by addedAt desc, so insertion order keeps the most recent lists/items first
  const grouped = new Map<number, Map<number, ListSuggestionRequest[]>>();

  for (const row of rows) {
    const listId = row.subject_id as number;
    if (!listMap.has(listId) || inListSet.has(`${listId}_${row.item_iid}`)) continue;

    if (!grouped.has(listId)) grouped.set(listId, new Map());
    const itemsMap = grouped.get(listId)!;

    if (!itemsMap.has(row.item_iid)) itemsMap.set(row.item_iid, []);
    itemsMap.get(row.item_iid)!.push({
      username: row.user?.username ?? null,
      note: row.note,
      addedAt: row.addedAt.toJSON(),
    });
  }

  return [...grouped.entries()].map(([listId, itemsMap]) => ({
    list: listMap.get(listId)!,
    items: [...itemsMap.entries()].map(([iid, requests]) => ({
      item_iid: iid,
      item: items[iid] ?? null,
      requests,
      lastAt: requests[0].addedAt,
    })),
  }));
}

export type ResolveSuggestionsParams = {
  listId: unknown;
  itemIids: unknown;
  action: unknown;
  /** Already authorized by the caller; used for the action log. */
  admin: User;
};

/**
 * Approve inserts the items into the list; both actions mark every pending request
 * for those items (on that list) as processed, so several users' requests are resolved at once.
 */
export async function resolveSuggestions({
  listId,
  itemIids,
  action,
  admin,
}: ResolveSuggestionsParams): Promise<{ success: true; resolved: number }> {
  if (action !== 'approve' && action !== 'reject') throw new SuggestionInputError('invalid-action');

  const uniqueIids = normalizeIids(itemIids);
  if (!uniqueIids.length) throw new SuggestionInputError('invalid-items');

  const parsedListId = Number(listId);
  if (!Number.isInteger(parsedListId)) throw new SuggestionInputError('invalid-list');

  const list = await prisma.userList.findUnique({
    where: { internal_id: parsedListId },
    select: { internal_id: true, official: true },
  });

  if (!list || !list.official) throw new SuggestionInputError('invalid-list');

  if (action === 'approve') {
    // same write path as the list PUT endpoint: refreshes visibleItemCount + v2 item-id cache
    await ListService.upsertItems(
      list.internal_id,
      uniqueIids.map((iid) => ({
        item_iid: String(iid),
        capValue: undefined,
        amount: undefined,
        imported: false,
      }))
    );

    revalidateListMutationCaches('official', list.internal_id);
  }

  const result = await prisma.dataCollecting.updateMany({
    where: {
      type: LIST_SUGGESTION_TYPE,
      subject_id: list.internal_id,
      item_iid: { in: uniqueIids },
      processed: false,
    },
    data: {
      processed: true,
      approved: action === 'approve',
      processedAt: new Date(),
    },
  });

  await LogService.createLog(
    'listSuggestion',
    { action, itemIids: uniqueIids },
    String(list.internal_id),
    admin.id
  );

  return { success: true, resolved: result.count };
}

type SuggestionWebhookParams = {
  list: { internal_id: number; name: string; slug: string | null; cover_url: string | null };
  itemNames: string[];
  note: string | null;
  username: string | null;
};

/** Posts a Discord embed to FEEDBACK_WEBHOOK (no-op when it's not configured). */
async function sendSuggestionWebhook({ list, itemNames, note, username }: SuggestionWebhookParams) {
  if (!process.env.FEEDBACK_WEBHOOK) return;
  const hook = new Webhook(process.env.FEEDBACK_WEBHOOK);

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Official List Suggestion' })
    .setTitle(list.name)
    .setURL(`https://itemdb.com.br/lists/official/${list.slug ?? list.internal_id}`)
    .setDescription('Um usuário sugeriu itens faltantes para uma lista oficial')
    .addField({
      name: 'Itens',
      value: itemNames.join('\n').slice(0, 1024),
    })
    .addField({
      name: 'Usuário',
      value: username ?? 'Unknown',
      inline: true,
    })
    .addField({
      name: 'Nota',
      value: note ? note.slice(0, 1024) : 'Nenhuma nota',
      inline: true,
    })
    .addField({
      name: 'Revisar',
      value: 'https://itemdb.com.br/admin/list-suggestions',
    });

  if (list.cover_url) embed.setThumbnail({ url: list.cover_url });

  hook.addEmbed(embed);
  await hook.send();
}
