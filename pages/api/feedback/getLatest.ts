import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import { FeedbackParsed } from '../../../types';
import { CheckAuth } from '../../../utils/googleCloud';
import requestIp from 'request-ip';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const limit = (req.query.limit as string) ?? '15';

  const ip_address = requestIp.getClientIp(req);

  const includeProcessed = req.query.includeProcessed === 'true';
  let user_id;
  try {
    const { user } = await CheckAuth(req);
    if (!user) throw new Error('User not found');
    user_id = user.id;
  } catch (e) {
    console.error(e);
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const feedbackRaw = await prisma.feedbacks.findMany({
    where: {
      processed: includeProcessed,
      OR: [{ user_id: { not: user_id } }, { user_id: null }],
      type: {
        in: ['tradePrice', 'itemChange'],
      },
      vote: {
        none: {
          user_id: user_id,
        },
      },
    },
    orderBy: { addedAt: 'asc' },
    take: parseInt(limit),
  });

  const feedbacks = [];
  for (const feedback of feedbackRaw) {
    const json = feedback.json as string;
    const parsed = JSON.parse(json) as FeedbackParsed;

    if (ip_address === parsed.ip) continue;
    feedbacks.push(feedback);
  }

  res.json(feedbackRaw);
}
