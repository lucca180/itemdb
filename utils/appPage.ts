import type { Metadata } from 'next';
import type { NextSeoProps } from 'next-seo';

export type ItemDbLocale = 'en' | 'pt';

type StaticAppPageOptions = {
  title: string;
  description?: string;
  pathname: `/${string}`;
  noindex?: boolean;
  nofollow?: boolean;
};

type StaticAppPageProps = {
  canonical: string;
  metadata: Metadata;
  seo: NextSeoProps;
};

export function getStaticAppPageProps(
  locale: string,
  options: StaticAppPageOptions
): StaticAppPageProps {
  const normalizedLocale = normalizeItemDbLocale(locale);
  const canonical = getItemDbCanonical(options.pathname, normalizedLocale);
  const noindex = options.noindex ?? false;
  const nofollow = options.nofollow ?? false;

  return {
    canonical,
    metadata: {
      title: options.title,
      description: options.description,
      alternates: {
        canonical,
      },
      robots: {
        index: !noindex,
        follow: !nofollow,
      },
    },
    seo: {
      title: options.title,
      description: options.description,
      canonical,
      noindex,
      nofollow,
    },
  };
}

export function normalizeItemDbLocale(locale: string): ItemDbLocale {
  return locale === 'pt' ? 'pt' : 'en';
}

export function getItemDbCanonical(pathname: `/${string}`, locale: ItemDbLocale) {
  return `https://itemdb.com.br${locale === 'pt' ? '/pt' : ''}${pathname}`;
}
