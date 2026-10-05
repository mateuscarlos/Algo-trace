import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export function getFirebaseAuth() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID must be configured to verify Firebase ID tokens.');
  }

  const app = getApps().find((firebaseApp) => firebaseApp.options.projectId === projectId)
    ?? initializeApp({ projectId }, `algo-trace-${projectId}`);

  return getAuth(app);
}
