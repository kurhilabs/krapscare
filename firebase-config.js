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

let firebaseInitialized = false;
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 50;

/**
 * Initialize Firebase Services
 */
function initializeFirebaseServices() {
    initAttempts++;
    
    try {
        // Check if Firebase is available
        if (typeof firebase === 'undefined' || !firebase) {
            if (initAttempts < MAX_INIT_ATTEMPTS) {
                console.log(`⏳ Firebase SDK loading... (attempt ${initAttempts}/${MAX_INIT_ATTEMPTS})`);
                setTimeout(initializeFirebaseServices, 200);
            } else {
                console.error('✗ Firebase SDK failed to load');
                window.firebaseError = 'Firebase SDK could not be loaded. Check your internet connection.';
            }
            return;
        }

        // Skip if already initialized
        if (firebaseInitialized) {
            return;
        }

        // Initialize Firebase
        if (!firebase.apps || firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
            console.log('✓ Firebase App initialized');
        } else {
            console.log('✓ Firebase App already initialized');
        }

        // Get Firebase services
        const auth = firebase.auth();
        const db = firebase.firestore();

        if (!auth || !db) {
            throw new Error('Could not get Firebase services');
        }

        // Store in window for global access
        window.firebaseAuth = auth;
        window.firebaseDb = db;

        // Mark as ready
        window.firebaseReady = true;
        firebaseInitialized = true;

        console.log('✅ Firebase fully initialized and ready');

        // Enable persistence
        db.enablePersistence().catch((err) => {
            if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
                console.warn('⚠ Firestore persistence:', err.message);
            }
        });

    } catch (error) {
        console.error('✗ Firebase initialization failed:', error.message);
        window.firebaseError = error.message;
        // Retry after delay
        if (initAttempts < MAX_INIT_ATTEMPTS) {
            setTimeout(initializeFirebaseServices, 500);
        }
    }
}

// Start initialization
console.log('🔄 Firebase Config: Starting initialization...');
setTimeout(initializeFirebaseServices, 100);
