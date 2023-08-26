import type { NextApiRequest, NextApiResponse } from 'next';
import { Auth } from '../../../utils/googleCloud';
import ejs from 'ejs';
import sgMail from '@sendgrid/mail';

const isDev = process.env.NODE_ENV === 'development';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' });

  const email = req.body.email;
  if (!SENDGRID_API_KEY) return res.status(500).json({ success: false, message: 'Bad server' });
  if (!email) return res.status(400).json({ success: false, message: 'No email provided' });

  try {
    const actionLink = await Auth.generateSignInWithEmailLink(email, {
      url: isDev ? 'http://localhost:3000/login' : 'https://itemdb.com.br/login',
    });

    if (isDev) console.log(actionLink);

    sgMail.setApiKey(SENDGRID_API_KEY);

    const template = await ejs.renderFile('utils/views/signinLink.ejs', {
      actionLink,
      randomNumber: Math.random(),
    });

    const msg = {
      from: 'itemdb <noreply@itemdb.com.br>',
      to: email,
      subject: 'itemdb: Magic login link',
      html: template,
    };

    await sgMail.send(msg);

    return res.status(200).json({ success: true, message: 'ok' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}
