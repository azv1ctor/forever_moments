// /src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import { config } from 'dotenv';

// Force load environment variables from .env file
config();

// Garante que o SDK do Firebase Admin não seja inicializado múltiplas vezes.
if (!admin.apps.length) {
  try {
    const serviceAccount: admin.ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

export const db = admin.firestore();
export const storage = admin.storage();
