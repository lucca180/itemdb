import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { PrivacyPageClient } from './PrivacyPageClient';
import { routing } from '@utils/locales';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';

const description =
  'itemdb collects some personal data during its use. Here we will detail more about how we collect, process, and use your data.';
const pageConfig = {
  title: 'Privacy Policy',
  description,
  pathname: '/privacy',
  noindex: true,
  nofollow: true,
} as const;

export async function generateMetadata(): Promise<Metadata> {
  return await getStaticAppMetadata(pageConfig);
}

export default function PrivacyPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <PrivacyPageContent />
    </Suspense>
  );
}

async function PrivacyPageContent() {
  return (
    <>
      <SetMainColor color="#7AB92Ac7" />
      <PrivacyPageClient />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
