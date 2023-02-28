// pages/_app.js
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../utils/theme';
import '../utils/global.css';
import { initializeApp } from 'firebase/app';
import { RecoilRoot } from 'recoil';
import Head from 'next/head';

const firebaseConfig = {
  apiKey: 'AIzaSyBt6150dQ4dqt2UXgLMjR7Nf92m5jMBcCw',
  authDomain: 'itemdb-1db58.firebaseapp.com',
  projectId: 'itemdb-1db58',
  storageBucket: 'itemdb-1db58.appspot.com',
  messagingSenderId: '1067484438627',
  appId: '1:1067484438627:web:b201beca216f17a76c9856',
};

initializeApp(firebaseConfig);

//eslint-disable-next-line @typescript-eslint/no-explicit-any
function MyApp({ Component, pageProps }: any) {
  return (
    <RecoilRoot>
      <ChakraProvider theme={theme}>
        <Head>
          <link rel="icon" href="/favicon.ico" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
          <title>itemdb - Open Source Neopets Item Database</title>
        </Head>
        <Component {...pageProps} />
      </ChakraProvider>
    </RecoilRoot>
  );
}

export default MyApp;
