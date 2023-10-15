import { DefaultSeoProps } from 'next-seo';

const SEOConfig: DefaultSeoProps = {
  defaultTitle: 'itemdb - Neopets Item Database',
  titleTemplate: '%s | itemdb - Neopets Item Database',
  description:
    'Find all the data about Neopets items including the most updated prices, wearable previews, restock history, color search, mystery capsule drop rates, and more! Create your item lists easily and share around Neopia!',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    images: [
      { url: 'https://itemdb.com.br/logo_icon.png', width: 128, height: 128, alt: 'itemdb logo' },
    ],
    url: 'http://itemdb.com.br/',
    siteName: 'itemdb',
  },
  twitter: {
    site: '@magnetismotimes',
    cardType: 'summary',
  },
};

export default SEOConfig;
