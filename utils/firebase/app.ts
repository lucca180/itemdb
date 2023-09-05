import { initializeApp, getApp, getApps } from 'firebase/app';

const isProd = process.env.NODE_ENV === 'production';

const firebaseConfig = {
  apiKey: isProd
    ? process.env.NEXT_PUBLIC_FIREBASE_KEY_PROD
    : process.env.NEXT_PUBLIC_FIREBASE_KEY_DEV,
  authDomain: 'itemdb-1db58.firebaseapp.com',
  projectId: 'itemdb-1db58',
  storageBucket: 'itemdb-1db58.appspot.com',
  messagingSenderId: '1067484438627',
  appId: '1:1067484438627:web:b201beca216f17a76c9856',
};

const setupFirebase = () => {
  if (getApps.length) return getApp();
  return initializeApp(firebaseConfig);
};

export const app = setupFirebase();
