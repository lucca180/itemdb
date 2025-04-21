export const loadTranslation = async (locale: string, relativePath: string) => {
  if (!locale) locale = 'en';
  const translations = (await import(`../translation/${locale}.json`)).default as {
    [namespace: string]: { [key: string]: string };
  };

  try {
    const treeshake = (await import(`../translation/tree-shake/${relativePath}.json`)).default as {
      keys: string[];
      namespaces: string[];
    };

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
