import { Prisma } from '@prisma/generated/client';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { CheckAuth } from '../../../../utils/googleCloud';
import { User, UserList } from '../../../../types';
import { subDays } from 'date-fns';
import { getImagePalette } from '../lists/[username]';
import { ListService } from '@services/ListService';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const albumInfo = await getAlbumInfo();
    return res.status(200).json(albumInfo);
  }

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export const getAlbumInfo = async () => {
  const listService = ListService.init();
  const albumLists = await listService.getOfficialListsCat('stamps', 1000);
  if (!albumLists.length) return [];

  const albumMap = {} as {
    [page_id: number]: {
      avatar: AlbumAvatar;
      officialList: UserList;
    };
  };

  albumLists.forEach((l) => {
    const description = l.description || '';

    const match = description.match(/page_id=(\d+)/);
    const page_id = match ? parseInt(match[1], 10) : null;

    if (page_id) {
      const avatar = avatarInfo[page_id] || null;

      albumMap[page_id] = {
        avatar: avatar,
        officialList: l,
      };
    }
  });

  return albumMap;
};

export type AlbumAvatar = {
  url: string;
  color: string;
};

const avatarInfo: {
  [index: number | string]: AlbumAvatar;
} = {
  '1': {
    url: 'http://images.neopets.com/neoboards/avatars/stampsMystery2352.gif',
    color: '#F46414',
  },
  '2': {
    url: 'http://images.neopets.com/neoboards/avatars/stampsVirtupets9764.gif',
    color: '#CC4444',
  },
  '3': {
    url: 'http://images.neopets.com/neoboards/avatars/stampsTyrannia3421.gif',
    color: '#DEA616',
  },
  '4': {
    url: 'http://images.neopets.com/neoboards/avatars/stampsHaunted3192.gif',
    color: '#689797',
  },
  '5': {
    url: 'http://images.neopets.com/neoboards/avatars/stampcollectorneopiacentral.gif',
    color: '#A68047',
  },
  '6': {
    url: 'https://images.neopets.com/neoboards/avatars/neoquest.gif',
    color: '#E9B114',
  },
  '7': {
    url: 'http://images.neopets.com/neoboards/avatars/stampsSnowy2312.gif',
    color: '#249C5C',
  },
  '8': {
    url: 'http://images.neopets.com/neoboards/avatars/meridellvsarigan.gif',
    color: '#EDA70C',
  },
  '9': {
    url: 'http://images.neopets.com/neoboards/avatars/stampsDesert0013.gif',
    color: '#D4AE2E',
  },
  '10': {
    url: 'http://images.neopets.com/neoboards/avatars/stampsbattledome1337.gif',
    color: '#04A404',
  },
  '11': {
    url: 'https://images.neopets.com/neoboards/avatars/coins.gif',
    color: '#888877',
  },
  '12': {
    url: 'https://images.neopets.com/neoboards/avatars/battleformeridell.gif',
    color: '#947C34',
  },
  '13': {
    url: 'https://images.neopets.com/neoboards/avatars/neoquestii.gif',
    color: '#F1E906',
  },
  '14': {
    url: 'https://images.neopets.com/neoboards/avatars/other.gif',
    color: '#C8B830',
  },
  '15': {
    url: 'https://images.neopets.com/neoboards/avatars/spacestationcoins.gif',
    color: '#6D8592',
  },
  '16': {
    url: 'https://images.neopets.com/neoboards/avatars/avaevilcoconut.gif',
    color: '#FC4004',
  },
  '17': {
    url: 'http://images.neopets.com/neoboards/avatars/collectorseashells.gif',
    color: '#447CBC',
  },
  '18': {
    url: 'http://images.neopets.com/neoboards/avatars/kingkelp.gif',
    color: '#043C9C',
  },
  '19': {
    url: 'https://images.neopets.com/neoboards/avatars/altador.gif',
    color: '#D4D42F',
  },
  '20': {
    url: 'http://images.neopets.com/neoboards/avatars/collectorshenkuu.gif',
    color: '#C48C3C',
  },
  '21': {
    url: 'https://images.neopets.com/neoboards/avatars/ava_stampalbum_charms.gif',
    color: '#7CD42C',
  },
  '22': {
    url: 'http://images.neopets.com/neoboards/avatars/stampsothers.gif',
    color: '#3DAD34',
  },
  '23': {
    url: 'http://images.neopets.com/neoboards/avatars/stampsfaerieland87393.gif',
    color: '#B444B4',
  },
  '24': {
    url: 'https://images.neopets.com/neoboards/avatars/scarabs.gif',
    color: '#04B4AC',
  },
  '29': {
    url: 'https://images.neopets.com/neoboards/avatars/ava_stampalbum_krawkisland.gif',
    color: '#5C843C',
  },
  '33': {
    url: 'https://images.neopets.com/neoboards/avatars/ava_stampalbum_other_faeries.gif',
    color: '#B47C44',
  },
};
