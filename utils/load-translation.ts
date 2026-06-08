import { resolvePageLocale } from '@utils/locales';

// wanted to move this code to the intlHandler.ts but without updating EVERY import in the codebase
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const loadTranslation = (locale: string, _relativePath: string, _isApp = false) => {
  const resolvedLocale = resolvePageLocale(locale);
  return import(`../translation/${resolvedLocale}.json`).then((res) => res.default);
};
