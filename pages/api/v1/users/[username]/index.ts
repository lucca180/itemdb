import { startOfDay } from 'date-fns';
import type { NextApiRequest, NextApiResponse } from 'next';
import { User, UserRoles } from '../../../../../types';
import { CheckAuth } from '../../../../../utils/googleCloud';
import prisma from '../../../../../utils/prisma';
import { getImagePalette } from '../../lists/[username]';

const VALID_LANGS = ['en', 'pt'];

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username } = req.query;

  if (!username || typeof username !== 'string')
    return res.status(400).json({ error: 'Invalid Request' });

  try {
    const user = await getUser(username);

    return res.status(200).json(user);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  let { neopetsUser, username, profileColor, profileImage, description, prefLang } = req.body;

  if (!prefLang || !VALID_LANGS.includes(prefLang)) prefLang = undefined;

  try {
    const authRes = await CheckAuth(req);
    const decodedToken = authRes.decodedToken;
    const user = authRes.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (profileImage) {
      try {
        const domain = new URL(profileImage);
        const hostname = domain.hostname;
        if (
          ![
            'itemdb.com.br',
            'magnetismotimes.com',
            'images.neopets.com',
            'pets.neopets.com',
            'neopets.com',
            'www.neopets.com',
            'uploads.neopets.com',
          ].includes(hostname)
        )
          throw 'Invalid domain';

        if (!profileImage.match(/\.(jpeg|jpg|gif|png)$/)) throw 'Invalid image format';
      } catch (e) {
        return res.status(400).json({ error: 'Invalid image url' });
      }
    }

    if (!username || !neopetsUser) {
      return res.status(400).json({ error: 'Invalid Request' });
    }

    if (!neopetsUser.match(/^[a-zA-Z0-9_]+$/) || !username.match(/^[a-zA-Z0-9_]+$/)) {
      return res.status(400).json({ error: 'Invalid username or neopetsUser' });
    }

    let colorHexVar = profileColor;

    if ((!colorHexVar || colorHexVar === '#000000') && profileImage) {
      const colors = await getImagePalette(profileImage);
      colorHexVar = colors.vibrant.hex;
    }

    const tempUser = await prisma.user.update({
      where: { id: decodedToken.uid },
      data: {
        neo_user: neopetsUser,
        username: username,
        profile_color: colorHexVar,
        profile_image: profileImage,
        description: description,
        pref_lang: prefLang,
      },
    });

    if (!tempUser) return res.status(400).json({ error: 'user not found' });

    const updatedUser: User = {
      id: tempUser.id,
      username: tempUser.username,
      neopetsUser: tempUser.neo_user,
      isAdmin: tempUser.role === 'ADMIN',
      email: '',
      profileColor: tempUser.profile_color,
      profileImage: tempUser.profile_image,
      description: tempUser.description,
      role: tempUser.role as UserRoles,
      prefLang: tempUser.pref_lang,
      lastLogin: startOfDay(tempUser.last_login).toJSON(),
      createdAt: tempUser.createdAt.toJSON(),
      xp: tempUser.xp,
      banned: tempUser.xp < -300,
    };

    if (updatedUser.prefLang)
      res.setHeader('Set-Cookie', `NEXT_LOCALE=${updatedUser.prefLang};Path=/;Max-Age=2147483647;`);

    return res.json(updatedUser);
  } catch (e: any) {
    console.error(e);
    return res.status(400).json({ error: e?.message ?? 'Something went wrong' });
  }
};

// ------------------------------ //

export const getUser = async (username: string) => {
  const user = await prisma.user.findFirst({
    where: {
      username: username,
    },
  });

  if (!user) return null;

  // remove sensitive data
  const cleanedUser: User = {
    id: user.id,
    username: user.username,
    neopetsUser: user.neo_user,
    isAdmin: user.role === 'ADMIN',
    email: '',
    profileColor: user.profile_color,
    profileImage: user.profile_image,
    description: user.description,
    role: user.role as UserRoles,
    prefLang: user.pref_lang,
    lastLogin: startOfDay(user.last_login).toJSON(),
    createdAt: user.createdAt.toJSON(),
    xp: user.xp,
    banned: user.xp < -300,
  };

  return cleanedUser;
};
