import { ChakraProvider } from '@chakra-ui/react';
import theme from '../utils/theme';
import '../utils/global.css';
import { Provider } from 'jotai';
import { DefaultSeo } from 'next-seo';
import SEOConfig from '../utils/SEO';
import NextNProgress from 'nextjs-progressbar';
import Script from 'next/script';
import { AuthProvider } from '../utils/auth';
import { NextIntlClientProvider } from 'next-intl';
import { useRouter } from 'next/router';
import type { AppProps } from 'next/app';

// const VALID_LOCALES = {
//   en: '',
//   pt: '/pt',
//   'pt-BR': '/pt',
// };

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <ChakraProvider theme={theme}>
      <Provider>
        <AuthProvider>
          <NextIntlClientProvider
            locale={router.locale}
            messages={pageProps.messages}
            timeZone={'America/Los_Angeles'}
            now={new Date()}
          >
            <NextNProgress color="#718096" showOnShallow={true} />
            <DefaultSeo {...SEOConfig} />
            <Component {...pageProps} />
            <Script id="pathOverwriter">
              {`function myPathOverwriter({ path }) {
                  if (path.startsWith("/pt")) path = path.replace("/pt", "");
                  return path;
                }
                `}
            </Script>
            <Script
              data-path-overwriter="myPathOverwriter"
              src="https://sa.itemdb.com.br/latest.js"
            />
            <noscript>
              {/* eslint-disable @next/next/no-img-element */}
              <img
                src="https://sa.itemdb.com.br/noscript.gif"
                alt=""
                referrerPolicy="no-referrer-when-downgrade"
              />
            </noscript>
          </NextIntlClientProvider>
        </AuthProvider>
      </Provider>
    </ChakraProvider>
  );
}

export default MyApp;
