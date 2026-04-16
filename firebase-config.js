/**
 * Firebase Configuration
 * Uses Firebase Compat version for HTML/JS projects
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
const MAX_INIT_ATTEMPTS = 30;

/**
 * Initialize Firebase Services (Compat version)
 */
function initializeFirebaseServices() {
    initAttempts++;
    
    try {
        // Check if Firebase core is available
        if (typeof firebase === 'undefined' || !firebase) {
            if (initAttempts < MAX_INIT_ATTEMPTS) {
                console.log(`⏳ Firebase SDK loading... (attempt ${initAttempts}/${MAX_INIT_ATTEMPTS})`);
                setTimeout(initializeFirebaseServices, 300);
            } else {
                console.error('✗ Firebase SDK failed to load');
                window.firebaseError = 'Firebase SDK could not be loaded. Please refresh the page.';
            }
            return;
        }

        // Try to use Firebase directly (compat is built-in to these versions)
        try {
            // Initialize Firebase app
            if (!firebase.apps || firebase.apps.length === 0) {
                firebase.initializeApp(firebaseConfig);
                console.log('✓ Firebase App initialized');
            }

            // Get Auth service - this will throw if Firebase isn't ready
            const auth = firebase.auth();
            if (!auth) throw new Error('Auth not available');

            // Get Firestore - this will throw if Firebase isn't ready
            const db = firebase.firestore();
            if (!db) throw new Error('Firestore not available');

            // Success! Store globally
            window.firebaseAuth = auth;
            window.firebaseDb = db;
            window.firebaseReady = true;
            firebaseInitialized = true;

            console.log('✅ Firebase fully initialized and ready');

            // Enable persistence
            db.enablePersistence().catch((err) => {
                console.log('ℹ Persistence note:', err.code);
            });

        } catch (serviceError) {
            // Services not ready yet, retry
            if (initAttempts < MAX_INIT_ATTEMPTS) {
                console.log(`⏳ Firebase services loading... (attempt ${initAttempts})`);
                setTimeout(initializeFirebaseServices, 300);
            } else {
                throw serviceError;
            }
        }

    } catch (error) {
        console.error('✗ Firebase initialization failed:', error.message);
        window.firebaseError = error.message;
        
        if (initAttempts < MAX_INIT_ATTEMPTS) {
            setTimeout(initializeFirebaseServices, 500);
        }
    }
}

// Start initialization immediately
console.log('🔄 Firebase Config: Initializing...');
initializeFirebaseServices();
