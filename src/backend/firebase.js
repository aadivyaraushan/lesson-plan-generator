// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import * as cors from "cors";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCGK3X4DuhjSiRdnsRP-YtjJT4w_u653x4",
  authDomain: "lesson-plan-generator-e877a.firebaseapp.com",
  projectId: "lesson-plan-generator-e877a",
  storageBucket: "lesson-plan-generator-e877a.appspot.com",
  messagingSenderId: "644340034732",
  appId: "1:644340034732:web:c885ce62e6166ea961c309",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const authentication = getAuth(app);

export { app, storage, authentication };
