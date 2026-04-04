import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC9R3Q5GoNEmhE0nTimKcwpndCXT6R5n5M",
  authDomain: "healthconnect-ac27e.firebaseapp.com",
  projectId: "healthconnect-ac27e",
  storageBucket: "healthconnect-ac27e.firebasestorage.app",
  messagingSenderId: "504927241352",
  appId: "1:504927241352:web:ddef62a1eec08310754b3d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);