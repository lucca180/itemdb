import ReactDOMServer from 'react-dom/server';
import { getLatestItems } from '../v1/items';
import { NextApiRequest, NextApiResponse } from 'next';
import { Widget } from '../../../components/Widget/Widget';
import { getLatestPricedItems } from '../v1/prices';
import { ItemData } from '../../../types';
import { getTrendingItems } from '../v1/beta/trending';
import { getNCMallItemsData } from '../v1/ncmall';
import { getListItems } from '../v1/lists/[username]/[list_id]/itemdata';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const widgetType = (req.query.type as string) || 'latest-items';
  const limit = Number(req.query.limit) || 5;
  const locale = (req.query.locale as string) || 'en';
  const showBadges = req.query.badges === 'true' ? true : false;

  let items: ItemData[] = [];

  if (widgetType === 'latest-items') {
    items = await getLatestItems(limit, true).catch(() => []);
  }

  if (widgetType === 'latest-prices') {
    items = (await getLatestPricedItems(limit, false).catch(() => [])) as ItemData[];
  }

  if (widgetType === 'trending-items') {
    items = await getTrendingItems(limit).catch(() => []);
  }

  if (widgetType === 'latest-ncmall') {
    items = await getNCMallItemsData(limit, false).catch(() => []);
  }

  if (widgetType === 'leaving-ncmall') {
    items = await getNCMallItemsData(limit, true).catch(() => []);
  }

  if (widgetType === 'list') {
    const list_id = req.query.list_id as string;
    const list_owner = req.query.list_owner as string;
    if (!list_id || !list_owner) return res.status(400).send('Required fields missing');

    const listItems = await getListItems(list_id, list_owner);

    if (!listItems) return res.status(404).send('List not found');

    items = listItems;
  }

  const html = ReactDOMServer.renderToStaticMarkup(
    <Widget items={items} locale={locale} showBadges={showBadges} />
  );

  // res.setHeader('Access-Control-Allow-Origin', '*');
  // res.setHeader('Access-Control-Allow-Methods', 'GET');
  // res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send(html);
}
