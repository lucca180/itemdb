import { after } from 'next/server';
import prisma from '@utils/prisma';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { getRequestClientIp } from '@utils/api/clientIp';
import { FEEDBACK_VOTE_TARGET, getVoteMultiplier } from '@utils/feedback/voteRules';
import { submitHookFeedback, submitMailFeedback } from '@services/feedback/feedbackNotify';
import { reportBackgroundError } from '@utils/api/reportBackgroundError';

// tradePrice has its own endpoint (/api/feedback/trade)
const ALLOWED_TYPES = [
  'feedback',
  'officialApply',
  'reportFeedback',
  'priceReport',
  'saleStatus',
  'itemChange',
];

const DAY = 1000 * 60 * 60 * 24;

type SendBody = {
  email?: string;
  json?: string;
  type?: string;
  subject_id?: string | number;
  user_id?: string;
  pageInfo?: string;
};

const text = (msg: string, status: number) => new Response(msg, { status });

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SendBody | null;
  if (!body) return text('Missing required fields', 400);

  const { email, json, type } = body;
  const subject_id = body.subject_id !== undefined ? String(body.subject_id) : '';
  let pageInfo = body.pageInfo;

  if (!json || !type) return text('Missing required fields', 400);
  if (!ALLOWED_TYPES.includes(type)) return text('Invalid type', 400);

  // the author always comes from the session - body user_id is only checked against it
  const { user } = await getServerCurrentUser();
  if (body.user_id && body.user_id !== user?.id)
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch {
    return text('Invalid json', 400);
  }

  if (!pageInfo) pageInfo = request.headers.get('referer') ?? undefined;
  if (!pageInfo) return text('Missing required fields', 400);

  const ip = getRequestClientIp(request);
  const obj = {
    ip: ip,
    pageRef: pageInfo,
    content: parsed,
  };

  let voteMultiplier = 0;
  if (user) {
    if (user.role === 'ADMIN') voteMultiplier = FEEDBACK_VOTE_TARGET * 2;
    else voteMultiplier = getVoteMultiplier(user.xp);

    if (user.banned && type !== 'feedback') return text('Forbidden', 403);
  }

  if (type === 'feedback') {
    const count = await prisma.feedbacks.count({
      where: {
        type: { in: ['feedback', 'officialApply'] },
        ip_address: ip ?? '1',
        addedAt: { gte: new Date(Date.now() - DAY) },
      },
    });

    if (count > 5)
      return Response.json({ success: false, message: 'Too many requests' }, { status: 429 });
  }

  if (type === 'priceReport') {
    const count = await prisma.feedbacks.count({
      where: {
        type: 'priceReport',
        ip_address: ip ?? '1',
        addedAt: { gte: new Date(Date.now() - DAY) },
      },
    });

    if (count > 10)
      return Response.json({ success: false, message: 'Too many requests' }, { status: 429 });
  }

  const result = await prisma.feedbacks.create({
    data: {
      email: email ?? '',
      subject_id: subject_id ? parseInt(subject_id) : undefined,
      json: JSON.stringify(obj),
      type,
      votes: voteMultiplier,
      ip_address: ip ?? '1',
      user_id: user?.id,
    },
    select: { feedback_id: true },
  });

  // notifications don't block the response
  after(async () => {
    try {
      if (type === 'feedback' || type === 'officialApply' || type === 'reportFeedback')
        await submitMailFeedback(obj, subject_id, email ?? '', result.feedback_id, type);

      if (type === 'priceReport')
        await submitHookFeedback({
          subject_id,
          feedback_id: result.feedback_id,
          type,
          reason: parsed.reason,
          suggestedPrice: parsed.suggestedPrice,
          user,
        });
    } catch (e) {
      // the feedback itself is saved - this keeps what the notification would have carried
      reportBackgroundError(e, {
        task: 'feedback.notify',
        tags: { feedback_id: result.feedback_id, type },
        data: {
          feedback_id: result.feedback_id,
          type,
          subject_id,
          pageRef: pageInfo,
          author: user?.id ?? null,
          content: parsed,
        },
      });
    }
  });

  return Response.json({ success: true, message: { feedback_id: result.feedback_id } });
}
