'use client';

import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { useServerInsertedHTML } from 'next/navigation';
import { useState, type ReactNode } from 'react';

type EmotionRegistryProps = {
  children: ReactNode;
};

export function EmotionRegistry({ children }: EmotionRegistryProps) {
  const [{ cache, flush }] = useState(() => {
    const emotionCache = createCache({ key: 'chakra', prepend: true });
    emotionCache.compat = true;

    const insert = emotionCache.insert.bind(emotionCache);
    let insertedNames: string[] = [];

    emotionCache.insert = (...args) => {
      const serialized = args[1];
      if (serialized && typeof serialized === 'object' && 'name' in serialized) {
        const name = serialized.name as string;
        if (emotionCache.inserted[name] === undefined) {
          insertedNames.push(name);
        }
      }
      return insert(...args);
    };

    const flushInserted = () => {
      const names = insertedNames;
      insertedNames = [];
      return names;
    };

    return { cache: emotionCache, flush: flushInserted };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) {
      return null;
    }

    let styles = '';
    for (const name of names) {
      const style = cache.inserted[name];
      if (typeof style === 'string') {
        styles += style;
      }
    }

    if (!styles) {
      return null;
    }

    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
