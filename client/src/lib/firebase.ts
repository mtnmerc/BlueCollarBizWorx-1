import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDfzH_0iB93OfuaarjXtNWCPCQy4pVhDzI",
  authDomain: "bizworx-7faf4.firebaseapp.com",
  projectId: "bizworx-7faf4",
  storageBucket: "bizworx-7faf4.firebasestorage.app",
  messagingSenderId: "339692554532",
  appId: "1:339692554532:web:6f8f36fba80938d865cbb1",
  measurementId: "G-LHDZNWYSD7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app; 