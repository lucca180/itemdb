import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { isItemQuotaRoute } from '@utils/api/itemQuotaRoutes';

const QUOTA_CALL_PATTERNS = [/redis_setDataCount\s*\(/, /trackItemQuota\s*\(/];

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (entry === 'node_modules' || entry === 'generated' || entry === '_dev') continue;
      walk(path, files);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(path);
    }
  }
  return files;
}

/** Map a route handler file to a sample API pathname for blocklist matching. */
function fileToApiPath(rel: string): string | null {
  let path = rel.replace(/\\/g, '/');

  if (path.startsWith('pages/api/')) {
    path = '/' + path.slice('pages/'.length);
  } else if (path.startsWith('app/api/')) {
    path = '/' + path.slice('app/'.length);
  } else {
    return null;
  }

  path = path.replace(/\.(ts|tsx)$/, '');
  path = path.replace(/\/route$/, '');
  path = path.replace(/\/index$/, '');
  path = path.replace(/\[(?:\.\.\.)?[^\]]+\]/g, '_');

  return path;
}

function isCoveredByBlocklist(pathname: string): boolean {
  return isItemQuotaRoute('GET', pathname) || isItemQuotaRoute('POST', pathname);
}

describe('item quota routes guard', () => {
  it('requires every redis_setDataCount / trackItemQuota call site on the blocklist', () => {
    const root = process.cwd();
    const scanRoots = ['pages/api', 'app/api']
      .map((dir) => join(root, dir))
      .filter((dir) => existsSync(dir));

    const uncovered: string[] = [];

    for (const dir of scanRoots) {
      for (const file of walk(dir)) {
        const rel = relative(root, file).replace(/\\/g, '/');
        const content = readFileSync(file, 'utf8');

        const callsQuota = QUOTA_CALL_PATTERNS.some((pattern) => pattern.test(content));
        if (!callsQuota) continue;

        const apiPath = fileToApiPath(rel);
        if (!apiPath) {
          uncovered.push(`${rel} → could not derive API path`);
          continue;
        }

        if (!isCoveredByBlocklist(apiPath)) {
          uncovered.push(
            `${rel} calls item quota but ${apiPath} is not on ITEM_QUOTA_ROUTES (utils/api/itemQuotaRoutes.ts)`
          );
        }
      }
    }

    expect(uncovered).toEqual([]);
  });
});
