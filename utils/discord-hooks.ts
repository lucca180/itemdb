import webhook from 'webhook-discord';
import { getManyItems } from '../pages/api/v1/items/many';
import { ItemData } from '../types';
import prisma from './prisma';

const ncChannelHook = process.env.NC_CHANNEL_WEBHOOK
  ? new webhook.Webhook(process.env.NC_CHANNEL_WEBHOOK)
  : null;
const newItemsHook = process.env.NEW_ITEMS_WEBHOOK
  ? new webhook.Webhook(process.env.NEW_ITEMS_WEBHOOK)
  : null;

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

  const newItemsMsgs = Object.values(itemData)
    .filter((i) => !i.item_id || i.item_id > 85020)
    .map((i) => newItemsHookSend(i));

  await Promise.all([...ncMsgs, ...newItemsMsgs]);
};

const getItemEmbed = (item: ItemData) => {
  const embed = new webhook.MessageBuilder()
    .setAuthor('Item Novo!!!')
    .setName('itemdb')
    .setTitle(`${item.name} - r${item.rarity ?? '???'}`)
    .setColor(item.color.hex)
    .setThumbnail(item.image)
    .setDescription(item.description);

  if (item.isWearable) {
    embed.setImage('https://itemdb.com.br/api/cache/preview/' + item.image_id + '.png');
  }

  embed.setURL(`https://itemdb.com.br/item/${item.slug}`);

  return embed;
};

export const newNCMall = async (item: ItemData) => {
  if (!ncChannelHook) return;
  const embed = getItemEmbed(item);

  return ncChannelHook.send(embed);
};

export const newItemsHookSend = async (item: ItemData) => {
  if (!newItemsHook) return;
  const embed = getItemEmbed(item);

  return newItemsHook.send(embed);
};
