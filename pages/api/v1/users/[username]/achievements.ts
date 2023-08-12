import { format } from 'date-fns';
import { NextApiRequest, NextApiResponse } from 'next';
import { getUser } from '.';
import prisma from '../../../../../utils/prisma';

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

  const achievements = [];

  // itemdb admin
  if (user.isAdmin) {
    achievements.push({
      name: 'itemDB admin',
      image: 'https://itemdb.com.br/favicon.svg',
    });
  }

  if (['Ty0G4IOIm4dr3IYJpMx8bIFMs433'].includes(user.id)) {
    achievements.push({
      name: 'itemDB developer',
      image:
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 640 512"%3E%3Cstyle%3Esvg%7Bfill:%2338a169%7D%3C/style%3E%3Cpath d="M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z"/%3E%3C/svg%3E',
    });
  }

  // itemdb early adopter
  if (new Date(user.createdAt) < new Date('2023-10-01T00:00:00.000Z')) {
    achievements.push({
      // format user.createdAt to dd-mm-yyyy
      name: `itemDB early adopter (${format(new Date(user.createdAt), 'MM/yyyy')})`,
      image: 'https://images.neopets.com/themes/h5/basic/images/bookmark-icon.svg',
    });
  }

  // official list
  const officialList = await prisma.userList.findFirst({
    where: {
      user_id: user.id,
      official: true,
    },
  });

  if (officialList) {
    achievements.push({
      name: 'Has an official list',
      image:
        'data:image/svg+xml,%0A%3Csvg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="%231d9bf0"%3E%3C/path%3E%3C/svg%3E%0A',
    });
  }

  // priced a trade
  const pricedTrade = await prisma.feedbacks.findMany({
    where: {
      user_id: user.id,
      type: 'tradePrice',
      approved: true,
    },
  });

  if (pricedTrade.length > 0) {
    achievements.push({
      name: `Priced ${pricedTrade.length} trades correcly`,
      image: 'https://images.neopets.com/themes/h5/basic/images/alert/tradeaccepted-icon.svg',
    });
  }

  return res.status(200).json(achievements);
};
