import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Our web app's Firebase configuration (example)
const firebaseConfig = {
  apiKey: "AIzaSyDMxgHwvMdjjj4pLNZVN8vjbm0qnTqvGNs",
  authDomain: "trends-sp25-lec8-eb1b9.firebaseapp.com",
  projectId: "trends-sp25-lec8-eb1b9",
  storageBucket: "trends-sp25-lec8-eb1b9.firebasestorage.app",
  messagingSenderId: "96464617525",
  appId: "1:96464617525:web:0505757bd4cc27a407b17c"
};
// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export const auth = getAuth();
