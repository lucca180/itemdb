import { Html, Head, Main, NextScript, DocumentProps, DocumentContext } from 'next/document';
import Document from 'next/document';
import { resolvePageLocale } from '@utils/locales';

type ItemDbDocumentProps = DocumentProps & {
  locale: string;
};

export default function ItemDbDocument(props: ItemDbDocumentProps) {
  return (
    <Html lang={props.locale} className="dark" data-theme="dark" suppressHydrationWarning>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

ItemDbDocument.getInitialProps = async (ctx: DocumentContext) => {
  const initialProps = await Document.getInitialProps(ctx);
  const locale = resolvePageLocale(
    typeof ctx.query?.locale === 'string' ? ctx.query.locale : undefined
  );

  return {
    ...initialProps,
    locale,
  };
};
