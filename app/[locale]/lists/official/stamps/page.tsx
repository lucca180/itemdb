import type { Metadata } from 'next';
import {
  generateOfficialCategoryMetadata,
  OfficialCategoryRoute,
  officialCategoryStaticParams,
} from '@app/[locale]/lists/official/_components/OfficialCategoryPage';

// Category config: app/[locale]/lists/official/_categories (slug must match this folder).
const SLUG = 'stamps';

export function generateMetadata(): Promise<Metadata> {
  return generateOfficialCategoryMetadata(SLUG);
}

export default function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <OfficialCategoryRoute slug={SLUG} params={params} />;
}

export const generateStaticParams = officialCategoryStaticParams;
