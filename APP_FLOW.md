# Nexus One - Complete App Flow

## 🎯 Overview
The application implements a **3-stage compliance verification workflow** for managing vendor and client compliance documents. The flow is designed to create temporary user sessions, perform AI-driven compliance analysis, and then promote users to permanent accounts upon successful compliance checks.

---

## 📊 User Journey Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NEXUS ONE - COMPLETE FLOW                          │
└─────────────────────────────────────────────────────────────────────────────┘

START
  │
  ├─► View: "signup"
  │   └─► SIGNUP FORM (Initial Setup)
  │       ├─ First & Last Name
  │       ├─ Email & Password
  │       ├─ Company Name
  │       └─ Account Type: Vendors | Clients | Both (Admin)
  │
  │   ACTION: User submits form
  │   └─► handleSubmit() called
  │
  ├─► State Changes:
  │   ├─ UserService.createTemporaryUserSession()
  │   │  └─► Creates temp session (NO Firebase writes)
  │   │  └─► Stores: tempUserId, email, password (in memory)
  │   ├─ setCurrentUser(tempUser)
  │   └─ setView("audit-waiting")
  │
  │
  ├──────────────────────────────────────────────────────────────────────────┤
  │
  ├─► View: "audit-waiting" + auditResult = null
  │   └─► DASHBOARD (File Upload & Compliance Analysis)
  │       ├─ Header with company name & user greeting
  │       ├─ 3 Tabs:
  │       │  ├─ Dashboard: Compliance overview
  │       │  ├─ Profile: Company profile & documents
  │       │  └─ Upload Documents: File submission ⭐ (ACTIVE)
  │       │
  │       └─ Upload Section:
  │           ├─ File inputs: SOC2, ISO27001, Audit Reports, Insurance Cert
  │           └─ "Upload & Run Compliance Check" button
  │
  │   ACTION: User selects files
  │   └─► handleFileChange() called
  │       └─► selectedFiles state updated
  │       └─► "Files Ready for Review" section appears
  │           ├─ ✅ Green success indicators
  │           ├─ File icons & names
  │           └─ File sizes in KB
  │
  │   ACTION: User clicks "Upload & Run Compliance Check"
  │   └─► handleUpload() called
  │       ├─ onAnalysisStart() callback fired
  │       │  └─► setIsAnalyzing(true)
  │       │
  │       ├─ ComplianceService.checkComplianceAndStore(tempUserId, files)
  │       │  └─► AI analysis with Gemini
  │       │  └─► Compliance score calculated
  │       │  └─► Documents temporarily stored
  │       │
  │       ├─ AuditService.generateAuditReport()
  │       │  └─► Summary generated
  │       │  └─► Required actions listed
  │       │
  │       └─ onAuditResult() callback fired
  │           ├─ setAuditResult(result)
  │           ├─ setIsAnalyzing(false)
  │           └─ Re-render with new state
  │
  │
  ├──────────────────────────────────────────────────────────────────────────┤
  │
  ├─► View: "audit-waiting" + auditResult ≠ null
  │   └─► AUDIT WAITING (Results Screen)
  │
  │   ┌─────────── COMPLIANCE PASSED ───────────┐
  │   │                                          │
  │   │ ✅ Score ≥ threshold (e.g., 70%)        │
  │   │                                          │
  │   │ UI Shows:                                │
  │   │ ├─ Green check icon (large)             │
  │   │ ├─ "Compliance Check Passed" header     │
  │   │ ├─ Compliance score & badge             │
  │   │ ├─ AI summary of findings               │
  │   │ └─ "Create Account & Access Dashboard"  │
  │   │    button (maroon)                      │
  │   │                                          │
  │   │ ACTION: User clicks button               │
  │   │ └─► handleCompliancePassed(userId)      │
  │   │     ├─ UserService.                     │
  │   │     │  createPermanentUserAfterCompliance()
  │   │     │  ├─ Creates Firebase user         │
  │   │     │  ├─ Stores compliance data        │
  │   │     │  └─ Links to temp documents       │
  │   │     ├─ setView("dashboard")             │
  │   │     └─ User promoted to persistent acc. │
  │   └──────────────────────────────────────────┘
  │
  │   ┌─────────── COMPLIANCE FAILED ───────────┐
  │   │                                          │
  │   │ ❌ Score < threshold                    │
  │   │                                          │
  │   │ UI Shows:                                │
  │   │ ├─ Red X icon (large)                   │
  │   │ ├─ "Compliance Check Failed" header     │
  │   │ ├─ Compliance score & reason            │
  │   │ ├─ Required actions to address          │
  │   │ ├─ "Re-upload Documents" button         │
  │   │ └─ "Return to Sign Up" button           │
  │   │                                          │
  │   │ ACTION: "Re-upload Documents"           │
  │   │ └─► handleRetryUpload()                 │
  │   │     ├─ setAuditResult(null)             │
  │   │     ├─ setIsAnalyzing(false)            │
  │   │     └─ Returns to Dashboard (upload tab)│
  │   │     └─► User can select different files │
  │   │                                          │
  │   │ ACTION: "Return to Sign Up"             │
  │   │ └─► setView("signup")                   │
  │   │     └─► User starts over               │
  │   └──────────────────────────────────────────┘
  │
  │   ┌───────── STILL ANALYZING ────────────┐
  │   │                                       │
  │   │ ⏳ Analysis in progress               │
  │   │                                       │
  │   │ UI Shows:                             │
  │   │ ├─ Large animated 🔍 icon           │
  │   │ ├─ "Analyzing your compliance..."   │
  │   │ ├─ Loading spinner                   │
  │   │ ├─ Estimated wait time               │
  │   │ └─ "Checking your documents for:    │
  │   │    - Industry certifications          │
  │   │    - Security standards               │
  │   │    - Insurance coverage"              │
  │   │                                       │
  │   │ [Automatically transitions when      │
  │   │  auditResult is received]            │
  │   └───────────────────────────────────────┘
  │
  │
  ├──────────────────────────────────────────────────────────────────────────┤
  │
  ├─► View: "dashboard" (FINAL STATE)
  │   └─► ANALYTICS DASHBOARD (Post-Compliance)
  │       ├─ Header: "Nexus One - Control Center"
  │       ├─ 3 Tabs:
  │       │  ├─ Dashboard: Analytics & insights
  │       │  ├─ Profile: Company information
  │       │  └─ Upload Documents: Additional files
  │       │
  │       └─ Role-Based Content:
  │           │
  │           ├─ ADMIN account (accountType: "admin")
  │           │  └─ Views:
  │           │     ├─ All vendors + compliance scores
  │           │     ├─ All clients + project counts
  │           │     ├─ Combined risk overview
  │           │     └─ Overall compliance metrics
  │           │
  │           ├─ VENDOR account (accountType: "vendors")
  │           │  └─ Views:
  │           │     ├─ Own company compliance data
  │           │     ├─ Admin's managed clients
  │           │     └─ Client requirements
  │           │
  │           └─ CLIENT account (accountType: "clients")
  │              └─ Views:
  │                 ├─ Own company profile
  │                 ├─ Admin's managed vendors
  │                 └─ Vendor compliance status
  │
  │
  └─► END (User can navigate within dashboard)

