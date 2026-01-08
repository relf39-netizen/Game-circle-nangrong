
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  setDoc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDNxYpvawwkGPuP99QZ3eTiOtBBFPjaAHQ",
  authDomain: "onet-school-game.firebaseapp.com",
  databaseURL: "https://onet-school-game-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "onet-school-game",
  storageBucket: "onet-school-game.firebasestorage.app",
  messagingSenderId: "38156225800",
  appId: "1:38156225800:web:43dcd321390bcd630c30bd",
  measurementId: "G-6JVL0V26ZF"
};

export const isConfigValid = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let dbInstance: any = null;

try {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  dbInstance = getFirestore(app);
  console.log("Firebase initialized");
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { 
  dbInstance as db, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  setDoc,
  getDoc,
  updateDoc
};
