import type { NextApiRequest, NextApiResponse } from 'next';
import { CreateEmailOptions, Resend } from 'resend';
import requestIp from 'request-ip';
import { getEmail } from '@utils/email';
import prisma from '@utils/prisma';
import { createMagicToken } from '@utils/auth/magicLink';
import { consumeLoginRateLimit } from '@utils/auth/loginRateLimit';

const isDev = process.env.NODE_ENV === 'development';

const mailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_TIMING_PAD_MS = 75;

type SendLinkBody = {
  cred?: string;
  confirmNewAccount?: boolean;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendMagicLinkEmail(email: string) {
  const origin = isDev
    ? 'http://localhost:3000'
    : (process.env.SITE_URL ?? 'https://itemdb.com.br');

  const actionLink = await createMagicToken(email, origin);
  const fullLink = `${origin}/login?token=${actionLink}&email=${encodeURIComponent(email)}`;

  // In dev the link is already printed to stdout by createMagicToken;
  // only send a real email in production.
  if (!isDev) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const template = getEmail(fullLink);

    const msg: CreateEmailOptions = {
      from: 'itemdb <noreply@itemdb.com.br>',
      to: email,
      subject: 'Your itemdb login link',
      html: template.html,
      text: template.text,
    };

    await resend.emails.send(msg);
  }
}

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { cred, confirmNewAccount } = (req.body ?? {}) as SendLinkBody;
  if (!isDev && !process.env.RESEND_API_KEY)
    return res.status(500).json({ success: false, message: 'Bad server' });
  if (!cred || typeof cred !== 'string')
    return res.status(400).json({ success: false, message: 'No credential provided' });

  const ip = requestIp.getClientIp(req);
  const rate = await consumeLoginRateLimit(ip);

  if (!rate.allowed) {
    return res.status(429).json({
      success: false,
      code: 'rate-limited',
      remaining: 0,
      retryAfterSeconds: rate.retryAfterSeconds,
      message: 'Too many login attempts',
    });
  }

  const trimmed = cred.trim();
  const isMail = mailRegex.test(trimmed);

  try {
    if (!isMail) {
      const user = await prisma.user.findUnique({
        where: { username: trimmed },
        select: { email: true },
      });

      if (user) {
        await sendMagicLinkEmail(user.email);
      } else {
        // Reduce timing leak for username existence without claiming it in the response.
        await sleep(USERNAME_TIMING_PAD_MS);
      }

      return res.status(200).json({
        success: true,
        mode: 'username',
        remaining: rate.remaining,
        message: 'ok',
      });
    }

    const email = trimmed.toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!existing && !confirmNewAccount) {
      return res.status(200).json({
        success: true,
        mode: 'email',
        accountExists: false,
        needsConfirmation: true,
        remaining: rate.remaining,
        message: 'ok',
      });
    }

    await sendMagicLinkEmail(email);

    return res.status(200).json({
      success: true,
      mode: 'email',
      accountExists: Boolean(existing),
      remaining: rate.remaining,
      message: 'ok',
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}
