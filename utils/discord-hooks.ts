import { getManyItems } from '../pages/api/v1/items/many';
import { ItemData } from '../types';
import prisma from './prisma';
import { Webhook, EmbedBuilder } from '@tycrek/discord-hookr';
import type { EmbedBuilder as Embed } from '@tycrek/discord-hookr/dist/EmbedBuilder';

export const sendNewItemsHook = async (latest: number) => {
  const newItemIds = await prisma.items.findMany({
    where: {
      canonical_id: null,
    },
    take: latest,
    orderBy: {
      internal_id: 'desc',
    },
    select: {
      internal_id: true,
    },
  });

  const itemData = await getManyItems({
    id: newItemIds.map((item) => item.internal_id.toString()),
  });

  const ncMsgs = Object.values(itemData)
    .filter((i) => i.isNC && (!i.item_id || i.item_id > 85020))
    .map((i) => newNCMall(i));

  const newItemsEmbeds = Object.values(itemData)
    .filter((i) => !i.item_id || i.item_id > 85020)
    .map((i) => getItemEmbed(i));

  // send in chunks of 10
  const newItemsMsgs = [];
  for (let i = 0; i < newItemsEmbeds.length; i += 10) {
    newItemsMsgs.push(newItemsHookSend(newItemsEmbeds.slice(i, i + 10)));
  }

  await Promise.all([...ncMsgs, ...newItemsMsgs]);
};

const getItemEmbed = (item: ItemData) => {
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Item Novo!!!' })
    .setTitle(`${item.name} - r${item.rarity ?? '???'}`)
    .setColor(item.color.hex)
    .setThumbnail({ url: item.image })
    .setDescription(item.description);

  if (item.isWearable) {
    embed.setImage({ url: 'https://itemdb.com.br/api/cache/preview/' + item.image_id + '.png' });
  }

  embed.setURL(`https://itemdb.com.br/item/${item.slug}`);

  return embed;
};

export const newNCMall = async (item: ItemData) => {
  const ncChannelHook = process.env.NC_CHANNEL_WEBHOOK
    ? new Webhook(process.env.NC_CHANNEL_WEBHOOK)
    : null;

  if (!ncChannelHook) return;
  const embed = getItemEmbed(item);
  ncChannelHook.addEmbed(embed);

  return ncChannelHook.send();
};

export const newItemsHookSend = async (embeds: Embed[]) => {
  const newItemsHook = process.env.NEW_ITEMS_WEBHOOK
    ? new Webhook(process.env.NEW_ITEMS_WEBHOOK)
    : null;

  if (!newItemsHook) return;

  newItemsHook.addEmbed([...embeds]);

  return newItemsHook.send();
};
