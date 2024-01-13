// pages/_document.js

import { ColorModeScript } from '@chakra-ui/react';
import { Html, Head, Main, NextScript, DocumentProps } from 'next/document';

export default function Document(props: DocumentProps) {
  return (
    <Html lang={props.locale}>
      <Head />
      <body>
        <ColorModeScript initialColorMode="dark" />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
