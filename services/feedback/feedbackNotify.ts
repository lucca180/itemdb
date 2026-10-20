/**
 * Notifications sent when a feedback is submitted: e-mail (feedback, official list
 * applications, feedback reports) and a Discord webhook (price check requests).
 *
 * No `server-only` here: pages/api/auth/apikeys.ts imports it, and the Pages Router build
 * rejects modules that depend on `server-only`.
 */
import { Resend } from 'resend';
import { Webhook, EmbedBuilder } from '@tycrek/discord-hookr';
import { getItem } from '@pages/api/v1/items/[id_name]';
import type { User } from '@types';

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
      <b>pageRef</b>: ${pageRefLink(data.pageRef)} |
      <b>ip</b>: ${data.ip} |
      ${data.content.userAgent ? `<b>userAgent</b>: ${data.content.userAgent}<br/><br/>` : ''}
      </small>
    `,
  });
};

const escapeHtml = (str: string) =>
  str.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );

// pageRef comes from the client (pageInfo or referer): relative paths resolve against the site,
// only http(s) becomes a link
export const pageRefLink = (pageRef: unknown) => {
  if (typeof pageRef !== 'string' || !pageRef) return 'n/a';

  try {
    const url = new URL(pageRef, 'https://itemdb.com.br');
    if (url.protocol === 'http:' || url.protocol === 'https:')
      return `<a href="${escapeHtml(url.href)}">${escapeHtml(pageRef)}</a>`;
  } catch {
    // not a url - fall through to plain text
  }

  return escapeHtml(pageRef);
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

export const submitHookFeedback = async (params: PriceCheckParams) => {
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

const capitalize = (str?: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};