```

---

## 🔄 State Management Flow

### App.tsx State Variables
```typescript
// Signup form data
form: SignupPayload {
  firstName, lastName, email, password,
  companyName, accountType, documents?
}

// UI state
view: "signup" | "dashboard" | "audit-waiting"
status: "idle" | "loading" | "success" | "error"
errorMessage: string | null

// User session
currentUser: {
  id: string (tempUserId),
  email: string,
  userData: {
    firstName, lastName, companyName,
    accountType, email
  },
  password?: string (temp storage)
}

// Compliance analysis
auditResult: AuditResult | null {
  tempUserId, status, complianceScore,
  complianceResult, geminiSummary,
  requiredActions, timestamp
}

isAnalyzing: boolean
```

---

## 🔐 Authentication Flow

### Step 1: Temporary User Session
```typescript
// ✅ Creates in-memory session
UserService.createTemporaryUserSession(userData, password)
└─► Returns: { id: tempUserId, userData, password }
└─► NO Firebase writes yet
└─► NO documents created
└─► NO authentication tokens issued
```

### Step 2: Compliance Analysis
```typescript
// Files are analyzed but NOT saved to Firebase user account yet
ComplianceService.checkComplianceAndStore(tempUserId, files)
└─► Performs AI analysis
└─► Generates compliance score
└─► Stores results temporarily
└─► Returns: ComplianceCheckResult

