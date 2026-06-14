import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { setRequestLocale } from 'next-intl/server';
import { buildLoginPageProps } from './buildLoginPageProps';
import { LoginPageClient } from './LoginPageClient';

const mainColor = '#4A5568c7';

type LoginPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    redirect?: string;
    token?: string;
    email?: string;
  }>;
};

export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  return getStaticAppPageProps(locale, {
    title: 'Login',
    pathname: '/login',
    noindex: true,
  }).metadata;
}

export default function LoginPage({ params, searchParams }: LoginPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <LoginPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginPageContent({ params, searchParams }: LoginPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const labels = await buildLoginPageProps();

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <LoginPageClient
        labels={labels}
        redirectTo={query.redirect}
        token={query.token}
        emailFromQuery={query.email}
      />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
