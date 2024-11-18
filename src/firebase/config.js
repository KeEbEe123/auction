import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBI_00uWq7cetEgI7bh-XAj3EiRBsHHsoY",
  authDomain: "auction-51bee.firebaseapp.com",
  projectId: "auction-51bee",
  storageBucket: "auction-51bee.firebasestorage.app",
  messagingSenderId: "810884208855",
  appId: "1:810884208855:web:69836bf0434174e4ab3892",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const googleSignIn = () => {
  return signInWithPopup(auth, provider);
};