AuditService.generateAuditReport(tempUserId, result, companyName)
└─► Generates human-readable summary
└─► Lists required actions
└─► Returns: AuditReport
```

### Step 3: Permanent Account Creation (Compliance Passed Only)
```typescript
// ✅ Only creates permanent account after compliance passes
UserService.createPermanentUserAfterCompliance(userData, password)
└─► Creates Firebase Auth user
└─► Creates Firestore document in "users" collection
└─► Stores compliance data
└─► Links temporary documents to user account
└─► Issues auth tokens
```

---

## 🎨 Component Structure

### 1. App.tsx
- **Purpose**: Main orchestrator, manages all state & views
- **Responsibilities**:
  - Form state management
  - View switching (signup → audit-waiting → dashboard)
  - User session creation & management
  - Callbacks to child components
  - Error handling & messaging

### 2. Dashboard.tsx
- **Purpose**: File upload interface & analytics display
- **Props**:
  - `userProfile`: UserProfile object with user data
  - `onAuditResult(result)`: Callback when compliance analysis completes
  - `onAnalysisStart()`: Callback when upload starts
- **Features**:
  - 3 tabs: Overview, Profile, Upload
  - File upload with visual feedback
  - Role-based content display
  - Compliance metrics visualization

### 3. AuditWaiting.tsx
- **Purpose**: Compliance result display & transition screen
- **Props**:
  - `auditResult`: Compliance analysis results
  - `isAnalyzing`: Loading state
  - `onCompliancePassed(userId)`: Callback for successful compliance
  - `onRetryUpload()`: Callback to re-upload files
- **Features**:
  - Loading animation during analysis
  - Pass/Fail result screens
  - Required actions display
  - Retry & navigation options

---

## 🚀 Key Transitions

### ✅ Happy Path (Successful Compliance)
```
Signup Form
    ↓
  ✓ Form submitted
    ↓
Temp User Session Created
    ↓
Dashboard (Upload Tab)
    ↓
  ✓ Files selected & uploaded
    ↓
Analysis Running (Loading Screen)
    ↓
  ✓ Compliance Score ≥ Threshold
    ↓
AuditWaiting (Pass Screen)
    ↓
  ✓ "Create Account" clicked
    ↓
Permanent Account Created
    ↓
Analytics Dashboard
```

### ⚠️ Retry Path (Failed Compliance)
```
AuditWaiting (Fail Screen)
    ↓
  ✓ "Re-upload Documents" clicked
    ↓
Dashboard (Upload Tab Focused)
    ↓
  ✓ Select Different Files
    ↓
Analysis Running (Loading Screen)
    ↓
  ✓ Compliance Score ≥ Threshold (success or fail again)
    ↓
AuditWaiting (Result Screen)
```

### 🔄 Restart Path (User Gives Up)
```
AuditWaiting (Fail Screen)
    ↓
  ✓ "Return to Sign Up" clicked
    ↓
Signup Form (Fresh Start)
    ↓
