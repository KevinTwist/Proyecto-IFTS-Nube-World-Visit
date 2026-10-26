import { initializeApp, FirebaseApp } from 'firebase/app';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { environment } from '../../environments/environment';

let firebaseApp: FirebaseApp | null = null;
let firebaseStorage: FirebaseStorage | null = null;

export function isFirebaseConfigured(): boolean {
  const { apiKey, projectId, storageBucket } = environment.firebase;
  return Boolean(apiKey && projectId && storageBucket);
}

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase no está configurado. Completá las credenciales en environment.ts');
  }

  if (!firebaseApp) {
    firebaseApp = initializeApp(environment.firebase);
  }

  return firebaseApp;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!firebaseStorage) {
    firebaseStorage = getStorage(getFirebaseApp());
  }

  return firebaseStorage;
}
