import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

export const firebaseConfig = {
  apiKey: "AIzaSyBxwR3zK2LY_5eaik723evhiKmbn2diqYk",
  authDomain: "cens451-notas.firebaseapp.com",
  projectId: "cens451-notas",
  storageBucket: "cens451-notas.firebasestorage.app",
  messagingSenderId: "39462285070",
  appId: "1:39462285070:web:069816a4f6ff5ce985f15f"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
