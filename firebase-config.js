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
const MAX_INIT_ATTEMPTS = 20;

/**
 * Initialize Firebase Services (Compat version)
 */
function initializeFirebaseServices() {
    initAttempts++;
    
    try {
        // Check if Firebase is available (compat version)
        if (typeof firebase === 'undefined' || !firebase) {
            if (initAttempts < MAX_INIT_ATTEMPTS) {
                console.log(`⏳ Firebase SDK loading... (attempt ${initAttempts}/${MAX_INIT_ATTEMPTS})`);
                setTimeout(initializeFirebaseServices, 300);
            } else {
                console.error('✗ Firebase SDK failed to load after ' + MAX_INIT_ATTEMPTS + ' attempts');
                window.firebaseError = 'Firebase SDK could not be loaded. Please check your internet connection and refresh the page.';
            }
            return;
        }

        // Check compat namespace
        if (!firebase.compat) {
            console.warn('⚠ Firebase compat not available, retrying...');
            if (initAttempts < MAX_INIT_ATTEMPTS) {
                setTimeout(initializeFirebaseServices, 300);
            }
            return;
        }

        // Skip if already initialized
        if (firebaseInitialized) {
            console.log('✓ Firebase already initialized');
            return;
        }

        // Initialize Firebase
        if (!firebase.apps || firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
            console.log('✓ Firebase App initialized (Compat)');
        } else {
            console.log('✓ Firebase App already initialized');
        }

        // Get Firebase services using compat
        const app = firebase.app();
        const auth = app.auth();
        const db = app.firestore();

        if (!auth || !db) {
            throw new Error('Could not get Firebase compat services');
        }

        // Store in window for global access
        window.firebaseAuth = auth;
        window.firebaseDb = db;

        // Mark as ready
        window.firebaseReady = true;
        firebaseInitialized = true;

        console.log('✅ Firebase fully initialized and ready (Compat Mode)');

        // Enable persistence
        db.enablePersistence().catch((err) => {
            if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
                console.warn('⚠ Firestore persistence:', err.message);
            }
        });

    } catch (error) {
        console.error('✗ Firebase initialization failed:', error.message);
        window.firebaseError = error.message;
        if (initAttempts < MAX_INIT_ATTEMPTS) {
            setTimeout(initializeFirebaseServices, 500);
        }
    }
}

// Start initialization immediately
console.log('🔄 Firebase Config: Starting initialization (Compat Mode)...');
initializeFirebaseServices();
