import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Our web app's Firebase configuration (example)
const firebaseConfig = {
  apiKey: "AIzaSyDh8P3MP012iezI7moLr9IooWyRvBmFDVg",
  authDomain: "trends-sp25-lec8-test.firebaseapp.com",
  projectId: "trends-sp25-lec8-test",
  storageBucket: "trends-sp25-lec8-test.firebasestorage.app",
  messagingSenderId: "14252358306",
  appId: "1:14252358306:web:92de6f8a2977d0cac9b5fb"
};
// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export const auth = getAuth();
