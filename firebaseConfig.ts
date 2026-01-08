
// เราจำเป็นต้องใช้ URL สำหรับ browser runtime แต่สำหรับ build time TSC ต้องการ module
// ในที่นี้เราจะใช้ string literal เพื่อป้องกัน TSC ไม่ให้ดึงประเภทผิดพลาด
// @ts-ignore
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
// @ts-ignore
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
  apiKey: "AIzaSyAy4v6AGRi3-40FiENali8_HEUsudB-KB8",
  authDomain: "schoolos-1f634.firebaseapp.com",
  databaseURL: "https://schoolos-1f634-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "schoolos-1f634",
  storageBucket: "schoolos-1f634.firebasestorage.app",
  messagingSenderId: "354863600444",
  appId: "1:354863600444:web:d29821b6839bd34081c439",
  measurementId: "G-0FKXGLFFJ4"
};

export const isConfigValid = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let dbInstance: any = null;

try {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  dbInstance = getFirestore(app);
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
