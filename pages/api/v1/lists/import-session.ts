import type { NextApiRequest, NextApiResponse } from 'next';
import { createListImportSession } from '@utils/list/importSession';
import { getLocalizedHref, resolvePageLocale } from '@utils/locales';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const items = JSON.parse(body?.itemDataJson || 'null');
    const indexType = body?.indexType ?? 'item_id';
    const list_id = body?.list_id ?? null;

    if (!items || typeof items !== 'object' || Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid import data' });
    }

    const token = await createListImportSession({
      items,
      indexType,
      list_id,
    });

    const locale = resolvePageLocale(
      typeof body?.locale === 'string' ? body.locale : req.cookies.NEXT_LOCALE
    );
    const destination = getLocalizedHref(
      `/lists/import?importToken=${encodeURIComponent(token)}`,
      locale
    );

    return res.redirect(303, destination);
  } catch (e) {
    console.error('List import session error:', e);
    return res.status(400).json({ error: 'Invalid import data' });
  }
}
