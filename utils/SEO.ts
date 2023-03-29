import { DefaultSeoProps } from 'next-seo';

const SEOConfig: DefaultSeoProps = {
  defaultTitle: 'itemdb - Open Source Neopets Item Database',
  titleTemplate: '%s | itemdb - Open Source Neopets Item Database',
  description:
    'Find all the data about Neopets items including the most updated prices, wearable previews, restock history, color search, and more! Create your item lists easily and share around Neopia!',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'http://itemdb.com.br/',
    siteName: 'itemdb',
  },
  twitter: {
    site: '@magnetismotimes',
    cardType: 'summary_large_image',
  },
};

export default SEOConfig;
