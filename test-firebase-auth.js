// Test Firebase Auth Integration
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase config
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
const auth = getAuth(app);

async function testFirebaseAuth() {
  console.log('Testing Firebase Auth integration...');
  
  try {
    // Test creating a user
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    console.log(`Creating test user: ${testEmail}`);
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('✅ User created successfully');
    console.log('Firebase UID:', userCredential.user.uid);
    
    // Test signing in
    console.log('Testing sign in...');
    const signInCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('✅ Sign in successful');
    console.log('Current user UID:', signInCredential.user.uid);
    
    console.log('🎉 Firebase Auth integration test passed!');
    
  } catch (error) {
    console.error('❌ Firebase Auth test failed:', error.message);
  }
}

testFirebaseAuth(); 