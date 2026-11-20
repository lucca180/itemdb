/**
 * INTERNAL MODULE — do not import this file directly. Go through `@services/ListService`
 * (enforced by `test/listItemsWrite.guard.test.ts`).
 */
/**
 * List contexts: shared notes (badge, markdown title/details, color) linked to some items of a
 * list. Many-to-many with `ListItems` through `ListContextItem`, like ManualPriceMarker/Item.
 * The API speaks item ids (`Items.internal_id`); rows link the list item row, so an item that
 * leaves the list also leaves its contexts (cascade).
 */
import type { ListContext } from '@types';
import prisma from '@utils/prisma';
import { Prisma } from '@prisma/generated/client';
import {
  LIST_CONTEXT_COLOR_PATTERN,
  LIST_CONTEXT_MODES,
  MAX_LIST_CONTEXTS,
  MAX_LIST_CONTEXT_BADGE_LENGTH,
  MAX_LIST_CONTEXT_TITLE_LENGTH,
  type ListContextCreateRequest,
  type ListContextFields,
  type ListContextMode,
  type ListContextUpdateRequest,
} from '@utils/list/listContexts';

export class ListContextError extends Error {
  constructor(
    message: string,
    public status: 400 | 404 = 400
  ) {
    super(message);
  }
}

const contextInclude = {
  items: { select: { listItem: { select: { item_iid: true, isHidden: true } } } },
} satisfies Prisma.ListContextInclude;

type ContextRow = Prisma.ListContextGetPayload<{ include: typeof contextInclude }>;

function serializeContext(row: ContextRow, includeHidden: boolean): ListContext {
  return {
    internal_id: row.internal_id,
    list_id: row.list_id,
    badgeText: row.badgeText,
    title: row.title,
    description: row.description,
    color: row.color,
    order: row.order,
    mode: row.mode,
    createdAt: row.createdAt.toJSON(),
    updatedAt: row.updatedAt.toJSON(),
    itemIids: row.items
      .filter((link) => includeHidden || !link.listItem.isHidden)
      .map((link) => link.listItem.item_iid)
      .sort((a, b) => a - b),
  };
}

/** The list's own order; ties (rows from before `order` existed) fall back to creation order. */
const contextOrderBy = [
  { order: 'asc' },
  { internal_id: 'asc' },
] satisfies Prisma.ListContextOrderByWithRelationInput[];

/** Every context of a list, in the list's order (the first one is what item cards show). */
export async function getListContexts(
  listId: number,
  includeHidden = false
): Promise<ListContext[]> {
  const rows = await prisma.listContext.findMany({
    where: { list_id: listId },
    include: contextInclude,
    orderBy: contextOrderBy,
  });

  return rows.map((row) => serializeContext(row, includeHidden));
}

/**
 * Contexts that include one item, per list (item page official list cards). Hidden list items
 * are never shown there, so their links are left out.
 */
export async function getItemListContexts(
  itemIid: number,
  listIds: number[]
): Promise<Record<number, ListContext[]>> {
  if (!listIds.length) return {};

  const rows = await prisma.listContext.findMany({
    where: {
      list_id: { in: listIds },
      items: { some: { listItem: { item_iid: itemIid, isHidden: false } } },
    },
    include: contextInclude,
    orderBy: contextOrderBy,
  });

  const byList: Record<number, ListContext[]> = {};
  for (const row of rows) {
    (byList[row.list_id] ??= []).push(serializeContext(row, false));
  }

  return byList;
}

export type ListContextMutationResult = {
  context: ListContext;
  /** Items whose contexts changed (before and after), for cache revalidation. */
  affectedItemIids: number[];
};

