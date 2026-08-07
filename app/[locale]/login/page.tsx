import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
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

export async function generateMetadata(): Promise<Metadata> {
  return await getStaticAppMetadata({
    title: 'Login',
    pathname: '/login',
    noindex: true,
  });
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <LoginPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginPageContent({ searchParams }: Pick<LoginPageProps, 'searchParams'>) {
  const query = await searchParams;
  const labels = await buildLoginPageProps();

  return (
    <>
      <SetMainColor color={mainColor} />
      <LoginPageClient
        labels={labels}
        redirectTo={query.redirect}
        token={query.token}
        emailFromQuery={query.email}
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
