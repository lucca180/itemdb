import { format } from 'date-fns';
import { NextApiRequest, NextApiResponse } from 'next';
import { getUser } from '.';
import prisma from '../../../../../utils/prisma';
import { User } from '../../../../../types';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  // if (req.method === 'POST') return POST(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username } = req.query;

  if (!username || typeof username !== 'string')
    return res.status(400).json({ error: 'Invalid Request' });

  let user;

  try {
    user = await getUser(username);
    if (!user) return res.status(400).json({ error: 'User not found' });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  const achievements = await getUserAchievements(user);

  return res.status(200).json(achievements);
};

export const getUserAchievements = async (user_or_id: User | string) => {
  const achievements = [];

  const user = typeof user_or_id !== 'string' ? user_or_id : await getUser(user_or_id);
  if (!user) return null;

  // itemdb admin
  if (user.isAdmin) {
    achievements.push({
      name: 'itemdb admin',
      image: 'https://itemdb.com.br/favicon.svg',
    });
  }

  // itemdb early adopter
  if (new Date(user.createdAt) < new Date('2024-01-01T00:00:00.000Z')) {
    achievements.push({
      // format user.createdAt to dd-mm-yyyy
      name: `itemdb early adopter (${format(new Date(user.createdAt), 'MM/yyyy')})`,
      image: 'https://images.neopets.com/themes/h5/basic/images/bookmark-icon.svg',
    });
  }

  // official list
  const officialListRaw = prisma.userList.count({
    where: {
      user_id: user.id,
      official: true,
    },
  });

  // priced a trade
  const pricedTradeRaw = prisma.feedbacks.count({
    where: {
      user_id: user.id,
      type: 'tradePrice',
      approved: true,
    },
  });

  // priced a trade
  const votedTradeRaw = prisma.feedbackVotes.count({
    where: {
      user_id: user.id,
      // type: 'tradePrice',
      // approved: true,
    },
  });

  // reported a NC trade
  const reportedNCTradeRaw = prisma.ncTrade.count({
    where: {
      reporter_id: user.id,
    },
  });

  // restock sessions
  const restockSessionsRaw = prisma.restockSession.count({
    where: {
      user_id: user.id,
    },
  });

  const [officialList, pricedTrade, reportedNCTrade, restockSessions, votedTrade] =
    await Promise.all([
      officialListRaw,
      pricedTradeRaw,
      reportedNCTradeRaw,
      restockSessionsRaw,
      votedTradeRaw,
    ]);

  if (officialList) {
    achievements.push({
      name: `Has ${intl.format(officialList)} official lists`,
      image: 'https://images.neopets.com/themes/h5/basic/images/guilds-icon.png',
    });
  }

  if (pricedTrade) {
    achievements.push({
      name: `Priced ${intl.format(pricedTrade)} trades correcly`,
      image: 'https://images.neopets.com/themes/h5/basic/images/alert/tradeaccepted-icon.svg',
    });
  }

  if (votedTrade) {
    achievements.push({
      name: `Voted on ${intl.format(votedTrade)} trade price suggestions`,
      image: 'https://images.neopets.com/themes/h5/basic/images/alert/tradeoffer-icon.svg',
    });
  }

  if (reportedNCTrade) {
    achievements.push({
      name: `Reported ${intl.format(reportedNCTrade)} NC Trades`,
      image: 'https://images.neopets.com/themes/h5/basic/images/alert/gift-icon.svg',
    });
  }

  if (restockSessions) {
    achievements.push({
      name: `Imported ${intl.format(restockSessions)} restock sessions`,
      image: 'https://images.neopets.com/themes/h5/basic/images/shop-icon.svg',
    });
  }

  return achievements;
};

const intl = new Intl.NumberFormat();
