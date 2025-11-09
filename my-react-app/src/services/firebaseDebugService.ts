import { auth, db, storage } from '../firebase';

export class FirebaseDebugService {
  static async testFirebaseConnection() {
    const results = {
      authInitialized: false,
      firestoreInitialized: false,
      storageInitialized: false,
      errors: [] as string[]
    };

    try {
      // Test Auth
      if (auth) {
        results.authInitialized = true;
        console.log('✓ Firebase Auth initialized');
      } else {
        results.errors.push('Firebase Auth not initialized');
      }
    } catch (err) {
      results.errors.push(`Auth error: ${err}`);
    }

    try {
      // Test Firestore
      if (db) {
        results.firestoreInitialized = true;
        console.log('✓ Firebase Firestore initialized');
      } else {
        results.errors.push('Firebase Firestore not initialized');
      }
    } catch (err) {
      results.errors.push(`Firestore error: ${err}`);
    }

    try {
      // Test Storage
      if (storage) {
        results.storageInitialized = true;
        console.log('✓ Firebase Storage initialized');
      } else {
        results.errors.push('Firebase Storage not initialized');
      }
    } catch (err) {
      results.errors.push(`Storage error: ${err}`);
    }

    console.log('Firebase Connection Test Results:', results);
    return results;
  }

  static logFirebaseError(error: unknown) {
    if (error instanceof Error) {
      console.error('Error Code:', (error as any).code);
      console.error('Error Message:', error.message);
    } else {
      console.error('Unknown error:', error);
    }
  }
}