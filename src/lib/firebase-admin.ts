
import admin from 'firebase-admin';
import type { ServiceAccount } from "firebase-admin";

// This file is the SINGLE SOURCE OF TRUTH for initializing the Firebase Admin SDK.
// All server-side code (Server Actions, etc.) should import 'db' from this file.

let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

if (!admin.apps.length) {
  console.log("Firebase Admin SDK: Initializing...");
  
  const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    console.error("ADMIN INIT FAILED: Critical Firebase Admin environment variables are missing. Backend functionality requiring admin privileges will fail.");
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("ADMIN READY: Firebase Admin SDK initialized successfully.");
    } catch (e: any) {
      console.error("ADMIN INIT FAILED: Error initializing Firebase Admin SDK from environment variables. Check their values.", e.message);
    }
  }
}

// Only attempt to get firestore and auth if an app has been initialized
if (admin.apps.length > 0) {
  db = admin.firestore();
  auth = admin.auth();
} else {
  // Provide dummy objects or throw a more descriptive error if you prefer
  // For now, we'll let them be undefined, and any subsequent usage will fail loudly,
  // which is better than crashing on import.
  console.error("Firebase Admin SDK was not initialized. 'db' and 'auth' exports will be unavailable.");
}

export { db, auth, admin };
