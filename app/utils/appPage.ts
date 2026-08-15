import type { Metadata } from 'next';
import type { NextSeoProps } from 'next-seo';
import { locale as getRootLocale } from 'next/root-params';
import { getPathname } from '@i18n/navigation';
import SEOConfig, { DEFAULT_OG_IMAGE, getDefaultSEO } from '@utils/SEO';

export type ItemDbLocale = 'en' | 'pt';

export function getDefaultOpenGraphImages() {
  return [
    {
      url: DEFAULT_OG_IMAGE.url,
      width: DEFAULT_OG_IMAGE.width,
      height: DEFAULT_OG_IMAGE.height,
      alt: DEFAULT_OG_IMAGE.alt,
    },
  ];
}

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
  const hreflang = buildItemDbHreflangAlternates(options.pathname);
  const noindex = options.noindex ?? false;
  const nofollow = options.nofollow ?? false;

  return {
    canonical,
    metadata: {
      title: options.title,
      description: options.description,
      alternates: {
        canonical,
        languages: hreflang.languages,
      },
      robots: {
        index: !noindex,
        follow: !nofollow,
      },
      openGraph: {
        type: 'website',
        url: canonical,
        title: options.title,
        description: options.description,
        images: getDefaultOpenGraphImages(),
      },
      twitter: {
        card: 'summary',
        title: options.title,
        description: options.description,
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

/** Convenience for App Router generateMetadata — locale via root params. */
export async function getStaticAppMetadata(options: StaticAppPageOptions): Promise<Metadata> {
  return getStaticAppPageProps(await getRootLocale(), options).metadata;
}

export function normalizeItemDbLocale(locale: string): ItemDbLocale {
  return locale === 'pt' ? 'pt' : 'en';
}

export function getItemDbCanonical(pathname: `/${string}`, locale: ItemDbLocale) {
  return `https://itemdb.com.br${getPathname({ locale, href: pathname })}`;
}

/** Site-wide App Router metadata defaults (mirrors Pages Router DefaultSeo). */
export function buildAppMetadataDefaults(locale?: string): Metadata {
  const defaultSeo = locale ? getDefaultSEO(locale) : SEOConfig;

  return {
    title: {
      default: defaultSeo.defaultTitle ?? 'itemdb - Neopets Item Database',
      template: defaultSeo.titleTemplate ?? '%s | itemdb - Neopets Item Database',
    },
    description: defaultSeo.description,
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/favicon.svg', type: 'image/svg+xml' },
      ],
    },
    openGraph: {
      type: 'website',
      siteName: defaultSeo.openGraph?.siteName,
      locale: defaultSeo.openGraph?.locale,
      images: getDefaultOpenGraphImages(),
    },
    twitter: {
      card: 'summary',
      site: defaultSeo.twitter?.site,
    },
  };
}

export function buildItemDbHreflangAlternates(pathname: `/${string}`) {
  const en = getItemDbCanonical(pathname, 'en');
  const pt = getItemDbCanonical(pathname, 'pt');

  return {
    canonical: en,
    languages: {
      en,
      pt,
      'x-default': en,
    },
  };
}
