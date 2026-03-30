import { NextApiRequest, NextApiResponse } from 'next';
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
  const album_id = req.query.album_id as string;

  if (!album_id) {
    res.redirect(301, '/lists/official');
    return;
  }

  const album = await prisma.userList.findFirst({
    where: {
      official: true,
      official_tag: 'stamps',
      description: {
        contains: `&page_id=${album_id}`,
      },
    },
  });

  if (!album) {
    res.redirect(404, '/404');
    return;
  }

  if (!album) {
    res.redirect(301, '/lists/official');
    return;
  }

  res.redirect(301, `/lists/official/${album.slug}`);
};
