/**
 * Kraps Care Authentication Module
 * Handles Firebase authentication for Admin, Technician, and User roles
 * Features: Email/Password Login, OTP Login, Password Reset
 */

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

/**
 * Firebase Configuration
 * Make sure Firebase is already initialized in your project
 * This assumes Firebase is configured glo
bally
 */

// Firebase instances will be initialized by firebase-config.js
let auth;
let db;
let confirmationResult;
let resendTimeoutId;

/**
 * Initialize Firebase Auth and Firestore
 * Call this on page load
 */
async function initializeFirebase() {
    try {
        // Wait for Firebase services to be available from firebase-config.js
        let retries = 0;
        while ((!window.firebaseAuth || !window.firebaseDb) && retries < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }

        // Get Firebase instances from global scope (set by firebase-config.js)
        auth = window.firebaseAuth;
        db = window.firebaseDb;

        // Verify Firebase is properly initialized
        if (!auth || !db) {
            throw new Error('Firebase initialization incomplete - services not found');
        }

        // Set up auth state listener
        auth.onAuthStateChanged(async (user) => {
            if (user && !window.location.pathname.endsWith('dashboard/index.html')) {
                // User is logged in - redirect to dashboard
                // But not if we're already on the dashboard
                const currentPath = window.location.pathname;
                if (!currentPath.includes('dashboard')) {
                    await redirectToDashboard(user.uid);
                }
            }
        });

        setupRecaptcha();
        console.log('✓ Firebase services loaded and configured');
    } catch (error) {
        console.error('✗ Firebase initialization error:', error);
        showError('email', 'Failed to initialize authentication. Please refresh the page.');
    }
}

// ============================================================================
// TAB MANAGEMENT
// ============================================================================

/**
 * Switch between different form tabs
 */
function switchTab(tabName) {
    // Hide all forms
    document.getElementById('email-form').classList.remove('active');
    document.getElementById('otp-form').classList.remove('active');
    document.getElementById('forgot-form').classList.remove('active');

    // Remove active state from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Clear all messages
    clearMessages();

    // Show selected form
    if (tabName === 'email') {
        document.getElementById('email-form').classList.add('active');
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.querySelector('.tab-group').style.display = 'flex';
    } else if (tabName === 'otp') {
        document.getElementById('otp-form').classList.add('active');
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.querySelector('.tab-group').style.display = 'flex';
    }
}

/**
 * Switch to forgot password form
 */
function switchToForgotPassword() {
    document.getElementById('email-form').classList.remove('active');
    document.getElementById('otp-form').classList.remove('active');
    document.getElementById('forgot-form').classList.add('active');
    document.querySelector('.tab-group').style.display = 'none';
    clearMessages();
}

// ============================================================================
// EMAIL/PASSWORD LOGIN
// ============================================================================

/**
 * Validate email format
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password
 */
function validatePassword(password) {
    // Minimum 6 characters
    return password.length >= 6;
}

/**
 * Handle email login
 */
async function handleEmailLogin() {
    try {
        clearMessages('email');

        // Get form values
        const userType = document.getElementById('user-type').value;
        const email = document.getElementById('email-input').value.trim();
        const password = document.getElementById('password-input').value;
        const rememberMe = document.getElementById('remember-me').checked;

        // Validation
        if (!email) {
            showError('email', 'Please enter your email address');
            return;
        }

        if (!validateEmail(email)) {
            showError('email', 'Please enter a valid email address');
            return;
        }

        if (!password) {
            showError('email', 'Please enter your password');
            return;
        }

        if (!validatePassword(password)) {
            showError('email', 'Password must be at least 6 characters');
            return;
        }

        // Show loading state
        setButtonLoading('email-login-btn', true);

        // Sign in with email and password
        const result = await auth.signInWithEmailAndPassword(email, password);
        const user = result.user;

        // Verify user role and type
        const userData = await getUserData(user.uid);

        // Check if user type matches
        if (userData.role !== userType || !['admin', 'technician'].includes(userData.role)) {
            throw new Error(`This account is not registered as a ${userType.toUpperCase()}`);
        }

        // Log authentication event
        await logAuthEvent(user.uid, 'login', 'email');

        // Save remember me preference
        if (rememberMe) {
            localStorage.setItem('krapscare_email', email);
            localStorage.setItem('krapscare_remember', 'true');
        }

        // Store user role for dashboard
        sessionStorage.setItem('userRole', userData.role);
        sessionStorage.setItem('userName', userData.name);

        showSuccess('email', 'Login successful! Redirecting...');

        // Redirect after short delay
        setTimeout(() => {
            window.location.href = 'dashboard/index.html';
        }, 1500);

    } catch (error) {
        console.error('✗ Email login error:', error);
        handleAuthError(error, 'email');
    } finally {
        setButtonLoading('email-login-btn', false);
    }
}

