import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  getLocalizedHref,
  getLocalizedLoginRedirect,
  getLocalePrefix,
  getPageRouterBasePath,
  getPageRouterHref,
  getPageRouterLocale,
  isValidLocale,
  localizeInternalHref,
  resolvePageLocale,
  withLocalePrefix,
} from '@utils/locales';

describe('i18n routing helpers', () => {
  it('validates supported locales', () => {
    expect(isValidLocale('en')).toBe(true);
    expect(isValidLocale('pt')).toBe(true);
    expect(isValidLocale('de')).toBe(false);
    expect(isValidLocale(undefined)).toBe(false);
  });

  it('resolves invalid page locales to default', () => {
    expect(resolvePageLocale('pt')).toBe('pt');
    expect(resolvePageLocale('xx')).toBe(DEFAULT_LOCALE);
  });

  it('uses as-needed locale prefixes', () => {
    expect(getLocalePrefix('en')).toBe('');
    expect(getLocalePrefix('pt')).toBe('/pt');
    expect(withLocalePrefix('/faq', 'en')).toBe('/faq');
    expect(withLocalePrefix('/faq', 'pt')).toBe('/pt/faq');
    expect(withLocalePrefix('/', 'pt')).toBe('/pt');
  });

  it('builds localized hrefs from localized paths', () => {
    expect(getLocalizedHref('/faq', 'pt')).toBe('/pt/faq');
    expect(getLocalizedHref('/pt/faq?tab=1', 'en')).toBe('/faq?tab=1');
    expect(getLocalizedHref('/pt/faq', 'pt')).toBe('/pt/faq');
    expect(getLocalizedHref('/pt/faq', 'en')).toBe('/faq');
  });

  it('localizes internal hrefs and skips external or api paths', () => {
    expect(localizeInternalHref('/item/foo', 'pt')).toBe('/pt/item/foo');
    expect(localizeInternalHref('/item/foo', 'en')).toBe('/item/foo');
    expect(localizeInternalHref('https://example.com', 'pt')).toBe('https://example.com');
    expect(localizeInternalHref('/api/v1/items', 'pt')).toBe('/api/v1/items');
    expect(localizeInternalHref('/faq', 'pt', { isExternal: true })).toBe('/faq');
  });

  it('builds localized login redirects', () => {
    expect(getLocalizedLoginRedirect('en', '/admin/createItem')).toBe(
      '/login?redirect=%2Fadmin%2FcreateItem'
    );
    expect(getLocalizedLoginRedirect('pt', '/pt/admin/createItem')).toBe(
      '/pt/login?redirect=%2Fpt%2Fadmin%2FcreateItem'
    );
  });

  it('builds canonical URL paths', () => {
    expect(`https://itemdb.com.br${withLocalePrefix('/privacy', 'en')}`).toBe(
      'https://itemdb.com.br/privacy'
    );
    expect(`https://itemdb.com.br${withLocalePrefix('/privacy', 'pt')}`).toBe(
      'https://itemdb.com.br/pt/privacy'
    );
  });

  it('builds page router hrefs from locale param', () => {
    const router = {
      asPath: '/pt/search?s=%23143CCC&sortBy=color',
      query: { locale: 'pt', s: '#143CCC', sortBy: 'color' },
    };

    expect(getPageRouterLocale(router)).toBe('pt');
    expect(getPageRouterBasePath(router)).toBe('/pt/search');
    expect(getPageRouterHref(router, '/search?s=%23143CCC&sortBy=color')).toBe(
      '/pt/search?s=%23143CCC&sortBy=color'
    );
    expect(getPageRouterHref(router, '/tools/rainbow-pool/acara/')).toBe(
      '/pt/tools/rainbow-pool/acara/'
    );
  });
});
