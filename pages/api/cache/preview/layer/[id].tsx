import type { NextApiRequest, NextApiResponse } from 'next';
import { dti } from '../../../../../utils/impress';
import ReactDOMServer from 'react-dom/server';
import { AnimatedLayer } from '@components/AnimatedPreview/AnimatedLayer';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const { id } = req.query;

  const layer = await dti.fetchItemLayer(Number(id));
  if (!layer || !layer.canvasMovieLibraryUrl)
    return res.status(400).send('Layer not found or invalid');

  const html = ReactDOMServer.renderToStaticMarkup(
    <AnimatedLayer
      jsAnimationUrl={layer.canvasMovieLibraryUrl}
      fallbackImageUrl={layer.imageUrlV2}
    />
  );

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'public, max-age=5184000, stale-while-revalidate'); // 60 days
  res.status(200).send(html);
}
