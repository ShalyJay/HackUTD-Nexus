# Firebase Setup Guide

## Required Firebase Configuration Steps

### 1. Enable Authentication Methods
In your Firebase Console:
1. Go to **Authentication** section
2. Click on **Sign-in method**
3. Enable **Email/Password** authentication
4. Make sure it says "Enabled" with a checkmark

### 2. Create Firestore Database
1. Go to **Firestore Database**
2. Click **Create database**
3. Start in **production mode** (or test mode for development)
4. Choose your region
5. Click **Create**

### 3. Storage Rules (if needed)
1. Go to **Storage**
2. Click on **Rules** tab
3. Update rules to allow authenticated users:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Firestore Security Rules
1. Go to **Firestore Database**
2. Click on **Rules** tab
3. Update rules to allow authenticated users:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Issue: "Failed to create account"
Check the browser console (F12 or Cmd+Option+I) for specific error messages:
- **"Email already in use"** - The email is already registered
- **"Weak password"** - Password must be at least 6 characters
- **"Operation not allowed"** - Email/Password authentication not enabled in Firebase Console
- **"Missing or insufficient permissions"** - Firestore rules need to be updated

### Issue: Can't access Firestore
Make sure your Firestore security rules allow authenticated users to read/write documents.

### Issue: Files won't upload
Check that Storage rules are updated and Storage is enabled in your Firebase project.

## Testing the Connection

If you get errors, check:
1. Open browser console (F12)
2. Look for red error messages
3. Check if auth is initialized
4. Verify Firebase config is correct
5. Ensure Firebase services are enabled in the Console
