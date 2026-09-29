/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

function getOrCreateFirestore() {
  const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;
  try {
    return dbId
      ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, dbId)
      : initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
    return dbId ? getFirestore(app, dbId) : getFirestore(app);
  }
}

export const db = getOrCreateFirestore();

// Connection verification as mandated by Firebase integration guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    return true;
  } catch (error: any) {
    if (error && typeof error.message === 'string' && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or database initializing.');
      return false;
    }
    // Document not found is a successful connection to Firestore
    return true;
  }
}

testFirestoreConnection().catch(() => {});
