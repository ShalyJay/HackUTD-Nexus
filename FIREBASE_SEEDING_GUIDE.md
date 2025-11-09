# Firebase Seeding Guide

## Overview
The application now automatically seeds Firebase with mock data on first load. This includes mock vendors, mock clients, compliance standards, and an admin account.

## What Gets Created

### 1. Admin Account
- **Email:** admin@hackutd.com
- **Password:** AdminPassword123!
- **Company:** HackUTD-Nexus
- **Role:** admin
- **Status:** active

The admin account is stored in:
- Firebase Auth (for login)
- Firestore `users` collection under ID `admin_001`

### 2. Mock Vendors (4 vendors)
Stored in `users` collection with `accountType: "vendors"`:

1. **TechSecure Solutions** (Sarah Chen)
   - Email: sarah.chen@techsecure.com
   - Compliance Score: 92%
   - Risk Level: Low Risk
   - Status: Active

2. **CloudInfra Inc** (Michael Rodriguez)
   - Email: michael.rodriguez@cloudinfra.io
   - Compliance Score: 87%
   - Risk Level: Low Risk
   - Status: Active

3. **DataFlow Analytics** (Jessica Patel)
   - Email: jessica.patel@dataflow.ai
   - Status: Pending (incomplete onboarding)

4. **SecureNet Technologies** (David Kim)
   - Email: david.kim@securenet.com
   - Compliance Score: 78%
   - Risk Level: Medium Risk
   - Status: Active

### 3. Mock Clients (3 clients)
Stored in `users` collection with `accountType: "clients"`:

1. **Enterprise Corp** (Emily Watson)
   - Email: emily.watson@enterprise.com
   - Active Reviews: 4
   - Vendor Count: 12

2. **FinTech Solutions** (James Miller)
   - Email: james.miller@fintech.co
   - Active Reviews: 2
   - Vendor Count: 8

3. **HealthCare Plus** (Amanda Thompson)
   - Email: amanda.thompson@healthcare.net
   - Active Reviews: 6
   - Vendor Count: 15

### 4. Compliance Standards (4 standards)
Stored in `compliance_standards` collection:

1. **SOC2 Standards.pdf**
   - Contains SOC 2 Type II control objectives

2. **ISO 27001 Standards.pdf**
   - Contains ISO 27001 requirements

3. **HIPAA Compliance Guide.pdf**
   - Contains HIPAA privacy and security rules

4. **PCI-DSS Standards.pdf**
   - Contains PCI DSS requirements

## How It Works

1. On first app load, the `useEffect` in `App.tsx` checks `localStorage` for a `firebaseSeeded` flag
2. If not present, it calls `seedFirebase()` from `seedFirebase.ts`
3. The seeding function:
   - Creates/verifies the admin account in Firebase Auth
   - Creates admin user document in Firestore
   - Adds all mock vendors to the `users` collection
   - Adds all mock clients to the `users` collection
   - Adds all compliance standards to the `compliance_standards` collection
4. Sets the `firebaseSeeded` flag to `true` to prevent re-seeding on subsequent loads

## Manual Seeding

If you need to manually trigger seeding again, clear localStorage:
```javascript
localStorage.removeItem("firebaseSeeded");
// Then reload the page
```

Or import and call directly:
```typescript
import { seedFirebase } from "./seedFirebase";
await seedFirebase();
```

## Admin Dashboard Data

When logged in as admin:
- **Overview Tab:** Shows all 4 vendors and 3 clients split into separate sections
- **Compliance Validation:** Uses the 4 stored compliance standards
- **Upload Tab:** Can upload and store additional compliance standards

## Testing the Admin Dashboard

1. Click "Have an account? Log In" on the signup page
2. Enter:
   - Email: `admin@hackutd.com`
   - Password: `AdminPassword123!`
3. You'll see the admin dashboard with:
   - 4 vendors listed with scores and risk levels
   - 3 clients listed with their active reviews
   - Upload tab to manage compliance standards

## Notes

- Data is only seeded once (tracked by localStorage)
- Duplicate entries are checked by email to prevent duplicates
- Timestamps are set to current time
- All data is purely for demo/testing purposes
- Mock vendors have varying compliance scores and statuses
