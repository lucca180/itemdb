import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { TermsPageClient } from './TermsPageClient';
import { routing } from '@utils/locales';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';

const description = 'This page outlines the terms of use for itemdb, its features, and API.';
const pageConfig = {
  title: 'Terms of Use',
  description,
  pathname: '/terms',
  noindex: true,
  nofollow: true,
} as const;

export async function generateMetadata(): Promise<Metadata> {
  return await getStaticAppMetadata(pageConfig);
}

export default function TermsPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <TermsPageContent />
    </Suspense>
  );
}

async function TermsPageContent() {
  return (
    <>
      <SetMainColor color="#a5aa9fc7" />
      <TermsPageClient />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
