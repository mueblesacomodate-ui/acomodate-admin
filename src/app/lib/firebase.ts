// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
   apiKey: "AIzaSyDZd0yUcPS137riDA05bglI3aVicoCq77M",
    authDomain: "acomodate-muebles.firebaseapp.com",
    projectId: "acomodate-muebles",
    storageBucket: "acomodate-muebles.firebasestorage.app",
    messagingSenderId: "739987602622",
    appId: "1:739987602622:web:c3d3a21b9afdab936532ef",
    measurementId: "G-X8RWZ68E2S"
};

// Evita inicializar múltiples veces en Server Components / HMR

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);


// Exportar Firestore