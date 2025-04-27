import { loadTranslation as _loadTranslation } from '@utils/intlHandler';

// wanted to move this code to the intlHandler.ts but without updating EVERY import in the codebase
export const loadTranslation = (locale: string, relativePath: string) =>
  process.env.NODE_ENV === 'development'
    ? import(`../translation/${locale}.json`).then((res) => res.default)
    : _loadTranslation(locale, relativePath);
