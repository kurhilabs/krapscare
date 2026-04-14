/**
 * Dashboard Module
 * Handles authentication check, user data loading, and role-based content
 */

let auth;
let db;
let currentUser;

/**
 * Initialize Firebase
 */
async function initializeDashboard() {
    try {
        // Get Firebase instances
        auth = firebase.auth();
        db = firebase.firestore();

        // Check authentication status
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                // Not authenticated, redirect to auth page
                redirectToAuth();
                return;
            }

            currentUser = user;
            await loadDashboard(user.uid);
        });

    } catch (error) {
        console.error('✗ Initialization error:', error);
        redirectToAuth();
    }
}

/**
 * Load dashboard based on user role
 */
async function loadDashboard(uid) {
    try {
        // Get user data from Firestore
        const userData = await getUserData(uid);

        if (!userData) {
            console.error('✗ User data not found');
            redirectToAuth();
            return;
        }

        // Store user data
        const userRole = userData.role || 'user';
        const userName = userData.name || 'User';

        // Update UI with user information
        updateUserUI(userName, userRole);

        // Show appropriate dashboard section
        showDashboardSection(userRole);

        // Load role-specific content
        await loadRoleContent(userRole, uid);

        console.log(`✓ Dashboard loaded for ${userRole}: ${userName}`);

    } catch (error) {
        console.error('✗ Dashboard load error:', error);
        redirectToAuth();
    }
}

/**
 * Get user data from Firestore
 */
async function getUserData(uid) {
    try {
        const docRef = db.collection('users').doc(uid);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error('User document not found');
        }

        return doc.data();
    } catch (error) {
        console.error('✗ Error fetching user data:', error);
        throw error;
    }
}

/**
 * Update user UI elements
 */
function updateUserUI(name, role) {
    try {
        // Update user name
        document.getElementById('user-name').textContent = name;

        // Update user role
        document.getElementById('user-role').textContent = role.toUpperCase();

        // Update avatar with first letter
        document.getElementById('user-avatar').textContent = name.charAt(0).toUpperCase();

        // Update title
        document.title = `${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard - Kraps Care`;

    } catch (error) {
        console.error('✗ Error updating user UI:', error);
    }
}

/**
 * Show appropriate dashboard section based on role
 */
function showDashboardSection(role) {
    // Hide all sections
    document.getElementById('admin-section').classList.remove('active');
    document.getElementById('technician-section').classList.remove('active');
    document.getElementById('user-section').classList.remove('active');

    // Show appropriate section
    const sectionId = `${role}-section`;
    const section = document.getElementById(sectionId);

    if (section) {
        section.classList.add('active');
    } else {
        console.warn(`Section not found for role: ${role}`);
        // Default to user section
        document.getElementById('user-section').classList.add('active');
    }
}

/**
 * Load role-specific content
 */
async function loadRoleContent(role, uid) {
    try {
        switch (role) {
            case 'admin':
                await loadAdminContent(uid);
                break;
            case 'technician':
                await loadTechnicianContent(uid);
                break;
            case 'user':
                await loadUserContent(uid);
                break;
            default:
                console.warn(`Unknown role: ${role}`);
        }
    } catch (error) {
        console.error(`✗ Error loading ${role} content:`, error);
    }
}

/**
 * Load admin-specific content
 */
async function loadAdminContent(uid) {
    try {
        // Get total technicians
        const techniciansSnap = await db.collection('users')
            .where('role', '==', 'technician')
            .count()
            .get();

        document.getElementById('admin-technicians').textContent = techniciansSnap.data().count;

        // Get total users
        const usersSnap = await db.collection('users')
            .where('role', '==', 'user')
            .count()
            .get();

        document.getElementById('admin-users').textContent = usersSnap.data().count;

        // Get total service requests
        const requestsSnap = await db.collection('service_requests')
            .count()
            .get();

        document.getElementById('admin-requests').textContent = requestsSnap.data().count;

        // Get total revenue
        const revenueSnap = await db.collection('transactions')
            .where('status', '==', 'completed')
            .get();

        let totalRevenue = 0;
        revenueSnap.forEach(doc => {
            totalRevenue += doc.data().amount || 0;
        });

        document.getElementById('admin-revenue').textContent = `₹${totalRevenue.toLocaleString()}`;

    } catch (error) {
        console.error('✗ Error loading admin content:', error);
        // Set default values
        document.getElementById('admin-technicians').textContent = '0';
        document.getElementById('admin-users').textContent = '0';
        document.getElementById('admin-requests').textContent = '0';
        document.getElementById('admin-revenue').textContent = '₹0';
    }
}

/**
 * Load technician-specific content
 */
