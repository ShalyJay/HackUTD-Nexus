# Updated Failed Audit Flow

## New Retry Upload Feature

When a user **fails the compliance audit**, they now have **two options**:

### Before (Old Flow)
```
❌ Compliance Failed
    ↓
Show Issues & Required Actions
    ↓
ONE Option: "Return to Sign Up"
    ↓
Session Destroyed
    ↓
User must restart entire signup
```

### After (New Flow) ✅
```
❌ Compliance Failed
    ↓
Show Issues & Required Actions
    ↓
TWO Options:
├─ "Re-upload Documents" → Go back to dashboard
│   └─ Upload new/additional documents
│   └─ Gemini re-analyzes
│   └─ New audit result (can pass or fail again)
│   └─ Repeat as needed
│
└─ "Return to Sign Up" → Start over completely
    └─ Session destroyed
    └─ All data cleared
    └─ Return to signup form
```

## Implementation Details

### Updated State Flow in App.tsx

```typescript
// New handler function
const handleRetryUpload = () => {
  setAuditResult(null);      // Clear audit result
  setIsAnalyzing(false);     // Reset analyzing state
  // Stays in "audit-waiting" view
  // Shows Dashboard again for file re-upload
};
```

### Updated Logic in Audit-Waiting View

```
if (view === "audit-waiting") {
  if (!auditResult) {
    // Show Dashboard for file upload
    return <Dashboard ... />;
  }
  
  // Show Audit Result Screen
  if (auditResult.status === "passed") {
    // Pass screen with "Continue to Dashboard" button
  } else if (auditResult.status === "failed") {
    // Fail screen with TWO buttons:
    // 1. "Re-upload Documents" → calls handleRetryUpload()
    // 2. "Return to Sign Up" → window.location.href = "/"
  }
}
```

## User Journey - Retry Scenario

```
1. User fails with score 45/100
   
2. Views audit report with issues:
   • Missing cybersecurity documentation
   • Financial records are outdated
   • Risk assessment incomplete

3. Options:
   
   OPTION A: Re-upload Documents ✅
   ├─ Gathers updated/missing docs
   ├─ Goes back to dashboard
   ├─ Uploads new files
   ├─ Gemini re-analyzes (might be score 62/100)
   ├─ Still fails (need 70+)
   ├─ Can retry again OR...
   └─ Eventually passes and creates account
   
   OPTION B: Start Over
   ├─ Session destroyed
   ├─ Returns to signup page
   └─ Must re-enter all information
```

## State Transitions

| Current State | Trigger | New State | Result |
|---|---|---|---|
| `auditResult.status === "failed"` | Click "Re-upload Documents" | `auditResult = null, isAnalyzing = false` | Shows Dashboard again |
| `auditResult = null` | Select new files | `isAnalyzing = true` | Triggers analysis |
| Analysis completes | Gemini finishes | `auditResult = newResult` | Shows audit result screen |
| `auditResult.status === "failed"` | Click "Return to Sign Up" | Redirect to `/` | Full page reload, new signup |

## Key Benefits

✅ **User-Friendly**: No data loss, users can improve and resubmit  
✅ **Flexible**: Multiple attempts without restarting signup  
✅ **Clear Path**: Issues shown → Actions provided → Easy retry  
✅ **Non-Destructive**: Original form data stays in memory during retries  
✅ **Session Persistence**: Can keep trying until passing (or give up with Return option)  

## Files Modified

- `src/AuditWaiting.tsx` - Added `onRetryUpload` prop, updated failed audit UI
- `src/App.tsx` - Added `handleRetryUpload()` handler, passes callback to AuditWaiting
- Build status: ✅ All errors resolved, production build successful
