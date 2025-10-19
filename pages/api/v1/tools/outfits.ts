import prisma from '@utils/prisma';
import { NextApiRequest, NextApiResponse } from 'next';
import { getManyItems } from '../items/many';
import { ItemData } from '@types';

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
  const { species } = req.query as { species: string };
  if (!species) return res.status(400).json({ error: 'Missing species' });

  const outfits = await getSpeciesOutfits(species);

  return res.status(200).json(outfits);
};

export const getSpeciesOutfits = async (species: string) => {
  const ids = (await prisma.$queryRaw`
    SELECT w.item_iid
    FROM wearabledata w
    JOIN items i ON w.item_iid = i.internal_id
    WHERE w.species_name != ''
      AND i.type != 'pb'
      AND i.name REGEXP ${`\\b${species}(\\b|\\s)`}
      AND i.internal_id > 0
    GROUP BY w.item_iid
    HAVING COUNT(DISTINCT w.species_name) <= 3 and SUM(w.species_name = ${species}) > 0;
  `) as { item_iid: number }[];

  const itemData = await getManyItems({
    id: ids.map((i) => i.item_iid.toString()),
  });

  return groupBySimilarity(Object.values(itemData), species);
};

function groupBySimilarity(array: ItemData[], speciesName: string) {
  const outfitLine: { [key: string]: ItemData[] } = {};

  for (const item of array) {
    const name = item.name.toLowerCase();
    let line = name.split(speciesName.toLowerCase())[0].trim().toLowerCase();

    if (!line) {
      line = name.toLowerCase().split(' ')[1].trim();
    }

    if (getExceptions(line, speciesName)) {
      line = name
        .toLowerCase()
        .replace(speciesName, '')
        .replace(getExceptions(line, speciesName), '')
        .trim()
        .split(' ')[0];
    }

    if (!outfitLine[line]) {
      outfitLine[line] = [item];
    } else {
      outfitLine[line].push(item);
    }
  }

  for (const [key, line] of Object.entries(outfitLine)) {
    // find words in common in all items
    const commonWords = line.reduce((acc, item) => {
      const words = item.name
        // .replace(speciesName, '')
        .split(' ')
        .map((word) => word.trim().toLowerCase());
      if (acc.length === 0) return words;
      return acc.filter((word) => words.includes(word));
    }, [] as string[]);

    const lineName = commonWords.join(' ');
    if (lineName) {
      outfitLine[lineName] = outfitLine[key];
      delete outfitLine[key];
    }
  }

  return outfitLine;
}

// exceptions for some species
const getExceptions = (lineName: string, species: string) => {
  species = species.toLowerCase();
  lineName = lineName.toLowerCase();

  if (species === 'kougra') {
    if (lineName === 'elemental') return 'elemental';
  }

  if (species === 'meerca') {
    if (lineName === 'tail') return 'tail';
  }

  return '';
};
