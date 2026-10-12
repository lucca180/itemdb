'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

// Replaces the root layout when it fails, so it can't rely on providers, Chakra or translations.
export default function GlobalError({ error, retry }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" data-theme="dark">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '32px',
          textAlign: 'center',
          background: '#1A202C',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <title>Something went wrong | itemdb - Neopets Item Database</title>
        <meta name="robots" content="noindex" />
        <h1 style={{ fontSize: '1.75rem', margin: '0 0 12px' }}>Something went wrong :(</h1>
        <img
          src="https://images.neopets.com/homepage/maint/images/bottombg_maintenance_mobile.png"
          alt="meepits maintenance"
          style={{ maxWidth: '100%', borderRadius: '6px' }}
        />
        <p style={{ margin: 0 }}>
          This error has been reported and our meepits will be working on it as soon as possible.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            marginTop: '8px',
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            background: '#4A5568',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
