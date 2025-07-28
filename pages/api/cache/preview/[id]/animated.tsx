/* eslint-disable @next/next/no-img-element */
import type { NextApiRequest, NextApiResponse } from 'next';
import { dti, getVisibleLayers } from '../../../../../utils/impress';
import ReactDOMServer from 'react-dom/server';
import prisma from '@utils/prisma';
import { PreviewWrapper } from '@components/AnimatedPreview/PreviewWrapper';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const { id } = req.query;
  if (!id) return res.status(400).send('No image id provided');

  const img_id = (id as string).split('.')[0];

  const item = await prisma.items.findFirst({
    where: {
      image_id: img_id as string,
    },
  });

  if (!item) return res.status(404).send('Item not found');

  const itemPreviewData = await dti.fetchItemPreview(item.name);
  if (!itemPreviewData || !itemPreviewData.canonicalAppearance?.layers)
    return res.status(404).send('Item preview not found');

  const layers = getVisibleLayers(itemPreviewData.canonicalAppearance.body.canonicalAppearance, [
    itemPreviewData.canonicalAppearance,
  ]);

  if (layers.length === 0) throw 'No layers found';

  const elements = layers.map((layer) => {
    if (!layer.canvasMovieLibraryUrl)
      return <img key={layer.id} src={layer.imageUrlV2} alt={layer.id} />;

    return (
      <iframe
        key={layer.id}
        src={`/api/cache/preview/layer/${layer.remoteId}?playing=true`}
        title={layer.id}
      />
    );
  });

  const html = ReactDOMServer.renderToStaticMarkup(<PreviewWrapper>{elements}</PreviewWrapper>);

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'public, max-age=5184000, stale-while-revalidate'); // 60 days
  res.status(200).send(html);
}