export async function createListContext(
  listId: number,
  body: ListContextCreateRequest
): Promise<ListContextMutationResult> {
  const fields = normalizeFields(body, false);
  const links = await resolveListItems(listId, fields.itemIids ?? []);

  const count = await prisma.listContext.count({ where: { list_id: listId } });
  if (count >= MAX_LIST_CONTEXTS) {
    throw new ListContextError(`A list can have at most ${MAX_LIST_CONTEXTS} contexts`);
  }

  const created = await prisma.$transaction(async (tx) => {
    // new contexts go last
    const last = await tx.listContext.aggregate({
      where: { list_id: listId },
      _max: { order: true },
    });

    const context = await tx.listContext.create({
      data: {
        list_id: listId,
        order: (last._max.order ?? -1) + 1,
        badgeText: fields.badgeText!,
        title: fields.title ?? null,
        description: fields.description ?? null,
        color: fields.color!,
        mode: fields.mode!,
      },
    });

    if (links.length) {
      await tx.listContextItem.createMany({
        data: links.map((link) => ({
          context_id: context.internal_id,
          listItem_id: link.internal_id,
        })),
        skipDuplicates: true,
      });
    }

    return tx.listContext.findUniqueOrThrow({
      where: { internal_id: context.internal_id },
      include: contextInclude,
    });
  });

  return {
    context: serializeContext(created, true),
    affectedItemIids: links.map((link) => link.item_iid),
  };
}

export async function updateListContext(
  listId: number,
  contextId: number,
  body: ListContextUpdateRequest
): Promise<ListContextMutationResult> {
  const existing = await findListContext(listId, contextId);
  const fields = normalizeFields(body, true);
  const nextLinks =
    fields.itemIids !== undefined ? await resolveListItems(listId, fields.itemIids) : null;

  const prevItemIids = existing.items.map((link) => link.listItem.item_iid);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.listContext.update({
      where: { internal_id: contextId },
      data: {
        ...(fields.badgeText !== undefined ? { badgeText: fields.badgeText } : {}),
        ...(fields.title !== undefined ? { title: fields.title } : {}),
        ...(fields.description !== undefined ? { description: fields.description } : {}),
        ...(fields.color !== undefined ? { color: fields.color } : {}),
        ...(fields.mode !== undefined ? { mode: fields.mode } : {}),
      },
    });

    if (nextLinks) {
      const nextIds = nextLinks.map((link) => link.internal_id);

      await tx.listContextItem.deleteMany({
        where: { context_id: contextId, listItem_id: { notIn: nextIds } },
      });

      if (nextIds.length) {
        await tx.listContextItem.createMany({
          data: nextIds.map((listItem_id) => ({ context_id: contextId, listItem_id })),
          skipDuplicates: true,
        });
      }
    }

    return tx.listContext.findUniqueOrThrow({
      where: { internal_id: contextId },
      include: contextInclude,
    });
  });

  const nextItemIids = nextLinks?.map((link) => link.item_iid) ?? prevItemIids;

  return {
    context: serializeContext(updated, true),
    affectedItemIids: [...new Set([...prevItemIids, ...nextItemIids])],
  };
}

export async function deleteListContext(
  listId: number,
  contextId: number
): Promise<ListContextMutationResult> {
  const existing = await findListContext(listId, contextId);

  // cascade removes the ListContextItem rows
  await prisma.listContext.delete({ where: { internal_id: contextId } });

  const context = serializeContext(existing, true);
  return { context, affectedItemIids: context.itemIids };
}

export type ListContextReorderResult = {
  contexts: ListContext[];
  /** Items in any context: the first context of an item (corner, footer) may have changed. */
  affectedItemIids: number[];
};

/**
 * Sets the order of a list's contexts. `contextIds` must hold every context of the list exactly
 * once, so a stale editor can't silently drop or duplicate positions.
 */
export async function reorderListContexts(
  listId: number,
  contextIds: unknown
): Promise<ListContextReorderResult> {
  if (!Array.isArray(contextIds)) throw new ListContextError('Invalid contextIds');

  const ids = contextIds.map((raw) => Number(raw));
  if (ids.some((id) => !Number.isInteger(id) || id <= 0) || new Set(ids).size !== ids.length) {
    throw new ListContextError('Invalid contextIds');
  }

  const existing = await prisma.listContext.findMany({
    where: { list_id: listId },
    select: { internal_id: true },
  });

  const existingIds = new Set(existing.map((row) => row.internal_id));
  if (ids.length !== existingIds.size || ids.some((id) => !existingIds.has(id))) {
    throw new ListContextError('contextIds must list every context of this list once');
  }

  await prisma.$transaction(
    ids.map((id, order) =>
      prisma.listContext.update({ where: { internal_id: id }, data: { order } })
    )
  );

  const contexts = await getListContexts(listId, true);

  return {
    contexts,
    affectedItemIids: [...new Set(contexts.flatMap((context) => context.itemIids))],
  };
}

