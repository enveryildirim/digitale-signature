import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, User as FirebaseUser } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Database;
  storage: FirebaseStorage;
}

let servicesPromise: Promise<FirebaseServices> | null = null;

// Firebase Hosting serves the project config at /__/firebase/init.json (dev: served by the Vite plugin from .env)
export function getFirebase(): Promise<FirebaseServices> {
  if (!servicesPromise) {
    servicesPromise = fetch('/__/firebase/init.json')
      .then((res) => {
        if (!res.ok) throw new Error('Firebase yapılandırması alınamadı.');
        return res.json();
      })
      .then((config) => {
        const app = initializeApp(config);
        return {
          app,
          auth: getAuth(app),
          db: getDatabase(app),
          storage: getStorage(app)
        };
      });
  }
  return servicesPromise;
}

// Resolves once Firebase Auth has restored (or not) the persisted session
export async function getCurrentUser(): Promise<FirebaseUser | null> {
  const { auth } = await getFirebase();
  await auth.authStateReady();
  return auth.currentUser;
}

export type { FirebaseUser };
