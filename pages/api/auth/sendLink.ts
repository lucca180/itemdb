import type { NextApiRequest, NextApiResponse } from 'next';
import { Auth } from '../../../utils/googleCloud';
import nodemailer from 'nodemailer';
import ejs from 'ejs';

const isDev = process.env.NODE_ENV === 'development';
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' });

  const email = req.body.email;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS)
    return res.status(500).json({ success: false, message: 'Bad server' });
  if (!email) return res.status(400).json({ success: false, message: 'No email provided' });

  try {
    const actionLink = await Auth.generateSignInWithEmailLink(email, {
      url: isDev ? 'http://localhost:3000/login' : 'https://itemdb.com.br/login',
    });

    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT),
      secure: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const template = await ejs.renderFile('utils/views/signinLink.ejs', {
      actionLink,
      randomNumber: Math.random(),
    });

    await transporter.sendMail({
      from: '"itemdb" <noreply@itemdb.com.br>',
      to: email,
      subject: 'itemdb: Magic login link',
      html: template,
    });

    return res.status(200).json({ success: true, message: 'ok' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}
