import { Prisma } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from 'openai';
import { backOff } from 'exponential-backoff';
import { TradeData } from '../../../../types';
import prisma from '../../../../utils/prisma';

const TARNUM_KEY = process.env.TARNUM_KEY;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(200).json({});
  }

  if (!req.headers.authorization || req.headers.authorization !== TARNUM_KEY)
    return res.status(401).json({ error: 'Unauthorized' });

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const tradeRaw = await prisma.trades.findMany({
    where: {
      processed: false,
    },
    include: { items: true },
    orderBy: { addedAt: 'asc' },
    take: 30,
  });

  const trades: TradeData[] = tradeRaw.map((t) => {
    return {
      trade_id: t.trade_id,
      owner: t.owner,
      wishlist: t.wishlist,
      addedAt: t.addedAt.toJSON(),
      processed: t.processed,
      priced: t.priced,
      hash: t.hash,
      items: t.items.map((i) => {
        return {
          internal_id: i.internal_id,
          trade_id: i.trade_id,
          name: i.name,
          image: i.image,
          image_id: i.image_id,
          order: i.order,
          price: i.price?.toNumber() || null,
          addedAt: i.addedAt.toJSON(),
        };
      }),
    };
  });
  const promises = [];
  for (const trade of trades) {
    promises.push(backOff(() => autoPrice(trade), { numOfAttempts: 5, startingDelay: 1000 }));
  }

  const pricedTrades = await Promise.all(promises);

  const feedbackArray: Prisma.FeedbacksCreateInput[] = pricedTrades.map((t) => ({
    type: 'tradePrice',
    subject_id: t.trade_id,
    user_id: 'UmY3BzWRSrhZDIlxzFUVxgRXjfi1',
    json: JSON.stringify({
      ip: 'auto',
      pageRef: 'auto',
      content: { trade: t },
    }),
  }));

  const feedbacks = prisma.feedbacks.createMany({
    data: feedbackArray,
  });

  const updateTrades = prisma.trades.updateMany({
    where: {
      trade_id: {
        in: pricedTrades.map((t) => t.trade_id),
      },
    },
    data: {
      processed: true,
    },
  });

  const result = await prisma.$transaction([feedbacks, updateTrades]);

  return res.status(200).json(result);
}

const autoPrice = async (trade: TradeData) => {
  const tradeStr = `Wishlist: ${trade.wishlist}\n\nItem List:\n\n${trade.items
    .sort((a, b) => a.order - b.order)
    .map((i) => i.name)
    .join('\n')}`;
  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [...messages, { role: 'user', content: tradeStr }],
    temperature: 0.6,
    top_p: 1,
  });

  const priceStr = response.data.choices[0].message?.content;
  if (!priceStr) return trade;

  const prices = priceStr.split('\n');
  for (const item of trade.items) {
    const thisPrice = prices.shift();
    if (!thisPrice) continue;
    // create regex [itemname]: [price] (price can be a negative number)
    const regex = new RegExp(`${item.name}:\\s*(-?\\d+)`);
    const match = thisPrice.match(regex);

    if (!match) continue;

    const price = parseInt(match[1]);
    if (price === -1) continue;
    if (price >= 2147483600) continue;

    item.price = price || null;
  }

  console.log(trade.wishlist);
  for (const item of trade.items) {
    console.log(item.name, item.price);
  }

  console.log('--------\n\n');

  return trade;
};

const messages: ChatCompletionRequestMessage[] = [
  {
    role: 'system',
    content:
      'You are a Neopets Trading Post Assistant. Your goal is to translate the users wishlists into numbers so a machine can read it. You always follow the rules.',
  },
  {
    role: 'user',
    content:
      'This message contain the rules you ALWAYS follow. You will read a wishlist and price each item in a trade lot.\nYou must ALWAYS price one item per line - even if all items are the same - and your response should contain ONLY numbers.\n You only price items that are in the item list.\nYou should not assume prices that are not explicitly described.\n You should NEVER use ANY INFORMATION beyond the CURRENT WISHLIST AND THESE RULES to price a item.\nThe price should never be 0 - if it is 0, return -1.\n If the wishlist only informs a single price for a lot with multiple different items or a single price for different items together, price all as -1. If ALL items are the equal, divide the asked value equally between them.\nYou can assume that identical items will have the same price except if stated otherwise.\nDo not price lots whose price is composed of another item. For example, "6 baby pb + 100k".\n If there are two specified payment methods, always use the cash version ("pure").\nIf the wishlist mentions a list of values, consider this the price of each item in the order it is presented.\nThe wishlist is always about the items in the item list.\nIf any item is offered for free, return -1 for that item.\n If the price is not clear - or not specified - return -1 for that item.\nIf multiple prices are informed, you should use the one that asks only for "pure" neopoints.\nItems in "Paperclip Trade" should be priced at -1.\n Respond in the format and only in the format: [item name]: [price as an integer number without dots].\n Do not include any other information in your response. Do not explain your reasons.\n Please confirm that you understand.',
  },
  {
    role: 'assistant',
    content: 'Yes, I understand.',
  },
  {
    role: 'user',
    content:
      'Wishlist: 1.8 & 1 baby pb or 2.4 pure! Sub on the house so you dont get hungry browsing the trading post!!\n\nItem List:\nCheese and Tomato Sub\n Lemon and Lime Easter Negg',
  },
  { role: 'assistant', content: 'Cheese and Tomato Sub: -1\n Lemon and Lime Easter Negg: 2400000' },
  {
    role: 'user',
    content:
      'Wishlist: 35m | 150m | 10m | 2m | 1.3m | 2.5m | 1.3m | 5m \n\nItem List:\n Maraquan Commanders Helm\nNeopian Times 200th Anniversary Card\nKauvara\nFaerie JubJub Morphing Potion\nBzzt Blaster Coin\nMaraquan Hissi Morphing Potion\nDarigan Grarrl Morphing Potion\nMaraquan Mynci Morphing Potion\n',
  },
  {
    role: 'assistant',
    content:
      'Maraquan Commanders Helm: 35000000\n Neopian Times 200th Anniversary Card: 150000000\n Kauvara: 10000000\n Faerie JubJub Morphing Potion: 2000000\n Bzzt Blaster Coin: 1300000\n Maraquan Hissi Morphing Potion: 2500000\n Darigan Grarrl Morphing Potion: 1300000\n Maraquan Mynci Morphing Potion: 5000000',
  },
];
