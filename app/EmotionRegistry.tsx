'use client';

import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { useServerInsertedHTML } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { prefixer } from 'stylis';

// Emotion's server build memoizes compiled CSS per `stylisPlugins` array in a module-level cache
// that never evicts, so with the default array every unique style stays in memory forever.
// Swapping the array every N registries lets the old cache be collected. Counting (not Date.now)
// keeps prerendering free of current-time reads.
const STYLIS_CACHE_ROTATE_EVERY = 5_000;
let stylisPlugins = [prefixer];
let registriesSinceRotate = 0;

function getStylisPlugins() {
  if (++registriesSinceRotate > STYLIS_CACHE_ROTATE_EVERY) {
    stylisPlugins = [prefixer];
    registriesSinceRotate = 0;
  }
  return stylisPlugins;
}

type EmotionRegistryProps = {
  children: ReactNode;
};

export function EmotionRegistry({ children }: EmotionRegistryProps) {
  const [{ cache, flush }] = useState(() => {
    const emotionCache = createCache({
      key: 'chakra',
      prepend: true,
      stylisPlugins: getStylisPlugins(),
    });
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
