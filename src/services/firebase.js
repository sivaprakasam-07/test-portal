// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDWQMjC_MSYJ5tVC0bJQ97hGOVQ55RcBUc",
  authDomain: "testportal0.firebaseapp.com",
  projectId: "testportal0",
  storageBucket: "testportal0.firebasestorage.app",
  messagingSenderId: "863941135707",
  appId: "1:863941135707:web:18a2bdd320e45534799e7e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };