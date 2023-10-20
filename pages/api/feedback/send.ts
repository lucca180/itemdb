import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import requestIp from 'request-ip';
import sgMail from '@sendgrid/mail';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, json, user_id, type, subject_id } = req.body;
  let { pageInfo } = req.body;

  if (!json || !type) return res.status(400).send('Missing required fields');

  if (type === 'tradePrice') {
    if (!subject_id || isNaN(parseInt(subject_id)) || !user_id)
      return res.status(400).send('Missing required fields');
  }

  const parsed = JSON.parse(json ?? '{}');

  if (!pageInfo) pageInfo = req.headers.referer;
  if (!pageInfo) return res.status(400).send('Missing required fields');

  const ip = requestIp.getClientIp(req);
  const obj = {
    ip: ip,
    pageRef: pageInfo,
    content: parsed,
  };

  let shoudContinue = true;

  if (type === 'tradePrice') shoudContinue = await processTradePrice(parseInt(subject_id));

  if (!shoudContinue) return res.status(400).json({ success: true, message: 'already processed' });

  const result = await prisma.feedbacks.create({
    data: {
      email: email ?? '',
      subject_id: subject_id ? parseInt(subject_id) : undefined,
      json: JSON.stringify(obj),
      type: type ?? 'feedback',
      user: user_id
        ? {
            connect: {
              id: user_id,
            },
          }
        : undefined,
    },
    include: {
      user: true,
    },
  });

  if (type === 'feedback' || type === 'officialApply')
    await submitMailFeedback(obj, subject_id, email ?? '', result.feedback_id, type);

  return res.status(200).json({ success: true, message: result });
}

const processTradePrice = async (trade_id?: number) => {
  const tradeFeedback = await prisma.feedbacks.findFirst({
    where: { type: 'tradePrice', subject_id: trade_id },
  });

  await prisma.trades.update({
    where: { trade_id: trade_id },
    data: {
      processed: true,
    },
  });

  if (tradeFeedback) return false;

  return true;
};

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

const submitMailFeedback = async (
  data: any,
  subject_id: string,
  email: string,
  id: number,
  type: string
) => {
  if (!SENDGRID_API_KEY) return console.error('Missing SENDGRID config');

  sgMail.setApiKey(SENDGRID_API_KEY);

  if (type === 'officialApply')
    subject_id = `https://itemdb.com.br/lists/${data.content.username}/${subject_id}`;

  await sgMail.send({
    from: 'itemdb <noreply@itemdb.com.br>',
    to: 'lucca@itemdb.com.br',
    subject: `[itemdb] ${type}`,
    html: `
      <b>feedback_id</b>: ${id}<br/>
      <b>sender email</b>: ${email}<br/>
      <b>subject_id</b>: ${subject_id}<br/>
      <b>ip</b>: ${data.ip}<br/>
      <b>pageRef</b>: ${data.pageRef}<br/>
      <b>data</b>: ${data.content.message ?? data.content.justification}<br/><br/>
      <b>rawData</b>: ${JSON.stringify(data)}
    `,
  });
};
