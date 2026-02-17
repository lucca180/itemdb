// pages/_document.js

import { ColorModeScript } from '@chakra-ui/react';
import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
  DocumentProps,
} from 'next/document';
interface MyDocumentProps extends DocumentProps {
  jwt?: string;
}

export default class MyDocument extends Document<MyDocumentProps> {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);

    let jwt: string | undefined;

    if (ctx.req) {
      const header = ctx.req.headers['x-itemdb-proof'];
      if (typeof header === 'string') {
        jwt = header;
      }
    }

    return {
      ...initialProps,
      jwt,
    };
  }

  render() {
    const { jwt, locale } = this.props;

    return (
      <Html lang={locale ?? 'en'}>
        <Head>
          {jwt && <meta name="site-proof" content={jwt} />}
          <link rel="icon" href="/favicon.ico" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        </Head>
        <body>
          <ColorModeScript initialColorMode="dark" />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
