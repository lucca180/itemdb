import { ChakraProvider } from '@chakra-ui/react';
import theme from '../utils/theme';
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

const VALID_LOCALES = {
  en: '',
  pt: '/pt',
};

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: React.ReactElement, props: P) => React.ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const router = useRouter();
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <ChakraProvider theme={theme}>
      <Provider>
        <AuthProvider>
          <NextIntlClientProvider
            locale={router.locale}
            messages={pageProps.messages}
            timeZone={'America/Los_Angeles'}
            now={new Date()}
            onError={onIntlError}
          >
            <Head>
              {Object.entries(VALID_LOCALES).map(([key, value]) => (
                <link
                  rel="alternate"
                  key={key}
                  hrefLang={key}
                  href={removeUTM(`https://itemdb.com.br${value}${router.asPath}`)}
                />
              ))}
            </Head>
            <NextNProgress color="#718096" showOnShallow={true} />
            <DefaultSeo {...getDefaultSEO(router.locale ?? 'en')} />
            {getLayout(<Component {...pageProps} />, pageProps)}
            <Script
              src={'/plutonita.js?v=1.0.0'}
              data-website-id={process.env.NEXT_PUBLIC_UMAMI_ID}
              data-host-url={'https://umami.itemdb.com.br'}
              data-url-overwrite="unamiOverwriter"
              defer
            />
            <Script id="pathOverwriter2">
              {`function unamiOverwriter(path) {
                  if (path.startsWith("/pt")) path = path.replace("/pt", "");
                  return path;
                }
                `}
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
