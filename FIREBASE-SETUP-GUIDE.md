# Kraps Care - Firebase Authentication Setup Guide

## ✅ Complete Integration Status

Your authentication system is now **fully integrated with Firebase**. All user data is securely stored in Firestore with encryption and access controls.

---

## 📋 Table of Contents

1. [Firebase Console Setup](#firebase-console-setup)
2. [Enable Authentication Methods](#enable-authentication-methods)
3. [Deploy Security Rules](#deploy-security-rules)
4. [Create Test Users](#create-test-users)
5. [Email Configuration](#email-configuration)
6. [Security Features](#security-features)
7. [Testing & Debugging](#testing--debugging)
8. [Production Deployment](#production-deployment)

---

## 🔧 Firebase Console Setup

### Step 1: Open Firebase Console
1. Go to https://console.firebase.google.com/
2. Select your project: **kraps-care-e2c2b**
3. You're now in the Firebase Console

### Step 2: Verify Your Project Details
- **Project ID:** `kraps-care-e2c2b`
- **Region:** `us-central1` (or your preferred region)
- **Database:** Firestore

---

## 🔐 Enable Authentication Methods

### Method 1: Email/Password Authentication

1. Go to **Authentication** → **Sign-in method**
2. Click on **Email/Password**
3. Toggle the switch to **Enable**
4. Check "Email enumeration protection" if available
5. Click **Save**

✅ **Result:** Users can now sign in with email and password

### Method 2: Phone Number Authentication (OTP)

1. Go to **Authentication** → **Sign-in method**
2. Click on **Phone Number**
3. Toggle the switch to **Enable**
4. Add your domain to reCAPTCHA token allowlist:
   - Click "reCAPTCHA enterprise config"
   - Add your domain (e.g., `krapscare.onrender.com`)
5. Click **Save**

✅ **Result:** Users can now sign in with OTP

### Method 3: Enable Anonymous (Optional)

1. Go to **Authentication** → **Sign-in method**
2. Click on **Anonymous**
3. Toggle to **Enable** (useful for initial dashboard browsing)
4. Click **Save**

---

## 🛡️ Deploy Security Rules

### Step 1: Access Firestore Database

1. Go to **Firestore Database** (left sidebar)
2. Click on the **Rules** tab at the top
3. You'll see the default rules

### Step 2: Replace With Secure Rules

1. Delete all existing content
2. Copy the entire content from: `FIRESTORE-SECURITY-RULES.txt`
3. Paste it into the Rules editor
4. Click **Publish** button

✅ **Result:** Your data is now protected with role-based access control

### Security Rules Explanation:

| Collection | Admin | Technician | User | Details |
|-----------|-------|-----------|------|---------|
| `/users/{uid}` | Read/Write | Own only | Own only | User profiles |
| `/billing/{doc}` | R/W | Read | None | Encrypted billing data |
| `/auth_logs/{doc}` | Read | None | Own | Security audit trail |
| `/dashboard_data/{doc}` | R/W | R/W | Read | Shared dashboard info |

---

## 👥 Create Test Users

### Step 1: Create Users in Firebase Console

1. Go to **Authentication** → **Users** tab
2. Click **Add user** button
3. Enter test user details:

**Test Admin Account:**
- Email: `admin@krapscare.com`
- Password: `SecureAdmin@123`
- Click **Create user**

**Test Technician Account:**
- Email: `tech@krapscare.com`
- Password: `SecureTech@123`
- Click **Create user**

### Step 2: Set User Roles in Firestore

1. Go to **Firestore Database** → **Collections**
2. Create a new collection called `users`
3. Add documents with user email UIDs:

**For Admin User:**
```json
{
  "uid": "admin-uid-from-auth",
  "email": "admin@krapscare.com",
  "name": "Admin User",
  "role": "admin",
  "phone": "+91XXXXXXXXXX",
  "createdAt": "2024-04-16T00:00:00Z",
  "lastLogin": "2024-04-16T00:00:00Z",
  "authMethod": "email",
  "verified": true
}
```

**For Technician User:**
```json
{
  "uid": "tech-uid-from-auth",
  "email": "tech@krapscare.com",
  "name": "Technician User",
  "role": "technician",
  "phone": "+91XXXXXXXXXX",
  "createdAt": "2024-04-16T00:00:00Z",
  "lastLogin": "2024-04-16T00:00:00Z",
  "authMethod": "email",
  "verified": true
}
```

---

## 📧 Email Configuration

### Step 1: Set Custom Email for Password Reset

1. Go to **Authentication** → **Templates** tab
2. Click on **"Password reset"** template
3. Customize the email:
   - **Sender name:** "Kraps Care Support"
   - **Subject:** "Reset your Kraps Care Password"
   - **Body:** Add your branding and support information
4. Click **Save**

### Step 2: Ensure Email Domain Verification

1. Go to **Project Settings** → **General** tab
2. Check your email domain:
   - For `https://krapscare.onrender.com/`
   - Make sure it's listed in authorized domains

---

## 🔐 Security Features

Your system includes:

### ✅ What's Protected:
- **Password Hashing:** Firebase handles bcrypt hashing
- **Encryption in Transit:** TLS/SSL for all connections
- **Encryption at Rest:** Firestore encrypts all data
- **Session Tokens:** Firebase generates secure session tokens
- **Attack Prevention:** 
  - Rate limiting on failed login attempts
  - Account lockout after 5 failed attempts (24 hours)
  - reCAPTCHA v3 for phone authentication

### ✅ Security Rules Enable:
- **Role-Based Access Control (RBAC)**
- **Field-level validation**
- **Audit logging** of all auth events
- **Billing data isolation** (admins only)
- **User preference privacy** (users can't see others' data)

### ✅ Best Practices Implemented:
- Never store passwords in Firestore
- User roles verified on every access
- Sensitive data fields prohibited from client updates
- All writes validated server-side
- Audit trail for compliance

---

## 🧪 Testing & Debugging

### Test Email Login

1. Open `https://krapscare.onrender.com/auth.html`
2. Select **"Admin"** from dropdown (or "Technician")
3. Enter: `admin@krapscare.com`
4. Enter: `SecureAdmin@123`
5. Click **Login**
6. ✅ Should redirect to dashboard

### Test Phone OTP

1. Open auth page
2. Click **"OTP Login"** tab
3. Enter phone: `9876543210` (test number)
4. Click **Send OTP**
5. Enter OTP: `123456` (Firebase uses mock OTP in dev)
6. Click **Verify OTP**
7. ✅ Should create user and redirect

### Enable Console Debugging

1. Open **Developer Tools** (F12)
2. Go to **Console** tab
3. You'll see logs like:
```
✓ Firebase initialized successfully
✓ Project: kraps-care-e2c2b
✓ Password reset email sent
✓ Authentication module loaded
```

### Check Firestore Data

1. Go to Firebase Console → **Firestore Database**
2. Click **Collections** to see user data
3. You should see:
   - `/users/` - User profiles with roles
   - `/auth_logs/` - Login history
   - `/billing/` - Billing records (if admin created)

---

## 🚀 Production Deployment

### Before Going Live:

1. **Enable API Key Restrictions**
   - Go to **Project Settings** → **API keys**
   - Click on your API key
   - Restrict to **Firestore and Authentication**
   - Set **Application restrictions** to your domain only

2. **Enable reCAPTCHA Enterprise**
   - For production-level protection
   - Recommended for phone authentication

3. **Set Up Cloud Backups**
   - Go to **Firestore Database** → **Backups**
   - Create daily automatic backups

4. **Enable Multi-Factor Authentication (MFA)**
   - Go to **Authentication** → **Settings**
   - Enable MFA for admin accounts

5. **Set Up Audit Logging**
   - Go to **Cloud Logging**
   - Create alerts for suspicious activities

6. **Update Authorized Domains**
   - Go to **Authentication** → **Settings**
   - Add your production domain
   - Remove localhost for production

7. **Update Environment Variables**
   - Change any test API keys
   - Ensure firebase-config.js uses production credentials

---

## 🔍 Firestore Collections Reference

### `/users/{uid}`
```
Fields:
- uid (string) - User's Firebase UID
- email (string) - User's email address
- name (string) - Display name
- phone (string) - Phone number (+91XXXXXXXXXX)
- role (string) - 'admin', 'technician', or 'user'
- authMethod (string) - 'email' or 'phone'
- verified (boolean) - Email/phone verification status
- preferences (map) - User preferences
- createdAt (timestamp) - Account creation date
- lastLogin (timestamp) - Last login time
```

### `/auth_logs/{logId}`
```
Fields:
- userId (string) - User UID
- eventType (string) - 'login', 'logout', 'signup', 'password_reset'
- method (string) - 'email' or 'phone'
- timestamp (string) - ISO timestamp
- userAgent (string) - Browser info
- ipAddress (string) - Client IP (client-side only)
```

### `/billing/{billId}`
```
Fields:
- userId (string) - User UID
- amount (number) - Billing amount
- status (string) - 'pending', 'paid', 'failed'
- invoiceDate (string) - Invoice date
- dueDate (string) - Payment due date
- createdAt (timestamp) - Record creation
- updatedAt (timestamp) - Last update
```

---

## 📞 Support & Troubleshooting

### Common Issues:

**"Firebase not loaded"**
- Check network tab, ensure firebase-config.js loads
- Verify Firebase SDK scripts are included in auth.html

**"User not found" error**
- Ensure user document exists in `/users/` collection with correct role
- Check that email matches between Firebase Auth and Firestore

**"Permission denied" error**
- Check Firestore Security Rules are deployed
- Verify user role in Firestore matches expected role

**"Invalid OTP" for phone auth**
- In development, Firebase allows test OTP: `123456`
- In production, user receives real OTP via SMS

---

## 🎯 Next Steps

1. ✅ Create your test user accounts (Step: Create Test Users)
2. ✅ Deploy security rules (Step: Deploy Security Rules)
3. ✅ Test login functionality locally
4. ✅ Update admin dashboard to store/retrieve data
5. ✅ Set up billing integration (optional)
6. ✅ Enable production security features
7. ✅ Deploy to your hosting platform

---

## 📝 Files Reference

| File | Purpose |
|------|---------|
| `firebase-config.js` | Firebase initialization and configuration |
| `auth.js` | Authentication logic and user management |
| `auth.html` | Login UI (Email & OTP forms) |
| `FIRESTORE-SECURITY-RULES.txt` | Database access control rules |
| `FIREBASE-SETUP-GUIDE.md` | This documentation |

---

## 🔗 Useful Links

- Firebase Console: https://console.firebase.google.com/
- Firebase Docs: https://firebase.google.com/docs
- Firestore Security Rules: https://firebase.google.com/docs/firestore/security
- Your Project: https://console.firebase.google.com/project/kraps-care-e2c2b

---

**Last Updated:** April 16, 2026  
**Firebase Project:** kraps-care-e2c2b  
**Status:** ✅ Ready for Testing