[User can create new account]
```

---

## 📱 UI States & Views

### View 1: Signup Form
- **When**: App loads OR user clicks "Return to Sign Up"
- **Visible**: Signup form with all fields
- **Disabled**: Based on `status === "loading"`
- **Messages**: Success/error feedback

### View 2: Dashboard (Upload Mode)
- **When**: After successful form submission
- **Visible**: Dashboard with 3 tabs
- **Focus**: "Upload Documents" tab pre-selected
- **Upload Section**: Shows file inputs & "Files Ready for Review" feedback

### View 3: Loading Screen
- **When**: `isAnalyzing === true && auditResult === null`
- **Visible**: Large pulsing 🔍 emoji & loading text
- **Blocks**: User interaction
- **Duration**: Until compliance analysis completes

### View 4: Pass Screen
- **When**: `auditResult.complianceScore ≥ threshold`
- **Visible**: Green checkmark, score, summary, action button
- **Action**: "Create Account & Access Dashboard"

### View 5: Fail Screen
- **When**: `auditResult.complianceScore < threshold`
- **Visible**: Red X, score, required actions, 2 buttons
- **Actions**: "Re-upload Documents" or "Return to Sign Up"

### View 6: Analytics Dashboard
- **When**: `view === "dashboard"` && `auditResult === null`
- **Visible**: Full dashboard with role-based content
- **Tabs**: Overview, Profile, Upload
- **Content**: Role-specific analytics

---

## 🛡️ Security Considerations

1. **No Permanent Account Until Compliance Passes**
   - Temporary sessions are ephemeral
   - Files stored only temporarily
   - Auth tokens not issued until account creation

2. **Role-Based Access Control**
   - Dashboard content varies by `accountType`
   - Admin sees all data; Vendors/Clients see relevant data
   - Firestore security rules enforce access

3. **Data Isolation**
   - Temporary documents in separate collection
   - Permanent documents linked to user account
   - Clear separation between temp & permanent storage

---

## 🔗 API/Service Integration Points

### UserService
- `createTemporaryUserSession()` - Creates in-memory session
- `createPermanentUserAfterCompliance()` - Creates Firebase user

### ComplianceService
- `checkComplianceAndStore()` - Performs AI analysis
- `getAllVendors()`, `getAllClients()` - Dashboard data

### AuditService
- `generateAuditReport()` - Creates compliance summary

### Gemini AI
- Analyzes compliance documents
- Generates score (0-100)
- Creates human-readable summary

---

## 📊 Data Flow Summary

```
User Input
    ↓
handleSubmit()
    ↓
createTemporaryUserSession()
    ↓
[In-Memory State Updates]
    ├─► currentUser
    ├─► form
    └─► view = "audit-waiting"
    ↓
Dashboard Renders
    ↓
User Selects Files
    ↓
handleUpload()
    ↓
ComplianceService.checkComplianceAndStore()
    ↓
AuditService.generateAuditReport()
    ↓
[State Updates]
    ├─► auditResult
    ├─► isAnalyzing = false
    └─► Re-render
    ↓
AuditWaiting Shows Result
    ↓
[User Decision]
    ├─► ✅ Pass: handleCompliancePassed()
    │   └─► createPermanentUserAfterCompliance()
    │   └─► view = "dashboard"
    │
    ├─► ❌ Fail: handleRetryUpload()
    │   └─► view stays "audit-waiting"
    │   └─► auditResult = null
    │   └─► Re-render Dashboard
    │
    └─► ❌ Fail: setView("signup")
        └─► Back to signup form
```

---

## 🎯 Next Steps

**Not Yet Implemented:**
- [ ] Login with existing credentials
- [ ] OAuth integration
- [ ] Email verification
- [ ] Password reset flow
- [ ] Multi-step document upload
- [ ] Document versioning
- [ ] Team management
- [ ] Integration with backend APIs

**To Complete Analytics Dashboard:**
- Implement role-based filtering in Dashboard component
- Add data visualization charts (risk scores, compliance trends)
- Implement pagination for vendor/client lists
- Add search & filter functionality
- Create export/reporting features

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app orchestrator |
| `src/dashboard.tsx` | Upload & analytics UI |
| `src/AuditWaiting.tsx` | Compliance results screen |
| `src/services/userService.ts` | User management |
| `src/services/complianceService.ts` | Compliance analysis |
| `src/services/auditService.ts` | Report generation |

---

Generated: November 9, 2025
