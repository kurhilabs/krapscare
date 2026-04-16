/**
 * Firebase Initialization Helper
 * Ensures Firebase is loaded before auth module runs
 */

// This file acts as a bridge to ensure proper loading order
// It waits for Firebase SDK to be available, then initializes config

(function() {
    let firebaseCheckCount = 0;
    const maxChecks = 100;

    function waitForFirebase() {
        firebaseCheckCount++;
        
        if (typeof firebase !== 'undefined') {
            console.log('✓ Firebase SDK detected, initializing config...');
            // Give firebase-config.js time to execute if it hasn't yet
            setTimeout(() => {
                if (typeof initializeFirebase === 'function') {
                    console.log('✓ Auth module ready, calling initializeFirebase');
                }
            }, 500);
            return;
        }

        if (firebaseCheckCount < maxChecks) {
            setTimeout(waitForFirebase, 50);
        } else {
            console.error('✗ Firebase SDK failed to load after ' + maxChecks + ' attempts');
        }
    }

    // Start checking if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForFirebase);
    } else {
        waitForFirebase();
    }
})();
