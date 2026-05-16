# App Router Migration Guide

This doc is the project-specific checklist for migrating `pages/` routes to the Next.js App Router in `app/`.

It follows the current itemdb pattern used by `/privacy` and `/terms`, and should be treated as the default approach for future static page migrations.

## Before you start

1. Initialize Next.js MCP tools first.
2. Read the relevant Next.js docs from `node_modules/next/dist/docs/`.
3. Inspect the existing `pages/<route>.tsx` implementation before changing anything.
4. Check whether an equivalent route already exists under `app/`.

Relevant Next.js docs used for this pattern:

- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md`

## Default migration pattern for static pages

Use this flow for static or mostly static content pages that currently live in the Pages Router.

1. Create `app/<route>/page.tsx`.
2. Keep `page.tsx` as a Server Component.
3. If the visual body is large or needs client-only behavior, move it to `app/<route>/<RouteName>PageClient.tsx` with `'use client'`.
4. Wrap the page in the existing [`Layout`](C:/Users/Lucca/itemdb/components/Layout.tsx).
5. Use [`getStaticAppPageProps`](C:/Users/Lucca/itemdb/utils/appPage.ts) to generate:
   - localized canonical URL
   - `generateMetadata()` output
   - `SEO` props for `Layout`
6. Prefer import aliases such as `@components/*` and `@utils/*`.
7. Remove the old `pages/<route>.tsx` only after the new app route is in place.
8. Update `proxy.ts` to point to the new app route.
9. Verify lint, types, and runtime behavior on all locales.

## Base example

```tsx
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import Layout from '@components/Layout';
import { getStaticAppPageProps } from '@utils/appPage';
import { ExamplePageClient } from './ExamplePageClient';

const description = 'Example description.';

const pageConfig = {
  title: 'Example',
  description,
  pathname: '/example',
  noindex: true,
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  return getStaticAppPageProps(locale, pageConfig).metadata;
}

export default async function ExamplePage() {
  const locale = await getLocale();
  const pageProps = getStaticAppPageProps(locale, pageConfig);

  return (
    <Layout disableNextSeo SEO={pageProps.seo} mainColor="#4A5568c7">
      <ExamplePageClient />
    </Layout>
  );
}
```

## When to keep content in `page.tsx`

You can keep everything in `page.tsx` when the page is small and does not need browser-only APIs, hooks that require a client component, or heavy interactive UI.

## When to extract a client component

Extract a `*PageClient.tsx` component when:

- the content is long and easier to maintain separately
- the page uses client-only hooks or browser APIs
- the page is mostly presentational and the server file should stay focused on route setup and metadata

## Metadata and SEO rules

For static migrations, prefer `generateMetadata()` plus `Layout` with `disableNextSeo`.

Use [`getStaticAppPageProps`](C:/Users/Lucca/itemdb/utils/appPage.ts) unless the route has a genuinely different metadata shape.

## Locale and canonical rules

Canonical URLs should follow this site rule:

- English: `https://itemdb.com.br/<route>`
- Portuguese: `https://itemdb.com.br/pt/<route>`

Do not duplicate this logic in each page. Reuse the shared helper.

## Validation checklist

After each migration:

1. Run `yarn lint`
2. Run `yarn typecheck`
3. Check the route with Next.js MCP runtime tools
4. Confirm the route moved from `pagesRouter` to `appRouter`
5. Check for session/runtime errors on every locale

## Notes for future migrations

- Do not change `package.json`, `tsconfig.json`, `next.config.ts`, or other project config files without explicit user confirmation.
- If a stale `.next/types` reference blocks typecheck after deleting a `pages/` route, clear the generated type output and rerun typecheck.
