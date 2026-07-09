import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAOJrb18nVmKqI0aPbwq5OLbvalEY6D424",
  authDomain: "pascalassessment.firebaseapp.com",
  projectId: "pascalassessment",
  storageBucket: "pascalassessment.firebasestorage.app",
  messagingSenderId: "917674823671",
  appId: "1:917674823671:web:64045bfeb47a15d93aa8f2",
  measurementId: "G-G56997GKWN"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