/**
 * Get user data from Firestore
 */
async function getUserData(uid) {
    try {
        if (!db) {
            throw new Error('Firestore not initialized');
        }

        const userRef = db.collection('users').doc(uid);
        const doc = await userRef.get();

        if (!doc.exists) {
            throw new Error('User data not found in database');
        }

        const userData = doc.data();
        
        // Validate required fields
        if (!userData.role || !userData.name) {
            throw new Error('Invalid user data structure');
        }

        return userData;
    } catch (error) {
        console.error('✗ Error fetching user data:', error);
        throw error;
    }
}

/**
 * Log authentication events for audit trail
 */
async function logAuthEvent(uid, eventType, method) {
    try {
        if (!db) return; // Silently fail if Firestore not available
        
        const logRef = db.collection('auth_logs').doc();
        await logRef.set({
            userId: uid,
            eventType: eventType, // 'login', 'signup', 'logout', 'password_reset'
            method: method, // 'email', 'phone'
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ipAddress: 'client-side' // IP logging should be done server-side
        });
    } catch (error) {
        console.warn('⚠ Could not log auth event:', error);
        // Don't throw - auth should continue even if logging fails
    }
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility() {
    const input = document.getElementById('password-input');
    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}

// ============================================================================
// OTP LOGIN
// ============================================================================

/**
 * Phone number validation
 */
function validatePhoneNumber(phone) {
    // Remove non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid Indian phone number (10 digits)
    return cleaned.length === 10 && cleaned[0] !== '0';
}

/**
 * Format phone number for Firebase
 */
function formatPhoneForFirebase(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return `+91${cleaned}`;
}

/**
 * Setup reCAPTCHA for phone auth
 */
function setupRecaptcha() {
    try {
        if (typeof grecaptcha !== 'undefined') {
            window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
                'recaptcha-container',
                {
                    'size': 'invisible',
                    'callback': onReCaptchaSuccess
                }
            );
        }
    } catch (error) {
        console.log('Note: reCAPTCHA setup skipped (may not be needed for all environments)');
    }
}

/**
 * reCAPTCHA success callback
 */
function onReCaptchaSuccess() {
    console.log('✓ reCAPTCHA verified');
}

/**
 * Handle OTP send
 */
async function handleOTPSend() {
    try {
        clearMessages('otp');

        const phoneNumber = document.getElementById('phone-input').value.trim();

        // Validation
        if (!phoneNumber) {
            showError('otp', 'Please enter your phone number');
            return;
        }

        if (!validatePhoneNumber(phoneNumber)) {
            showError('otp', 'Please enter a valid 10-digit phone number');
            return;
        }

        // Show loading state
        setButtonLoading('send-otp-btn', true);

        // Format phone number
        const formattedPhone = formatPhoneForFirebase(phoneNumber);

        // Send OTP
        const appVerifier = window.recaptchaVerifier;
        confirmationResult = await auth.signInWithPhoneNumber(
            formattedPhone,
            appVerifier
        );

        showSuccess('otp', 'OTP sent successfully!');

        // Hide phone section, show OTP section
        document.getElementById('phone-section').style.display = 'none';
        document.getElementById('otp-section').style.display = 'block';
        document.getElementById('send-otp-btn').style.display = 'none';
        document.getElementById('verify-otp-btn').style.display = 'block';
        document.getElementById('cancel-otp-btn').style.display = 'block';

        // Start resend timer
        startResendTimer();

        // Focus on first OTP input
        document.querySelector('.otp-input').focus();

    } catch (error) {
        console.error('✗ OTP send error:', error);
        handleAuthError(error, 'otp');
        
        // Reset reCAPTCHA on error
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            setupRecaptcha();
        }
    } finally {
        setButtonLoading('send-otp-btn', false);
    }
}

/**
 * Handle OTP verification
 */
async function handleOTPVerify() {
    try {
        clearMessages('otp');

        // Get OTP from input fields
        const otpInputs = document.querySelectorAll('.otp-input');
        let otp = '';
        
        otpInputs.forEach(input => {
            otp += input.value;
        });

        // Validation
        if (!otp || otp.length !== 6) {
            showError('otp', 'Please enter the 6-digit OTP');
            otpInputs.forEach(input => input.classList.add('error'));
            return;
        }

        // Clear error state
        otpInputs.forEach(input => input.classList.remove('error'));

        // Show loading state
        setButtonLoading('verify-otp-btn', true);

        // Verify OTP
        const result = await confirmationResult.confirm(otp);
        const user = result.user;

        // Get or create user in Firestore
        await getOrCreateUserFromPhone(user);

        showSuccess('otp', 'Login successful! Redirecting...');

        // Redirect after short delay
        setTimeout(() => {
            window.location.href = 'dashboard/index.html';
        }, 1500);

    } catch (error) {
        console.error('✗ OTP verification error:', error);
        
        if (error.code === 'auth/invalid-verification-code') {
            showError('otp', 'Invalid OTP. Please try again.');
            document.querySelectorAll('.otp-input').forEach(input => {
                input.classList.add('error');
            });
        } else {
            handleAuthError(error, 'otp');
        }
    } finally {
        setButtonLoading('verify-otp-btn', false);
    }
}

