/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDPs8uBWyKPw5GxdksI4DPLEvjbzNj4PyQ",
  authDomain: "poopcycle-f447e.firebaseapp.com",
  projectId: "poopcycle-f447e",
  storageBucket: "poopcycle-f447e.firebasestorage.app",
  messagingSenderId: "610438973485",
  appId: "1:610438973485:web:5aabb6df9662ddce1810a4",
  measurementId: "G-E9C39L9MK4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

