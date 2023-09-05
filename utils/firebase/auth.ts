import {
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth';
import { app } from './app';

// Export initialized Firestore "auth"
// export const auth = getAuth(app);

// https://github.com/firebase/firebase-js-sdk/issues/4946
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
});

//Export just what you need
export { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