/**
 * Handle OTP cancel
 */
function handleOTPCancel() {
    // Clear OTP inputs
    document.querySelectorAll('.otp-input').forEach(input => {
        input.value = '';
        input.classList.remove('error');
    });

    // Reset OTP section
    document.getElementById('phone-section').style.display = 'block';
    document.getElementById('otp-section').style.display = 'none';
    document.getElementById('send-otp-btn').style.display = 'block';
    document.getElementById('verify-otp-btn').style.display = 'none';
    document.getElementById('cancel-otp-btn').style.display = 'none';

    // Clear phone input
    document.getElementById('phone-input').value = '';

    // Clear timer
    if (resendTimeoutId) {
        clearTimeout(resendTimeoutId);
    }

    clearMessages('otp');
}

/**
 * Start resend timer
 */
function startResendTimer() {
    let timeLeft = 60;
    const timerSpan = document.getElementById('timer-count');
    const resendBtn = document.getElementById('send-otp-btn');

    resendBtn.disabled = true;

    const interval = setInterval(() => {
        timeLeft--;
        timerSpan.textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(interval);
            resendBtn.disabled = false;
            document.getElementById('resend-timer-text').innerHTML = 
                'Didn\'t receive OTP? <a onclick="handleOTPSend()" style="color: var(--electric); cursor: pointer;">Resend</a>';
        }
    }, 1000);

    resendTimeoutId = interval;
}

/**
 * Get or create user from phone number
 */
async function getOrCreateUserFromPhone(user) {
    try {
        if (!db) {
            throw new Error('Firestore not initialized');
        }

        const userRef = db.collection('users').doc(user.uid);
        const doc = await userRef.get();

        if (!doc.exists) {
            // Create new user record with security logging
            const userData = {
                uid: user.uid,
                phone: user.phoneNumber,
                role: 'user',
                name: 'User',
                email: user.email || null,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                authMethod: 'phone',
                verified: true
            };

            await userRef.set(userData);
            
            // Log auth event
            await logAuthEvent(user.uid, 'signup', 'phone');
        } else {
            // Update last login
            await userRef.update({
                lastLogin: new Date().toISOString()
            });
            
            // Log auth event
            await logAuthEvent(user.uid, 'login', 'phone');
        }

        // Store user role
        sessionStorage.setItem('userRole', 'user');
        sessionStorage.setItem('userName', 'User');

    } catch (error) {
        console.error('✗ Error managing user record:', error);
        throw error;
    }
}

/**
 * Setup OTP input auto-focus
 */
document.addEventListener('DOMContentLoaded', () => {
    const otpInputs = document.querySelectorAll('.otp-input');

    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            // Only allow numbers
            if (!/^\d?$/.test(e.target.value)) {
                e.target.value = '';
                return;
            }

            // Move to next input
            if (e.target.value && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });

        // Handle backspace
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });

        // Handle paste
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text');
            const pastedOTP = pastedData.replace(/\D/g, '').slice(0, 6);

            for (let i = 0; i < pastedOTP.length; i++) {
                if (otpInputs[i]) {
                    otpInputs[i].value = pastedOTP[i];
                }
            }

            // Focus last input or verify
            if (pastedOTP.length === 6) {
                handleOTPVerify();
            } else if (otpInputs[pastedOTP.length]) {
                otpInputs[pastedOTP.length].focus();
            }
        });
    });
});

// ============================================================================
// PASSWORD RESET
// ============================================================================

/**
 * Handle forgot password
 */
async function handleForgotPassword() {
    try {
        clearMessages('forgot');

        const email = document.getElementById('forgot-email-input').value.trim();

        // Validation
        if (!email) {
            showError('forgot', 'Please enter your email address');
            return;
        }

        if (!validateEmail(email)) {
            showError('forgot', 'Please enter a valid email address');
            return;
        }

        // Show loading state
        setButtonLoading('forgot-btn', true);

        // Send password reset email
        await auth.sendPasswordResetEmail(email, {
            url: `${window.location.origin}/auth.html`,
            handleCodeInApp: false
        });

        // Log password reset request
        // Note: We don't have the UID yet, so we'll log via email
        console.log('✓ Password reset email sent');

        showSuccess('forgot', 
            'Password reset link sent! Check your email (check spam folder too).'
        );

        // Clear input
        document.getElementById('forgot-email-input').value = '';

        // Redirect after delay
        setTimeout(() => {
            switchTab('email');
        }, 3000);

    } catch (error) {
        console.error('✗ Password reset error:', error);
        handleAuthError(error, 'forgot');
    } finally {
        setButtonLoading('forgot-btn', false);
    }
}

