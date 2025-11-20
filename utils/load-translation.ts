import fs from 'fs';
import path from 'path';

const treeShakeExists = () => {
  return fs.existsSync(path.resolve(process.cwd(), 'translation/tree-shake/'));
};

// wanted to move this code to the intlHandler.ts but without updating EVERY import in the codebase
export const loadTranslation = (locale: string, relativePath: string) => {
  return process.env.NODE_ENV === 'development' || !treeShakeExists()
    ? import(`../translation/${locale}.json`).then((res) => res.default)
    : _loadTranslation(locale, relativePath);
};

const _loadTranslation = async (locale: string, relativePath: string) => {
  if (!locale) locale = 'en';

  let translations: {
    [namespace: string]: { [key: string]: string };
  } = {};

  let treeshake: {
    keys: string[];
    namespaces: string[];
  } = {
    keys: [],
    namespaces: [],
  };
  if (process.env.NODE_ENV === 'development') return;
  try {
    [translations, treeshake] = (await Promise.all([
      import(`../translation/${locale}.json`),
      import(`../translation/tree-shake/${relativePath}.json`),
    ])) as [
      {
        [namespace: string]: { [key: string]: string };
      },
      {
        keys: string[];
        namespaces: string[];
      },
    ];

    if (!relativePath) return translations;

    const result = {} as {
      [namespace: string]: { [key: string]: string };
    };

    treeshake.namespaces.forEach((namespace) => {
      if (!translations[namespace]) {
        console.error('Missing namespace', namespace, 'in translation file', locale);
        return;
      }
      result[namespace] = translations[namespace];
    });

    treeshake.keys.forEach((key) => {
      if (key === '[DYNAMIC_KEY]') return;

      const [namespace, ...rest] = key.split('.');

      if (treeshake.namespaces.includes(namespace)) return;

      const translation = translations[namespace]?.[rest.join('.')];

      if (translation) {
        result[namespace] = {
          ...result[namespace],
          [rest.join('.')]: translation,
        };
      }
    });
    return result;
  } catch (e) {
    console.error('⚠️ Using default file for ', relativePath);
    return translations;
  }
};
