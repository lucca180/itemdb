import { NextApiRequest, NextApiResponse } from 'next';
import { checkPetColorExists, getPetColorData, getPetColorDataStr } from '@utils/petColorTool';
import { fetchAllNeopetsColors } from '@utils/pet-colors';
import { findPetColorId, getSpeciesId } from '@utils/pet-utils';

export { checkPetColorExists, getPetColorData, getPetColorDataStr };

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function GET(req: NextApiRequest, res: NextApiResponse) {
  const colorTarget = req.query.colorTarget as string | undefined;
  const speciesTarget = req.query.speciesTarget as string | undefined;

  const colors = await fetchAllNeopetsColors();

  let colorTargetId: number | undefined = colorTarget ? Number(colorTarget) : undefined;
  let speciesTargetId: number | undefined = speciesTarget ? Number(speciesTarget) : undefined;

  if (colorTarget && (!colorTargetId || isNaN(colorTargetId))) {
    colorTargetId = findPetColorId(colorTarget, colors) ?? undefined;
  }

  if (speciesTarget && (!speciesTargetId || isNaN(speciesTargetId))) {
    speciesTargetId = getSpeciesId(speciesTarget) ?? undefined;
  }

  if (!colorTarget && !speciesTarget) {
    return res.status(400).json({ error: 'Missing query parameters' });
  }

  if (colorTargetId && speciesTargetId) {
    const exists = await checkPetColorExists(colorTargetId, speciesTargetId);
    if (!exists) return res.status(400).json({ error: 'pet_color_not_found' });
  }

  const response = await getPetColorData(colorTargetId, speciesTargetId, colors);

  return res.status(200).json(response);
}
