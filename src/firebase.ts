import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Use initializeFirestore with long polling as a fallback for restricted environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const storage = getStorage(app);

// Connectivity Test
async function validateConnection() {
  try {
    // Only test if we have a valid database setup
    if (firebaseConfig.firestoreDatabaseId) {
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log("Firestore connection validated successfully.");
    }
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable'))) {
      console.error("Firestore connectivity issue detected. Please check your Firebase configuration or project status.");
      console.error("Technical details:", error.message);
    }
  }
}

validateConnection();
