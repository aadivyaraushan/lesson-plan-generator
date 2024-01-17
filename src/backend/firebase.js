// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';
import * as cors from 'cors';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG);

// Initialize Firebase
let analytics;
let storage;
let authentication;
let app;
let db;
if (firebaseConfig?.projectId) {
  app = initializeApp(firebaseConfig);
  storage = getStorage(app);
  authentication = getAuth(app);
  db = getFirestore(app);

  if (app.name && typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
}

export { app, storage, authentication, analytics, db };
