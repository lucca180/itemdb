import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const WRITE_ALLOWLIST = new Set(['services/list/listItemsWrite.ts', 'services/list/listCount.ts']);

const INTERNAL_IMPORT_ALLOWLIST = new Set(['services/ListService.ts']);

const WRITE_PATTERNS = [
  /prisma\.listItems\.(create|update|delete|upsert|createMany|deleteMany|updateMany)/,
  /INSERT INTO ListItems/i,
];

const INTERNAL_IMPORT_PATTERN = /@services\/list\//;

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

describe('listItemsWrite guard', () => {
  it('forbids direct ListItems writes outside allowlist', () => {
    const root = process.cwd();
    const scanRoots = ['pages', 'services', 'app']
      .map((dir) => join(root, dir))
      .filter((dir) => existsSync(dir));

    const violations: string[] = [];

    for (const dir of scanRoots) {
      for (const file of walk(dir)) {
        const rel = relative(root, file).replace(/\\/g, '/');
        if (WRITE_ALLOWLIST.has(rel)) continue;

        const content = readFileSync(file, 'utf8');
        for (const pattern of WRITE_PATTERNS) {
          if (pattern.test(content)) {
            violations.push(`${rel} matches ${pattern}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('forbids importing @services/list outside ListService', () => {
    const root = process.cwd();
    const scanRoots = ['pages', 'services', 'app', 'test']
      .map((dir) => join(root, dir))
      .filter((dir) => existsSync(dir));

    const violations: string[] = [];

    for (const dir of scanRoots) {
      for (const file of walk(dir)) {
        const rel = relative(root, file).replace(/\\/g, '/');
        if (INTERNAL_IMPORT_ALLOWLIST.has(rel)) continue;
        if (rel.startsWith('services/list/')) continue;
        if (rel.startsWith('test/list')) continue;

        const content = readFileSync(file, 'utf8');
        if (INTERNAL_IMPORT_PATTERN.test(content)) {
          violations.push(`${rel} imports @services/list`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
