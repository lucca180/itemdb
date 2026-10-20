import { describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('resend', () => ({ Resend: vi.fn() }));
vi.mock('@pages/api/v1/items/[id_name]', () => ({ getItem: vi.fn() }));

import { pageRefLink } from '@services/feedback/feedbackNotify';

describe('pageRefLink', () => {
  test('links relative paths to the site', () => {
    expect(pageRefLink('/item/blue-grundo-plushie')).toBe(
      '<a href="https://itemdb.com.br/item/blue-grundo-plushie">/item/blue-grundo-plushie</a>'
    );
  });

  test('keeps absolute http(s) urls', () => {
    expect(pageRefLink('https://itemdb.com.br/lists/foo?x=1')).toBe(
      '<a href="https://itemdb.com.br/lists/foo?x=1">https://itemdb.com.br/lists/foo?x=1</a>'
    );
  });

  test('never links other protocols and escapes html', () => {
    expect(pageRefLink('javascript:alert(1)')).toBe('javascript:alert(1)');
    expect(pageRefLink('/x"><script>')).toBe(
      '<a href="https://itemdb.com.br/x%22%3E%3Cscript%3E">/x&quot;&gt;&lt;script&gt;</a>'
    );
  });

  test('handles missing values', () => {
    expect(pageRefLink(undefined)).toBe('n/a');
    expect(pageRefLink('')).toBe('n/a');
  });
});
