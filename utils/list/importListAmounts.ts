import prisma from '@utils/prisma';

/**
 * Current amounts in `listId` for the given items, keyed by item `internal_id`.
 * Clones resolve through `canonical_id`, matching the row an import would write.
 * Items not in the list are absent from the map.
 */
export async function getImportListAmounts(
  listId: number,
  itemIids: number[]
): Promise<Map<number, number>> {
  const result = new Map<number, number>();
  const ids = [...new Set(itemIids)];
  if (!ids.length) return result;

  const canonicalRows = await prisma.items.findMany({
    where: { internal_id: { in: ids } },
    select: { internal_id: true, canonical_id: true },
  });
  const targetById = new Map(
    canonicalRows.map((row) => [row.internal_id, row.canonical_id ?? row.internal_id])
  );

  const listRows = await prisma.listItems.findMany({
    where: { list_id: listId, item_iid: { in: [...new Set(targetById.values())] } },
    select: { item_iid: true, amount: true },
  });
  const amountByIid = new Map(listRows.map((row) => [row.item_iid, row.amount]));

  for (const [id, target] of targetById) {
    const amount = amountByIid.get(target);
    if (amount !== undefined) result.set(id, amount);
  }

  return result;
}
