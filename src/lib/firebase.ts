import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAjFvGYS4QwmeO_Q44okax3DLT1jjyDq2s",
    authDomain: "algo-trace.firebaseapp.com",
    projectId: "algo-trace",
    storageBucket: "algo-trace.firebasestorage.app",
    messagingSenderId: "319233411302",
    appId: "1:319233411302:web:96fc7c2fdac33296ca1327",
    measurementId: "G-QTYFJ11NVN",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
    return signInWithPopup(auth, googleProvider);
}

export async function signOutUser() {
    return firebaseSignOut(auth);
}
