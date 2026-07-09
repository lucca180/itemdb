import { EmbedBuilder, Webhook } from '@tycrek/discord-hookr';

export type WatchdogRestartNotice = {
  app: string;
  port: number;
  cwd: string;
  failedProbes: number;
  totalProbes: number;
  unhealthyCycles: number;
};

export async function notifyWatchdogRestart(notice: WatchdogRestartNotice) {
  const url = process.env.POOL_WATCHDOG_WEBHOOK;
  if (!url) return;

  const hook = new Webhook(url);
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Pool health watchdog' })
    .setTitle('PM2 restart triggered')
    .setColor('#e74c3c')
    .addField({ name: 'App', value: notice.app, inline: true })
    .addField({ name: 'Port', value: String(notice.port), inline: true })
    .addField({
      name: 'Probes',
      value: `${notice.failedProbes}/${notice.totalProbes} failed this cycle`,
      inline: true,
    })
    .addField({
      name: 'Unhealthy cycles',
      value: String(notice.unhealthyCycles),
      inline: true,
    })
    .addField({ name: 'Cwd', value: notice.cwd, inline: false })
    .setTimestamp(new Date());

  hook.addEmbed(embed);

  try {
    await hook.send();
  } catch (error) {
    console.error('[watchdog] Discord notify failed', error);
  }
}
