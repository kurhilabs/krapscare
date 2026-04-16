/**
 * Firebase Configuration
 * Initialization file for Firebase Authentication and Firestore
 * Security: Keys are restricted to web domain only in Firebase Console
 */

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBHlvi62OHySk1ajDQaC_58oqdKBpFSZbE",
    authDomain: "kraps-care-e2c2b.firebaseapp.com",
    projectId: "kraps-care-e2c2b",
    storageBucket: "kraps-care-e2c2b.firebasestorage.app",
    messagingSenderId: "889571297517",
    appId: "1:889571297517:web:641cae76659704341324e4",
    measurementId: "G-2G8M4FTNFZ"
};

/**
 * Initialize Firebase
 * This runs automatically when the script is loaded
 */
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Get Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence (optional - for better UX)
db.enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
            console.log('The current browser does not support offline persistence.');
        }
    });

console.log('✓ Firebase initialized successfully');
