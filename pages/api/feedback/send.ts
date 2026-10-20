import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import requestIp from 'request-ip';
import { Resend } from 'resend';
import { FEEDBACK_VOTE_TARGET, getVoteMultiplier } from './vote';
import { User } from '@types';
import { Webhook, EmbedBuilder } from '@tycrek/discord-hookr';
import { getItem } from '../v1/items/[id_name]';
import { CheckAuth } from '@utils/googleCloud';

// tradePrice has its own endpoint (/api/feedback/trade)
const ALLOWED_TYPES = [
  'feedback',
  'officialApply',
  'reportFeedback',
  'priceReport',
  'saleStatus',
  'itemChange',
];

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, json, type, subject_id } = req.body;
  let { pageInfo } = req.body;

  if (!json || !type) return res.status(400).send('Missing required fields');
  if (!ALLOWED_TYPES.includes(type)) return res.status(400).send('Invalid type');

  // the author always comes from the session - body user_id is only checked against it
  const { user } = await CheckAuth(req);
  if (req.body.user_id && req.body.user_id !== user?.id)
    return res.status(401).json({ success: false, message: 'Unauthorized' });

  const user_id = user?.id;

  const parsed = JSON.parse(json ?? '{}');

  if (!pageInfo) pageInfo = req.headers.referer;
  if (!pageInfo) return res.status(400).send('Missing required fields');

  const ip = requestIp.getClientIp(req);
  const obj: any = {
    ip: ip,
    pageRef: pageInfo,
    content: parsed,
  };

  let voteMultiplier = 0;
  if (user) {
    if (user.role === 'ADMIN') voteMultiplier = FEEDBACK_VOTE_TARGET * 2;
    else voteMultiplier = getVoteMultiplier(user.xp);

    if (user.banned && type !== 'feedback') {
      return res.status(403).send('Forbidden');
    }
  }

  if (type === 'feedback') {
    const count = await prisma.feedbacks.count({
      where: {
        type: {
          in: ['feedback', 'officialApply'],
        },
        ip_address: ip ?? '1',
        addedAt: {
          gte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24),
        },
      },
    });

    if (count > 5) return res.status(429).json({ success: false, message: 'Too many requests' });
  }

  if (type === 'priceReport') {
    const count = await prisma.feedbacks.count({
      where: {
        type: 'priceReport',
        ip_address: ip ?? '1',
        addedAt: {
          gte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24),
        },
      },
    });

    if (count > 10) return res.status(429).json({ success: false, message: 'Too many requests' });
  }

  const result = await prisma.feedbacks.create({
    data: {
      email: email ?? '',
      subject_id: subject_id ? parseInt(subject_id) : undefined,
      json: JSON.stringify(obj),
      type: type ?? 'feedback',
      votes: voteMultiplier,
      ip_address: ip ?? '1',
      user_id: user_id ?? undefined,
    },
    select: { feedback_id: true },
  });

  if (type === 'feedback' || type === 'officialApply' || type === 'reportFeedback') {
    await submitMailFeedback(obj, subject_id, email ?? '', result.feedback_id, type);
  }

  if (type === 'priceReport') {
    await submitHookFeedback({
      subject_id,
      feedback_id: result.feedback_id,
      type,
      reason: parsed.reason,
      suggestedPrice: parsed.suggestedPrice,
      user,
    });
  }

  return res.status(200).json({ success: true, message: { feedback_id: result.feedback_id } });
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = new Resend(RESEND_API_KEY);

export const submitMailFeedback = async (
  data: any,
  subject_id: string,
  email: string,
  id: number,
  type: string
) => {
  if (!RESEND_API_KEY) return console.error('Missing RESEND config');

  if (type === 'officialApply')
    subject_id = `https://itemdb.com.br/lists/${data.content.username}/${subject_id}`;

  const subject = data.content.subject || type;
  let message = data.content.message || data.content.justification || '';
  message = message.replace(/\n/g, '<br/>');

  await resend.emails.send({
    from: 'itemdb <noreply@itemdb.com.br>',
    to: 'lucca@itemdb.com.br',
    replyTo: email || 'noreply@itemdb.com.br',
    subject: `[itemdb] ${subject}`,
    html: `
      ${message}<br/><br/>
      <small style="opacity: 0.5;">--- debug info ---<br/>
      <b>feedback_id</b>: ${id} | 
      ${subject_id ? `<b>subject_id</b>: ${subject_id} | ` : ''}
      <b>pageRef</b>: ${data.pageRef} | 
      <b>ip</b>: ${data.ip} | 
      ${data.content.userAgent ? `<b>userAgent</b>: ${data.content.userAgent}<br/><br/>` : ''}
      </small>
    `,
  });
};

type PriceCheckParams = {
  subject_id: string;
  feedback_id: number;
  type: string;
  reason: string;
  suggestedPrice?: string;
  user: User | null;
};

const intl = new Intl.NumberFormat();

const submitHookFeedback = async (params: PriceCheckParams) => {
  const { subject_id, feedback_id, type, reason, user, suggestedPrice } = params;
  const hook = process.env.FEEDBACK_WEBHOOK ? new Webhook(process.env.FEEDBACK_WEBHOOK) : null;

  if (type !== 'priceReport' || !hook) return;
  const item = await getItem(subject_id);
  if (!item) return;

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Price Check Request' })
    .setTitle(item.name)
    .setColor(item.color.hex)
    .setThumbnail({ url: item?.image })
    .setDescription('Um usuário pediu para verificar se o preço de um item está correto')
    .addField({
      name: 'Usuário',
      value: user ? `${user.username}` : 'Unknown',
      inline: true,
    })
    .addField({
      name: 'Motivo',
      value: capitalize(reason) || 'Nenhum motivo foi informado',
      inline: true,
    })
    .addField({
      name: 'Preço Atual',
      value: item.price.value ? intl.format(item.price.value) : 'n/a',
      inline: true,
    })
    .addField({
      name: 'Preço Sugerido',
      value: suggestedPrice ? intl.format(Number(suggestedPrice)) : '???',
      inline: true,
    })
    .setFooter({ text: `Feedback ID: ${feedback_id}` })
    .setURL(`https://itemdb.com.br/item/${item.slug}`);

  hook.addEmbed(embed);
  hook.send().catch(console.error);
};

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
