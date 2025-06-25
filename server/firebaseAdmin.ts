import { initializeApp, cert, getApps } from 'firebase-admin/app';
import * as serviceAccount from '../firebase-service-account-key.json';

const apps = getApps();

let firebaseAdminApp;
if (!apps.length) {
  firebaseAdminApp = initializeApp({
    credential: cert(serviceAccount),
  });
} else {
  firebaseAdminApp = apps[0];
}


export { firebaseAdminApp };