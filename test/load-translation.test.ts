import { describe, expect, it } from 'vitest';
import { loadTranslation } from '@utils/load-translation';

describe('loadTranslation', () => {
  it('loads supported locale files', async () => {
    const messages = await loadTranslation('en', 'search');
    expect(messages).toBeTypeOf('object');
    expect(Object.keys(messages).length).toBeGreaterThan(0);
  });

  it('falls back to default locale for invalid locale params', async () => {
    const messages = await loadTranslation('search', 'search');
    const defaultMessages = await loadTranslation('en', 'search');

    expect(messages).toEqual(defaultMessages);
  });
});
