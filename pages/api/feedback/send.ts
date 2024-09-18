import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import requestIp from 'request-ip';
import sgMail from '@sendgrid/mail';
import { FEEDBACK_VOTE_TARGET, MAX_VOTE_MULTIPLIER } from './vote';
import { TradeData } from '../../../types';
import { processTradePrice } from '../v1/trades';

const SKIP_AUTO_TRADE_FEEDBACK = process.env.SKIP_AUTO_TRADE_FEEDBACK == 'true';

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
  const obj: any = {
    ip: ip,
    pageRef: pageInfo,
    content: parsed,
    autoPriceList: [],
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
      else voteMultiplier = Math.max(1, Math.min(Math.floor(user.xp / 1000), MAX_VOTE_MULTIPLIER));
    }
  }

  if (type === 'tradePrice') {
    shoudContinue = await processTradeFeedback(
      parsed.trade as TradeData,
      parseInt(subject_id),
      user_id,
      voteMultiplier >= MAX_VOTE_MULTIPLIER
    );
    const autopriced = await processSimilarTrades(
      parsed.trade as TradeData,
      parseInt(subject_id),
      user_id
    );
    obj.autoPriceList = autopriced;
  }

  if (type === 'feedback') {
    const count = await prisma.feedbacks.count({
      where: {
        type: {
          in: ['feedback', 'officialApply'],
        },
        ip_address: ip ?? '1',
        addedAt: {
          gte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24),
        },
      },
    });

    if (count > 5) return res.status(429).json({ success: false, message: 'Too many requests' });
  }

  if (!shoudContinue) return res.status(200).json({ success: true, message: 'already processed' });

  const result = await prisma.feedbacks.create({
    data: {
      email: email ?? '',
      subject_id: subject_id ? parseInt(subject_id) : undefined,
      json: JSON.stringify(obj),
      type: type ?? 'feedback',
      votes: voteMultiplier,
      ip_address: ip ?? '1',
      user_id: user_id ?? undefined,
    },
    include: {
      user: true,
    },
  });

  if (type === 'feedback' || type === 'officialApply' || type === 'reportFeedback') {
    await submitMailFeedback(obj, subject_id, email ?? '', result.feedback_id, type);
  }

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
      const parsed = JSON.parse(tradeFeedback.json?.toString() ?? '{}');
      const feedbackList = parsed.autoPriceList ?? [];
      await prisma.feedbacks.deleteMany({
        where: {
          OR: [
            { feedback_id: tradeFeedback.feedback_id },
            { subject_id: { in: feedbackList }, processed: false },
          ],
        },
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

export const processSimilarTrades = async (trade: TradeData, trade_id: number, user_id: string) => {
  const currentTrade = {
    isAllItemsTheSame: trade.items.every(
      (t) => t.name === trade.items[0].name && t.image_id === trade.items[0].image_id
    ),
    isAllSamePrice: trade.items.every((i) => i.price === trade.items[0].price && !!i.price),
    isAllEmpty: trade.items.every((item) => !item.price),
  };

  if (currentTrade.isAllEmpty || SKIP_AUTO_TRADE_FEEDBACK) return [];

  const similarTrades = await prisma.trades.findMany({
    where: {
      wishlist: trade.wishlist,
      trade_id: {
        not: trade_id,
      },
      processed: false,
      priced: false,
    },
    include: {
      items: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });
  console.log('similarTrades', similarTrades.length);

  if (!similarTrades.length) return [];

  const feedbackCreate: any = [];
  const updatedTrades: number[] = [];

  for (const t of similarTrades) {
    if (t.items.length !== trade.items.length) continue;

    const similarTradeData: TradeData = {
      trade_id: t.trade_id,
      owner: t.owner,
      wishlist: t.wishlist,
      addedAt: t.addedAt.toJSON(),
      processed: t.processed,
      priced: t.priced,
      hash: t.hash,
      items: t.items.map((i) => {
        return {
          internal_id: i.internal_id,
          trade_id: i.trade_id,
          name: i.name,
          image: i.image,
          image_id: i.image_id,
          price: i.price?.toNumber() || null,
          order: i.order,
          addedAt: i.addedAt.toJSON(),
        };
      }),
    };

    trade.items.forEach((item) => {
      if (!similarTradeData.items[item.order]) return;

      similarTradeData.items[item.order].price = item.price;
    });

    const obj = {
      ip: 'auto',
      pageRef: 'auto-pricing',
      refTrade: trade_id,
      content: similarTradeData,
    };

    processTradeFeedback(similarTradeData, similarTradeData.trade_id, user_id, false).then((x) => {
      if (!x) return;

      const createFeedback = prisma.feedbacks.create({
        data: {
          subject_id: similarTradeData.trade_id,
          json: JSON.stringify(obj),
          type: 'tradePrice',
          votes: 0,
          ip_address: 'auto',
          user_id: 'UmY3BzWRSrhZDIlxzFUVxgRXjfi1',
        },
      });

      feedbackCreate.push(createFeedback);
      updatedTrades.push(similarTradeData.trade_id);
    });
  }

  await Promise.all(feedbackCreate);

  return updatedTrades;
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
      <b>pageRef</b>: ${data.pageRef}<br/><br/>
      <b>data</b>: ${data.content.message ?? data.content.justification}<br/><br/>
      <b>rawData</b>: ${JSON.stringify(data)}
    `,
  });
};
