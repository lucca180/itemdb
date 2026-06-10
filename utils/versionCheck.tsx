import useSWR from 'swr';
import { useEffect } from 'react';

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((r) => r.json());

export function useVersionCheck() {
  return; // disable during app router migration
  const currentBuild = typeof window !== 'undefined' ? window.__NEXT_DATA__?.buildId : undefined;
  const { data } = useSWR(currentBuild ? '/api/build-id' : null, fetcher, {
    refreshInterval: 60000, // 60s
    focusThrottleInterval: 60000, // 60s
    revalidateOnFocus: true,
    dedupingInterval: 10000,
  });

  useEffect(() => {
    if (!data?.buildId || data.buildId === 'development' || !currentBuild) return;

    if (data.buildId !== currentBuild) {
      const reloadedFor = sessionStorage.getItem('reloaded-for-build');

      if (reloadedFor === data.buildId) {
        console.error(
          `Version mismatch detected. Current build: ${currentBuild}, latest build: ${data.buildId}`
        );
        return;
      }

      console.warn('New version detected, reloading page');
      sessionStorage.setItem('reloaded-for-build', data.buildId);
      window.location.reload();
    }
  }, [data]);
}