async function loadTechnicianContent(uid) {
    try {
        // Get pending requests
        const pendingSnap = await db.collection('service_requests')
            .where('technician_id', '==', uid)
            .where('status', '==', 'pending')
            .count()
            .get();

        document.getElementById('tech-pending').textContent = pendingSnap.data().count;

        // Get completed requests
        const completedSnap = await db.collection('service_requests')
            .where('technician_id', '==', uid)
            .where('status', '==', 'completed')
            .count()
            .get();

        document.getElementById('tech-completed').textContent = completedSnap.data().count;

        // Get technician's rating
        const techSnap = await db.collection('users').doc(uid).get();
        const techData = techSnap.data();
        
        if (techData && techData.rating) {
            document.getElementById('tech-rating').textContent = techData.rating.toFixed(1);
        }

        // Get total earnings
        const earningsSnap = await db.collection('transactions')
            .where('technician_id', '==', uid)
            .where('status', '==', 'completed')
            .get();

        let totalEarnings = 0;
        earningsSnap.forEach(doc => {
            totalEarnings += doc.data().amount || 0;
        });

        document.getElementById('tech-earnings').textContent = `₹${totalEarnings.toLocaleString()}`;

    } catch (error) {
        console.error('✗ Error loading technician content:', error);
        // Set default values
        document.getElementById('tech-pending').textContent = '0';
        document.getElementById('tech-completed').textContent = '0';
        document.getElementById('tech-rating').textContent = '4.5';
        document.getElementById('tech-earnings').textContent = '₹0';
    }
}

/**
 * Load user-specific content
 */
async function loadUserContent(uid) {
    try {
        // Get active requests
        const activeSnap = await db.collection('service_requests')
            .where('user_id', '==', uid)
            .where('status', 'in', ['pending', 'in_progress'])
            .count()
            .get();

        document.getElementById('user-active').textContent = activeSnap.data().count;

        // Get completed requests
        const completedSnap = await db.collection('service_requests')
            .where('user_id', '==', uid)
            .where('status', '==', 'completed')
            .count()
            .get();

        document.getElementById('user-completed').textContent = completedSnap.data().count;

        // Get savings
        const savingsSnap = await db.collection('transactions')
            .where('user_id', '==', uid)
            .where('type', '==', 'saving')
            .get();

        let totalSaved = 0;
        savingsSnap.forEach(doc => {
            totalSaved += doc.data().amount || 0;
        });

        document.getElementById('user-saved').textContent = `₹${totalSaved.toLocaleString()}`;

        // Average rating given is static for now
        document.getElementById('user-rating').textContent = '4.8';

    } catch (error) {
        console.error('✗ Error loading user content:', error);
        // Set default values
        document.getElementById('user-active').textContent = '0';
        document.getElementById('user-completed').textContent = '0';
        document.getElementById('user-saved').textContent = '₹0';
        document.getElementById('user-rating').textContent = '4.8';
    }
}

/**
 * Handle user logout
 */
async function handleLogout() {
    try {
        // Show confirmation
        const confirmed = confirm('Are you sure you want to logout?');
        if (!confirmed) return;

        // Sign out from Firebase
        await auth.signOut();

        // Clear session storage
        sessionStorage.clear();

        // Clear local storage
        localStorage.removeItem('krapscare_email');
        localStorage.removeItem('krapscare_remember');

        // Redirect to auth page
        redirectToAuth();

        console.log('✓ User logged out successfully');

    } catch (error) {
        console.error('✗ Logout error:', error);
        alert('Failed to logout. Please try again.');
    }
}

/**
 * Redirect to authentication page
 */
function redirectToAuth() {
    // Use relative path to go back to auth page
    window.location.href = '../auth.html';
}

/**
 * Protect dashboard route
 * Verify user is authenticated before showing content
 */
async function protectRoute() {
    return new Promise((resolve) => {
        if (!auth) {
            // Firebase not initialized yet, reject
            resolve(false);
            return;
        }

        auth.onAuthStateChanged((user) => {
            if (!user) {
                redirectToAuth();
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

/**
 * Add sample data to Firestore (for testing)
 * Remove this in production
 */
async function addSampleData() {
    try {
        const user = auth.currentUser;
        if (!user) return;

        // Add sample service requests
        await db.collection('service_requests').add({
            user_id: user.uid,
            title: 'AC Service',
            description: 'Regular AC maintenance',
            status: 'pending',
            createdAt: new Date().toISOString()
        });

        console.log('✓ Sample data added');
    } catch (error) {
        console.error('✗ Error adding sample data:', error);
    }
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase is available
    if (typeof firebase !== 'undefined') {
        initializeDashboard();
    } else {
        console.error('✗ Firebase not loaded');
        redirectToAuth();
    }

    console.log('✓ Dashboard module loaded');
});

// ============================================================================
// EXPORT FOR USE IN OTHER MODULES
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleLogout,
        getUserData
    };
}
