import { existsSync, readFileSync } from 'node:fs';

export const NGINX_ACTIVE_CONF =
  process.env.NGINX_ACTIVE_BACKEND_CONF ?? '/etc/nginx/snippets/itemdb-active-backend.conf';

export type ActiveBackend = {
  app: 'itemdb-web' | 'itemdb-green';
  port: 4000 | 4001;
  cwd: string;
};

const BY_PORT: Record<4000 | 4001, ActiveBackend> = {
  4000: { app: 'itemdb-web', port: 4000, cwd: '/home/itemdb' },
  4001: { app: 'itemdb-green', port: 4001, cwd: '/home/itemdb-green' },
};

export function parsePort(snippet: string): 4000 | 4001 {
  const port = Number.parseInt(snippet.match(/127\.0\.0\.1:(\d+)/)?.[1] ?? '', 10);
  if (port !== 4000 && port !== 4001) throw new Error(`Unsupported backend port: ${port}`);
  return port;
}

export function resolveActiveBackend(confPath = NGINX_ACTIVE_CONF): ActiveBackend {
  if (!existsSync(confPath)) {
    if (process.env.NODE_ENV === 'development') return BY_PORT[4000];
    throw new Error(`Nginx snippet not found: ${confPath}`);
  }
  return BY_PORT[parsePort(readFileSync(confPath, 'utf8'))];
}