// ============================================================================
// ROUTE PROTECTION & REDIRECTS
// ============================================================================

/**
 * Redirect to appropriate dashboard based on user role
 */
async function redirectToDashboard(uid) {
    try {
        const userData = await getUserData(uid);
        
        // Store user info
        sessionStorage.setItem('userId', uid);
        sessionStorage.setItem('userRole', userData.role);
        sessionStorage.setItem('userName', userData.name);

        // Redirect based on role
        window.location.href = 'dashboard/index.html';
    } catch (error) {
        console.error('✗ Redirect error:', error);
        // User data not found, stay on auth page
    }
}

/**
 * Check if user is authenticated
 */
async function checkAuth() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged((user) => {
            resolve(user);
        });
    });
}

/**
 * Logout user
 */
async function logout() {
    try {
        const uid = auth.currentUser?.uid;
        
        // Log logout event
        if (uid) {
            await logAuthEvent(uid, 'logout', auth.currentUser.providerData[0]?.providerId || 'unknown');
        }

        await auth.signOut();
        sessionStorage.clear();
        localStorage.removeItem('krapscare_email');
        window.location.href = '/auth.html';
    } catch (error) {
        console.error('✗ Logout error:', error);
    }
}

// ============================================================================
// ERROR HANDLING & MESSAGES
// ============================================================================

/**
 * Handle Firebase auth errors
 */
function handleAuthError(error, formType) {
    const errorMessages = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/user-disabled': 'This account has been disabled',
        'auth/invalid-email': 'Invalid email address',
        'auth/weak-password': 'Password is too weak',
        'auth/email-already-in-use': 'Email already in use',
        'auth/operation-not-allowed': 'Authentication operation not allowed',
        'auth/too-many-requests': 'Too many failed attempts. Try again later',
        'auth/network-request-failed': 'Network error. Check your connection',
        'auth/invalid-phone-number': 'Invalid phone number',
        'auth/invalid-verification-code': 'Invalid OTP code'
    };

    const message = errorMessages[error.code] || error.message || 'Authentication failed';
    showError(formType, message);

    console.error(`[${formType}] Error Code: ${error.code}`, error);
}

/**
 * Show error message
 */
function showError(formType, message) {
    const errorElement = document.getElementById(`${formType}-error`);
    if (errorElement) {
        errorElement.textContent = `✗ ${message}`;
        errorElement.classList.add('show');
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Show success message
 */
function showSuccess(formType, message) {
    const successElement = document.getElementById(`${formType}-success`);
    if (successElement) {
        successElement.textContent = `✓ ${message}`;
        successElement.classList.add('show');
        successElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Clear error and success messages
 */
function clearMessages(formType = null) {
    if (formType) {
        const errorElement = document.getElementById(`${formType}-error`);
        const successElement = document.getElementById(`${formType}-success`);
        
        if (errorElement) errorElement.classList.remove('show');
        if (successElement) successElement.classList.remove('show');
    } else {
        document.querySelectorAll('.error-message, .success-message').forEach(el => {
            el.classList.remove('show');
        });
    }
}

// ============================================================================
// UI UTILITIES
// ============================================================================

/**
 * Set button loading state
 */
function setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    button.disabled = isLoading;

    // Save original text
    if (!button.dataset.originalText) {
        button.dataset.originalText = button.innerHTML;
    }

    if (isLoading) {
        button.innerHTML = '<span class="spinner"></span> Processing...';
    } else {
        button.innerHTML = button.dataset.originalText;
    }
}

/**
 * Pre-fill remembered email
 */
function prefillEmail() {
    const remembered = localStorage.getItem('krapscare_remember') === 'true';
    const email = localStorage.getItem('krapscare_email');

    if (remembered && email) {
        document.getElementById('email-input').value = email;
        document.getElementById('remember-me').checked = true;
    }
}

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase authentication
    initializeFirebase();

    // Pre-fill email if remembered
    prefillEmail();

    // Add keyboard handlers
    const passwordInput = document.getElementById('password-input');
    const forgotInput = document.getElementById('forgot-email-input');
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleEmailLogin();
        });
    }
    
    if (forgotInput) {
        forgotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleForgotPassword();
        });
    }

    // Log ready state
    console.log('✓ Authentication module loaded and ready');
});

// ============================================================================
// EXPORT FOR USE IN OTHER MODULES
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        logout,
        getAuthUser: () => auth.currentUser,
        checkAuth,
        getUserData
    };
}
