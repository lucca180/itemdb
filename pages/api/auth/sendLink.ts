import type { NextApiRequest, NextApiResponse } from 'next';
import { Auth } from '../../../utils/googleCloud';
import { CreateEmailOptions, Resend } from 'resend';
import { getEmail } from '@utils/email';
import prisma from '@utils/prisma';

const isDev = process.env.NODE_ENV === 'development';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = new Resend(RESEND_API_KEY);

const mailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' });

  const cred = req.body.cred;
  if (!RESEND_API_KEY) return res.status(500).json({ success: false, message: 'Bad server' });
  if (!cred) return res.status(400).json({ success: false, message: 'No credential provided' });

  const isMail = cred.match(mailRegex);

  let email = cred.trim();

  if (!isMail) {
    // If it's not an email, try to find the email associated with the username
    const user = await prisma.user.findUnique({
      where: {
        username: cred.trim(),
      },
      select: {
        email: true,
      },
    });

    if (!user) return res.status(200).json({ success: true, message: 'ok' });
    email = user.email;
  }

  try {
    const actionLink = await Auth.generateSignInWithEmailLink(email, {
      url: isDev ? 'http://localhost:3000/login' : 'https://itemdb.com.br/login',
    });

    if (isDev) console.warn(actionLink);

    const template = getEmail(actionLink);

    const msg: CreateEmailOptions = {
      from: 'itemdb <noreply@itemdb.com.br>',
      to: email,
      subject: 'itemdb - Login Link',
      html: template.html,
      text: template.text,
    };

    await resend.emails.send(msg);

    return res.status(200).json({ success: true, message: 'ok' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}
