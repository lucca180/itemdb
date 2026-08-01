import { describe, expect, test } from 'vitest';
import { buildItemProcessRows } from '@utils/item/enqueueItemProcess';

describe('buildItemProcessRows', () => {
  test('normalizes style-like NC wearable payload', () => {
    const rows = buildItemProcessRows(
      [
        {
          itemId: 87461,
          name: 'Nostalgic Royalboy Acara',
          img: 'https://images.neopets.com/items/nostalgic_royalboy_acara.gif',
          rarity: 500,
          estVal: 0,
          weight: 1,
          subText: '(wearable)',
          category: 'Special',
          type: 'nc',
        },
      ],
      {
        language: 'en',
        meta: { dataSource: 'styles-sync', itemdbVersion: 'styles-sync' },
      }
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      item_id: 87461,
      name: 'Nostalgic Royalboy Acara',
      image_id: 'nostalgic_royalboy_acara',
      isNC: true,
      isWearable: true,
      rarity: 500,
      language: 'en',
    });
    expect(rows[0].hash).toBeTruthy();
  });

  test('skips invalid images and empty names', () => {
    const rows = buildItemProcessRows([
      {
        name: '',
        img: 'https://images.neopets.com/items/foo.gif',
      },
      {
        name: 'Bad Host',
        img: 'https://example.com/foo.gif',
      },
    ]);

    expect(rows).toHaveLength(0);
  });
});
