import { getAuth } from 'firebase/auth';
import { app } from './app';

// Export initialized Firestore "auth"
export const auth = getAuth(app);

//Export just what you need
export { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

export type { User } from 'firebase/auth';
