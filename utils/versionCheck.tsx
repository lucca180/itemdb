import useSWR from 'swr';
import { useEffect } from 'react';

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((r) => r.json());

export function useVersionCheck() {
  const { data } = useSWR('/api/build-id', fetcher, {
    refreshInterval: 60000, // 60s
    focusThrottleInterval: 60000, // 60s
    revalidateOnFocus: true,
    dedupingInterval: 10000,
  });

  useEffect(() => {
    if (!data?.buildId || data.buildId === 'development') return;

    const currentBuild = window.__NEXT_DATA__?.buildId;

    if (data.buildId !== currentBuild) {
      window.location.reload();
    }
  }, [data]);
}
