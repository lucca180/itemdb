import { NextApiRequest, NextApiResponse } from 'next';
import type { User } from '@types';
import prisma from '@utils/prisma';
import { CheckAuth } from '@utils/googleCloud';
import { canEditListInfo } from '@utils/list/listPermissions';
import { itemSectionTag } from '@utils/appCacheTags';
import { triggerAppRevalidation } from '@utils/triggerAppRevalidation';
import {
  ListContextError,
  ListService,
  type ListContextMutationResult,
} from '@services/ListService';
import { logOfficialListAction, type OfficialListAction } from '@services/OfficialListLogService';
import type { ListContextSaveResponse } from '@utils/list/listContexts';
import { revalidateListCaches } from '@pages/api/v1/lists/[username]/[list_id]';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);
  if (req.method === 'PATCH') return PATCH(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// contexts of a list
const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username, list_id: list_id_or_slug } = req.query;

  if (!username || !list_id_or_slug || Array.isArray(username) || Array.isArray(list_id_or_slug))
    return res.status(400).json({ error: 'Bad Request' });

  try {
    const listService = await ListService.initReq(req);

    const list = await listService.getList({
      username,
      list_id_or_slug,
      isOfficial: username === 'official',
      skipSync: true,
    });

    if (!list) return res.status(404).json({ error: 'List not found' });

    const contexts = await listService.getListContextsFor(list);

    // owners/admins also get hidden items, so their response must not be shared
    res.setHeader(
      'Cache-Control',
      listService.user
        ? 'private, no-store'
        : list.official
          ? 'max-age=0, s-maxage=600, stale-while-revalidate=1500'
          : 'max-age=0, s-maxage=180, stale-while-revalidate=300'
    );

    return res.status(200).json(contexts);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// create a context
const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const auth = await loadEditableList(req, res);
  if (!auth) return;

  const { list, user } = auth;

  try {
    const result = await ListService.createListContext(list.internal_id, req.body);
    await afterContextMutation(list, user, 'createContext', result);

    return res.status(200).json(toSaveResponse(result));
  } catch (e: any) {
    return sendContextError(res, e);
  }
};

// reorder: `contextIds` holds every context of the list, in the new order
const PATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const auth = await loadEditableList(req, res);
  if (!auth) return;

  const { list, user } = auth;

  try {
    const result = await ListService.reorderListContexts(list.internal_id, req.body?.contextIds);

    await afterContextChange(
      list,
      user,
      'reorderContexts',
      { context_ids: result.contexts.map((context) => context.internal_id) },
      result.affectedItemIids
    );

    return res.status(200).json(result.contexts);
  } catch (e: any) {
    return sendContextError(res, e);
  }
};

type EditableList = { internal_id: number; official: boolean; user_id: string };

/**
 * Loads the list from `list_id` (numeric) and checks the viewer can edit it. Contexts are list
 * content, like the highlight: only admins change them on official lists. Sends the error
 * response and returns `null` when not allowed.
 */
export async function loadEditableList(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ list: EditableList; user: User } | null> {
  const { list_id } = req.query;
  const listId = Number(list_id);

  if (!list_id || Array.isArray(list_id) || !Number.isInteger(listId) || listId <= 0) {
    res.status(400).json({ error: 'Bad Request' });
    return null;
  }

  try {
    const { user } = await CheckAuth(req);
    if (!user || user.banned) {
      res.status(401).json({ error: 'Unauthorized' });
      return null;
    }

    const list = await prisma.userList.findUnique({
      where: { internal_id: listId },
      select: { internal_id: true, official: true, user_id: true },
    });

    if (!list) {
      res.status(404).json({ error: 'List not found' });
      return null;
    }

    if (!canEditListInfo({ official: list.official, ownerId: list.user_id }, user)) {
      res.status(403).json({ error: 'Forbidden' });
      return null;
    }

    return { list, user };
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
    return null;
  }
}

export async function afterContextMutation(
  list: EditableList,
  user: User,
  action: OfficialListAction,
  result: ListContextMutationResult
) {
  await afterContextChange(
    list,
    user,
    action,
    {
      context_id: result.context.internal_id,
      badgeText: result.context.badgeText,
      item_iids: result.context.itemIids,
      ...(result.seriesDates ? { seriesDates: result.seriesDates.change } : {}),
    },
    result.affectedItemIids,
    result.seriesDates?.changedItemIids
  );
}

/** The saved context, plus the list items whose series dates changed with it. */
export const toSaveResponse = (result: ListContextMutationResult): ListContextSaveResponse => ({
  ...result.context,
  itemDates: result.seriesDates?.itemDates ?? [],
});

/** Logs the change (official lists) and revalidates the list and the affected item pages. */
async function afterContextChange(
  list: EditableList,
  user: User,
  action: OfficialListAction,
  logData: Record<string, unknown>,
  affectedItemIids: number[],
  redatedItemIids: number[] = []
) {
  await logOfficialListAction(list, action, logData, user);

  await revalidateListCaches(list.internal_id);

  // item page official list cards show the contexts of that item ('lists' also covers the price
  // chart markers); series dates show in NC Insights too
  if (list.official && affectedItemIids.length) {
    await triggerAppRevalidation({
      tags: [
        ...affectedItemIids.map((iid) => itemSectionTag(iid, 'lists')),
        ...redatedItemIids.map((iid) => itemSectionTag(iid, 'nc-insights')),
      ],
    });
  }
}

export function sendContextError(res: NextApiResponse, e: unknown) {
  if (e instanceof ListContextError) return res.status(e.status).json({ error: e.message });

  console.error(e);
  return res.status(500).json({ error: 'Internal Server Error' });
}
