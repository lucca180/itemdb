import { NextApiRequest, NextApiResponse } from 'next';
import { ListService } from '@services/ListService';
import {
  afterContextMutation,
  loadEditableList,
  sendContextError,
} from '@pages/api/v1/lists/[username]/[list_id]/contexts';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PATCH') return PATCH(req, res);
  if (req.method === 'DELETE') return DELETE(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'PATCH, DELETE');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const parseContextId = (req: NextApiRequest) => {
  const id = Number(req.query.context_id);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// update a context; `itemIids` replaces its items
const PATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const contextId = parseContextId(req);
  if (!contextId) return res.status(400).json({ error: 'Bad Request' });

  const auth = await loadEditableList(req, res);
  if (!auth) return;

  const { list, user } = auth;

  try {
    const result = await ListService.updateListContext(list.internal_id, contextId, req.body);
    await afterContextMutation(list, user, 'updateContext', result);

    return res.status(200).json(result.context);
  } catch (e) {
    return sendContextError(res, e);
  }
};

const DELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const contextId = parseContextId(req);
  if (!contextId) return res.status(400).json({ error: 'Bad Request' });

  const auth = await loadEditableList(req, res);
  if (!auth) return;

  const { list, user } = auth;

  try {
    const result = await ListService.deleteListContext(list.internal_id, contextId);
    await afterContextMutation(list, user, 'deleteContext', result);

    return res.status(200).json({ success: true });
  } catch (e) {
    return sendContextError(res, e);
  }
};
