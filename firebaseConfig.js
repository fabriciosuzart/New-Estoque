import { initializeApp, getApp, getApps } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyCUNr0VIieOTKPRg1G4_LdQII08ZV1Tf4g",
    authDomain: "estoque-1eb4b.firebaseapp.com",
    databaseURL: "https://estoque-1eb4b-default-rtdb.firebaseio.com",
    projectId: "estoque-1eb4b",
    storageBucket: "estoque-1eb4b.appspot.com",
    messagingSenderId: "510775204662",
    appId: "1:510775204662:web:99ebdc50b2e054fdcf7197"
};

// Lógica Singleton: Só inicializa se não houver um app rodando
let app;
let auth;

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    // Inicializa Auth com persistência APENAS na primeira vez
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
} else {
    // Se já existe (num reload), apenas recupera a instância
    app = getApp();
    auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
