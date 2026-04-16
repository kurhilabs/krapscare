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
 * Check and initialize Firebase
 */
function setupFirebaseConfig() {
    try {
        // Check if Firebase is loaded
        if (typeof firebase === 'undefined' || !firebase) {
            console.warn('⏳ Firebase still loading, will retry...');
            setTimeout(setupFirebaseConfig, 200);
            return;
        }

        // Initialize if not already initialized
        if (!firebase.apps || firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
            console.log('✓ Firebase App initialized');
        } else {
            console.log('✓ Firebase App already initialized');
        }

        // Get services
        const auth = firebase.auth();
        const db = firebase.firestore();

        if (!auth || !db) {
            throw new Error('Failed to get Firebase services');
        }

        // Store globally
        window.firebaseAuth = auth;
        window.firebaseDb = db;

        console.log('✓ Firebase Auth and Firestore ready');

        // Try to enable persistence
        db.enablePersistence().catch((err) => {
            // Persistence errors are usually not critical
            console.log('ℹ Firestore persistence:', err.code);
        });

    } catch (error) {
        console.error('✗ Firebase setup error:', error);
        // Retry on error
        setTimeout(setupFirebaseConfig, 1000);
    }
}

// Start setup when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupFirebaseConfig);
} else {
    // If already loaded (rare), setup immediately
    setupFirebaseConfig();
}

// Also setup on a small delay to catch late-loading scenarios
setTimeout(setupFirebaseConfig, 100);
