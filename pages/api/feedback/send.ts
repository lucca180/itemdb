import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import requestIp from 'request-ip';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, json, user_id, type, subject_id } = req.body;
  let { pageInfo } = req.body;

  if (!json || !type) return res.status(400).send('Missing required fields');

  if (type === 'tradePrice') {
    if (!subject_id || isNaN(parseInt(subject_id)) || !user_id)
      return res.status(400).send('Missing required fields');
  }

  const parsed = JSON.parse(json ?? '{}');

  if (!pageInfo) pageInfo = req.headers.referer;
  if (!pageInfo) return res.status(400).send('Missing required fields');

  const ip = requestIp.getClientIp(req);
  const obj = {
    ip: ip,
    pageRef: pageInfo,
    content: parsed,
  };

  let shoudContinue = true;

  if (type === 'tradePrice') shoudContinue = await processTradePrice(parseInt(subject_id));

  if (!shoudContinue) return res.status(400).json({ success: false, message: 'already processed' });

  const result = await prisma.feedbacks.create({
    data: {
      email: email ?? '',
      subject_id: subject_id ? parseInt(subject_id) : undefined,
      json: JSON.stringify(obj),
      type: type ?? 'feedback',
      user: user_id
        ? {
            connect: {
              id: user_id,
            },
          }
        : undefined,
    },
    include: {
      user: true,
    },
  });

  return res.status(200).json({ success: true, message: result });
}

const processTradePrice = async (trade_id?: number) => {
  const tradeFeedback = await prisma.feedbacks.findFirst({
    where: { type: 'tradePrice', subject_id: trade_id },
  });

  if (tradeFeedback) return false;

  await prisma.trades.update({
    where: { trade_id: trade_id },
    data: {
      processed: true,
    },
  });

  return true;
};
