import { initializeApp } from './firestoreClient';
import { getAuth } from './firestoreClient';
import { getFirestore } from './firestoreClient';
import { getStorage } from './firestoreClient';

export const firebaseConfig = {
  projectId: "striking-yolk-zg02f",
  appId: "1:400327702315:web:f320698075c9fd1cdf776e",
  apiKey: "AIzaSyCVUoyosMgT4J7HSCiUwUoJfW9FtQ2uOyA",
  authDomain: "striking-yolk-zg02f.firebaseapp.com",
  storageBucket: "striking-yolk-zg02f.firebasestorage.app",
  messagingSenderId: "400327702315"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-77c53dd2-ef2c-45b2-81fb-7589e960e386");
export const auth = getAuth(app);
export const storage = getStorage(app);

