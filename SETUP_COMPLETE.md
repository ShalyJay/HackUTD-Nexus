# Firebase Admin & Mock Data Setup

## What Was Just Created

✅ **seedFirebase.ts** - Automatic seeding script that runs on first app load
✅ **Admin Account** - Created in both Firebase Auth and Firestore
✅ **Mock Vendors** - 4 vendors with varying compliance scores
✅ **Mock Clients** - 3 clients with active reviews
✅ **Compliance Standards** - 4 industry standards (SOC2, ISO27001, HIPAA, PCI-DSS)

## Quick Start

1. **Next time you load the app**, it will automatically seed Firebase with all the mock data
2. **To log in as admin:**
   - Click "Have an account? Log In"
   - Email: `admin@hackutd.com`
   - Password: `AdminPassword123!`

3. **What You'll See in Admin Dashboard:**
   - Overview tab: 4 vendors (2 active, 1 medium risk, 1 pending) and 3 clients
   - Profile tab: Your admin company info
   - Upload tab: Upload and manage compliance standards

## Firebase Collections Structure

### `users` Collection
Contains all users (admin, vendors, clients) with structure:
```
{
  userId: string,
  firstName: string,
  lastName: string,
  email: string,
  companyName: string,
  accountType: "admin" | "vendors" | "clients",
  status: "active" | "pending" | "suspended",
  onboardingComplete: boolean,
  createdAt: Timestamp,
  lastUpdated: Timestamp,
  // Additional fields for vendors:
  score?: number,
  riskLevel?: string,
  documents?: string[],
  // Additional fields for clients:
  activeReviews?: number,
  vendorCount?: number
}
```

### `compliance_standards` Collection
Contains compliance frameworks uploaded by admin:
```
{
  fileName: string,
  fileSize: number,
  fileType: string,
  uploadedBy: string,
  uploadedAt: Timestamp,
  description: string,
  content: string
}
```

## Admin Account Details

**In Firebase Auth:**
- Email: admin@hackutd.com
- Password: AdminPassword123!

**In Firestore (`users/admin_001`):**
```json
{
  "userId": "admin_001",
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@hackutd.com",
  "companyName": "HackUTD-Nexus",
  "accountType": "admin",
  "status": "active",
  "onboardingComplete": true,
  "createdAt": Timestamp,
  "lastUpdated": Timestamp
}
```

## Mock Vendors Included

| Company | Contact | Email | Score | Status |
|---------|---------|-------|-------|--------|
| TechSecure Solutions | Sarah Chen | sarah.chen@techsecure.com | 92% | Active |
| CloudInfra Inc | Michael Rodriguez | michael.rodriguez@cloudinfra.io | 87% | Active |
| DataFlow Analytics | Jessica Patel | jessica.patel@dataflow.ai | Pending | Pending |
| SecureNet Technologies | David Kim | david.kim@securenet.com | 78% | Active |

## Mock Clients Included

| Company | Contact | Email | Active Reviews | Vendors |
|---------|---------|-------|-----------------|---------|
| Enterprise Corp | Emily Watson | emily.watson@enterprise.com | 4 | 12 |
| FinTech Solutions | James Miller | james.miller@fintech.co | 2 | 8 |
| HealthCare Plus | Amanda Thompson | amanda.thompson@healthcare.net | 6 | 15 |

## How Auto-Seeding Works

1. App loads → checks `localStorage.firebaseSeeded`
2. If flag doesn't exist → runs `seedFirebase()`
3. `seedFirebase()` creates:
   - Admin account in Firebase Auth
   - All users in Firestore
   - All compliance standards in Firestore
4. Sets `localStorage.firebaseSeeded = "true"` to prevent re-seeding

## If You Need to Re-seed

To clear the mock data and re-seed:

**Option 1: Browser DevTools**
```javascript
localStorage.removeItem("firebaseSeeded");
location.reload();
```

**Option 2: Clear localStorage in your app**
- Open browser console
- Run: `localStorage.clear()` and reload

## Features Now Available to Test

✅ Admin login with mock admin account
✅ View all vendors and clients in admin dashboard
✅ Upload compliance standards (stored in Firestore)
✅ View compliance standards framework
✅ See role-based data (admin sees all, clients see vendors, vendors see clients)
✅ Compliance validation section uses real standards data

## Next Steps

- Test admin dashboard with mock data
- Try uploading new compliance standards
- Test vendor/client signup and compliance review
- Verify data appears correctly in dashboard analytics
