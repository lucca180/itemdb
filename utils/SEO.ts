import { DefaultSeoProps } from 'next-seo';

const SEOConfig: DefaultSeoProps = {
  defaultTitle: 'itemdb - Neopets Item Database',
  titleTemplate: '%s | itemdb - Neopets Item Database',
  description:
    'Neopets Item Database: discover updated prices, wearable previews, restock history, color search, capsule drop rates, and create your own item lists.',
  openGraph: {
    type: 'website',
    images: [
      { url: 'https://itemdb.com.br/logo_icon.png', width: 128, height: 128, alt: 'itemdb logo' },
    ],
    url: 'https://itemdb.com.br/',
    siteName: 'itemdb - Neopets Item Database',
  },
  twitter: {
    site: '@magnetismotimes',
    cardType: 'summary',
  },
};

export const getDefaultSEO = (locale: string): DefaultSeoProps => ({
  ...SEOConfig,
  description:
    locale === 'pt'
      ? 'Explore itens do Neopets: preços atualizados, prévias de roupas, histórico de restock, busca por cores e mais. Crie, salve e compartilhe listas em Neopia!'
      : SEOConfig.description,
  openGraph: {
    ...SEOConfig.openGraph,
    locale: locale === 'pt' ? 'pt_BR' : 'en_US',
  },
});

export default SEOConfig;
