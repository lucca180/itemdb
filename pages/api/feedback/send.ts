import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import requestIp from 'request-ip';
import sgMail from '@sendgrid/mail';
import { FEEDBACK_VOTE_TARGET } from './vote';
import { TradeData } from '../../../types';
import { processTradePrice } from '../v1/trades';

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
  let voteMultiplier = 0;

  if (user_id) {
    const user = await prisma.user.findUnique({
      where: {
        id: user_id,
      },
    });

    if (user) {
      if (user.role === 'ADMIN') voteMultiplier = FEEDBACK_VOTE_TARGET * 2;
      else
        voteMultiplier = Math.max(
          1,
          Math.min(Math.round(user.xp / 1000), Math.floor(FEEDBACK_VOTE_TARGET * 0.7))
        );
    }
  }

  if (type === 'tradePrice')
    shoudContinue = await processTradeFeedback(
      parsed.trade as TradeData,
      parseInt(subject_id),
      user_id,
      voteMultiplier >= Math.floor(FEEDBACK_VOTE_TARGET * 0.7)
    );

  if (!shoudContinue) return res.status(200).json({ success: true, message: 'already processed' });

  const result = await prisma.feedbacks.create({
    data: {
      email: email ?? '',
      subject_id: subject_id ? parseInt(subject_id) : undefined,
      json: JSON.stringify(obj),
      type: type ?? 'feedback',
      votes: voteMultiplier,
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

  if (type === 'feedback' || type === 'officialApply')
    await submitMailFeedback(obj, subject_id, email ?? '', result.feedback_id, type);

  return res.status(200).json({ success: true, message: result });
}

const processTradeFeedback = async (
  trade: TradeData,
  trade_id: number,
  user_id: string,
  trust: boolean
) => {
  const tradeFeedback = await prisma.feedbacks.findFirst({
    where: { type: 'tradePrice', subject_id: trade_id },
  });

  await prisma.trades.update({
    where: { trade_id: trade_id },
    data: {
      processed: true,
    },
  });

  if (tradeFeedback) {
    if (tradeFeedback.user_id === user_id) {
      await prisma.feedbacks.delete({
        where: { feedback_id: tradeFeedback.feedback_id },
      });

      return true;
    }

    return false;
  }

  if (!trust || trade.items.length === 1) return true;

  const isAllItemsTheSame = trade.items.every(
    (t) => t.name === trade.items[0].name && t.image_id === trade.items[0].image_id
  );

  const isAllSamePrice = trade.items.every((i) => i.price === trade.items[0].price && !!i.price);

  const isAllEmpty = trade.items.every((item) => !item.price);

  if ((isAllEmpty && !isAllItemsTheSame) || (isAllItemsTheSame && isAllSamePrice)) {
    await processTradePrice(trade);
    return false;
  }

  return true;
};

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

const submitMailFeedback = async (
  data: any,
  subject_id: string,
  email: string,
  id: number,
  type: string
) => {
  if (!SENDGRID_API_KEY) return console.error('Missing SENDGRID config');

  sgMail.setApiKey(SENDGRID_API_KEY);

  if (type === 'officialApply')
    subject_id = `https://itemdb.com.br/lists/${data.content.username}/${subject_id}`;

  await sgMail.send({
    from: 'itemdb <noreply@itemdb.com.br>',
    to: 'lucca@itemdb.com.br',
    subject: `[itemdb] ${type}`,
    html: `
      <b>feedback_id</b>: ${id}<br/>
      <b>sender email</b>: ${email}<br/>
      <b>subject_id</b>: ${subject_id}<br/>
      <b>ip</b>: ${data.ip}<br/>
      <b>pageRef</b>: ${data.pageRef}<br/>
      <b>data</b>: ${data.content.message ?? data.content.justification}<br/><br/>
      <b>rawData</b>: ${JSON.stringify(data)}
    `,
  });
};
