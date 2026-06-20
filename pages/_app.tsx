import { ChakraProvider } from '@chakra-ui/react';
import '../utils/global.css';
import { Provider } from 'jotai';
import { DefaultSeo } from 'next-seo';
import { getDefaultSEO } from '../utils/SEO';
import NextNProgress from 'nextjs-progressbar';
import Script from 'next/script';
import { AuthProvider } from '../utils/auth';
import { NextIntlClientProvider } from 'next-intl';
import { useRouter } from 'next/router';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import type { NextPage } from 'next';
import { onIntlError } from '../utils/intlHandler';
import { installProofInterceptor } from '@utils/api/proofInterceptor';
import { getLocalizedHref, VALID_LOCALES, type AppLocale } from '@utils/locales';
import { system } from '@utils/theme/theme';
import { Toaster } from '@components/ui/toaster';

if (typeof window !== 'undefined') {
  installProofInterceptor();
}

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: React.ReactElement, props: P) => React.ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const router = useRouter();
  const locale =
    (typeof pageProps.locale === 'string' ? pageProps.locale : undefined) ??
    (typeof router.query.locale === 'string' ? router.query.locale : undefined) ??
    'en';
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <ChakraProvider value={system}>
      <Provider>
        <AuthProvider>
          <NextIntlClientProvider
            locale={locale}
            messages={pageProps.messages}
            timeZone={'America/Los_Angeles'}
            now={new Date()}
            onError={(e) => onIntlError(e, { path: router.asPath })}
          >
            <Head>
              {VALID_LOCALES.map((alternateLocale) => (
                <link
                  rel="alternate"
                  key={alternateLocale}
                  hrefLang={alternateLocale}
                  href={removeUTM(
                    `https://itemdb.com.br${getLocalizedHref(router.asPath, alternateLocale as AppLocale)}`
                  )}
                />
              ))}
            </Head>
            <NextNProgress color="#718096" showOnShallow={true} />
            <DefaultSeo {...getDefaultSEO(locale)} />
            {getLayout(<Component {...pageProps} />, pageProps)}
            <Toaster />
            <Script
              src={process.env.NEXT_PUBLIC_UMAMI_URL_2 + '/plutonita.js'}
              data-website-id={process.env.NEXT_PUBLIC_UMAMI_ID_2}
              data-host-url={process.env.NEXT_PUBLIC_UMAMI_URL_2}
              data-before-send="beforeSendHandler"
              data-performance="true"
              defer
            />
            <Script id="pathOverwriter">
              {`function beforeSendHandler(type, payload) {
                    const url = payload.url;
                    if(['es', 'pt'].includes(url.split("/")[3])) {
                      payload.url = url.replace("/pt", "");
                    }

                    return payload;
                }`}
            </Script>
          </NextIntlClientProvider>
        </AuthProvider>
      </Provider>
    </ChakraProvider>
  );
}

export default MyApp;

function removeUTM(url: string) {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

    utmParams.forEach((param) => params.delete(param));

    return urlObj.origin + urlObj.pathname + (params.toString() ? '?' + params.toString() : '');
  } catch (error) {
    return url;
  }
}
