import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AppServerLayout from '@components/Layout/AppServerLayout';
import { NotFoundContent } from '@components/Error/NotFoundContent';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t('Error.page-not-found'),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function NotFound() {
  return (
    <AppServerLayout mainColor="#ff6464c7">
      <NotFoundContent />
    </AppServerLayout>
  );
}
