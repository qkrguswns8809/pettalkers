import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCnfzcXFwPdsaCvdCGrsP1ZBfksKMUeuaw",
  authDomain: "pettalkers-5cf7e.firebaseapp.com",
  projectId: "pettalkers-5cf7e",
  storageBucket: "pettalkers-5cf7e.firebasestorage.app",
  messagingSenderId: "432991617712",
  appId: "1:432991617712:web:bd6f98e9946f57ae4db175"

}
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