async function findListContext(listId: number, contextId: number): Promise<ContextRow> {
  const row = await prisma.listContext.findUnique({
    where: { internal_id: contextId },
    include: contextInclude,
  });

  if (!row || row.list_id !== listId) throw new ListContextError('Context not found', 404);
  return row;
}

/** List item rows for `itemIids`; every item must already be in the list. */
async function resolveListItems(listId: number, itemIids: number[]) {
  if (!itemIids.length) return [];

  const rows = await prisma.listItems.findMany({
    where: { list_id: listId, item_iid: { in: itemIids } },
    select: { internal_id: true, item_iid: true },
  });

  if (rows.length !== itemIids.length) {
    const found = new Set(rows.map((row) => row.item_iid));
    const missing = itemIids.filter((iid) => !found.has(iid));
    throw new ListContextError(`Items not in this list: ${missing.join(', ')}`);
  }

  return rows;
}

function normalizeFields(
  body: ListContextCreateRequest | ListContextUpdateRequest,
  partial: boolean
): Partial<ListContextFields> {
  if (!body || typeof body !== 'object') throw new ListContextError('Invalid body');

  const fields: Partial<ListContextFields> = {};

  if (body.badgeText !== undefined || !partial) {
    fields.badgeText = normalizeBadgeText(body.badgeText);
  }

  if (body.title !== undefined || !partial) {
    fields.title = normalizeNullableText(body.title, 'title', MAX_LIST_CONTEXT_TITLE_LENGTH);
  }

  if (body.description !== undefined || !partial) {
    fields.description = normalizeNullableText(body.description, 'description');
  }

  if (body.color !== undefined || !partial) {
    fields.color = normalizeColor(body.color);
  }

  if (body.mode !== undefined || !partial) {
    fields.mode = normalizeMode(body.mode);
  }

  if (body.itemIids !== undefined) {
    fields.itemIids = normalizeItemIids(body.itemIids);
  }

  return fields;
}

function normalizeBadgeText(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ListContextError('badgeText is required');
  }

  const trimmed = value.trim();
  if (trimmed.length > MAX_LIST_CONTEXT_BADGE_LENGTH) {
    throw new ListContextError(`badgeText exceeds ${MAX_LIST_CONTEXT_BADGE_LENGTH} characters`);
  }

  return trimmed;
}

function normalizeNullableText(value: unknown, field: string, maxLength?: number): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new ListContextError(`Invalid ${field}`);

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (maxLength !== undefined && trimmed.length > maxLength) {
    throw new ListContextError(`${field} exceeds ${maxLength} characters`);
  }

  return trimmed;
}

function normalizeColor(value: unknown): string {
  if (typeof value !== 'string' || !LIST_CONTEXT_COLOR_PATTERN.test(value.trim())) {
    throw new ListContextError('Invalid color (expected hex like #aabbcc)');
  }

  return value.trim();
}

/** Missing (or null) means `both`, like the column default. */
function normalizeMode(value: unknown): ListContextMode {
  if (value === undefined || value === null) return 'both';
  if (typeof value !== 'string' || !LIST_CONTEXT_MODES.includes(value as ListContextMode)) {
    throw new ListContextError(`Invalid mode (expected ${LIST_CONTEXT_MODES.join(', ')})`);
  }

  return value as ListContextMode;
}

function normalizeItemIids(value: unknown): number[] {
  if (!Array.isArray(value)) throw new ListContextError('Invalid itemIids');

  const ids = value.map((raw) => Number(raw));
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new ListContextError('Invalid itemIids');
  }

  return [...new Set(ids)];
}
