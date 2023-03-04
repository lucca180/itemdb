import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../utils/prisma";

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') return GET(req, res);
  
    if (req.method == 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      return res.status(200).json({});
    }
  
    return res.status(405).json({ error: 'Method not allowed' });
}

async function GET(req: NextApiRequest, res: NextApiResponse<any>) {
    const itemProcess = prisma.itemProcess.count({
        where: {
            processed: false,
        },
    });

    const itemProcessTotal = prisma.itemProcess.count();

    const itemsMissingInfo = prisma.items.count({
        where: {
            OR: [
                {item_id: null},
                {est_val: null},
                {weight: null},
                {rarity: null},
            ]
        },
    });

    const itemsTotal = prisma.items.count();

    const tradePricing = prisma.trades.count({
        where: {
            processed: false,
        },
    });

    const tradeTotal = prisma.trades.count();

    const [itemToProcessCount, itemsMissingInfoCount, itemsTotalCount, tradeProcessCount, tradeTotalCount, itemProcessCount] = await Promise.all([
        itemProcess,
        itemsMissingInfo,
        itemsTotal,
        tradePricing,
        tradeTotal,
        itemProcessTotal
    ]);

    return res.status(200).json({
        itemProcess: itemProcessCount,
        itemToProcess: itemToProcessCount,
        itemsMissingInfo: itemsMissingInfoCount,
        itemsTotal: itemsTotalCount,
        tradePricing: tradeProcessCount,
        tradeTotal: tradeTotalCount,
    });
            
}
