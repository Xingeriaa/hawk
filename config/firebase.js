// firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Use the config you provided:
const firebaseConfig = {
  apiKey: "AIzaSyAJCdyl639uRYl6SZSfKb_tR_Tgyw2RV7Y",
  authDomain: "hawktuah-ea1ff.firebaseapp.com",
  projectId: "hawktuah-ea1ff",
  storageBucket: "hawktuah-ea1ff.appspot.com",
  messagingSenderId: "532137125065",
  appId: "1:532137125065:web:8fe097f18bd591822a5918",
  measurementId: "G-C2L449F0SQ"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, app };
