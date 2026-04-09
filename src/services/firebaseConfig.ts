import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Sua configuração oficial do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCJkG1RXvMVUjhgKYOLnfp_EIZIorhxBu8",
  authDomain: "nutryon-app.firebaseapp.com",
  projectId: "nutryon-app",
  storageBucket: "nutryon-app.firebasestorage.app",
  messagingSenderId: "164317563830",
  appId: "1:164317563830:web:f462ce6815221b991d4f17",
  measurementId: "G-BM1M1JB8JN"
};

// Inicializa o Firebase (evita erro de duplicidade se o Metro der reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inicializa a Autenticação com persistência nativa do React Native
// Isso resolve o erro de "Cannot read property 'app' of undefined"
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export default app;