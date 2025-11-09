# Gemini Integration Data Flow

## Compliance Check Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER UPLOADS FILES                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │    Dashboard.tsx                     │
        │  - File selection                    │
        │  - Metadata extraction               │
        └────────────┬─────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────────────────┐
    │  ComplianceService.storeTemporaryDocuments()       │
    │  - Upload files to Firebase Storage                │
    │  - Store metadata in Firestore                     │
    │  - Return ComplianceDocument[]                     │
    └────────────┬─────────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────────────────┐
    │  ComplianceService.checkComplianceAndStore()       │
    │  - Fetch temporary documents                       │
    │  - Call analyzeDocuments()                         │
    └────────────┬─────────────────────────────────────┘
                 │
                 ├─ Basic Checks:
                 │  • Required documents present?
                 │  • Document age valid?
                 │
                 └─ Gemini Analysis:
                    │
                    ▼
    ┌────────────────────────────────────────────────────┐
    │  GeminiService.extractTextFromFile()               │
    │  - Convert files to text content                   │
    └────────────┬─────────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────────────────┐
    │  GeminiService.analyzeDocumentCompliance()         │
    │  - Send to Gemini API                              │
    │  - Parse JSON response                             │
    │  - Return ComplianceAnalysisResult                 │
    │                                                     │
    │  RETURNS:                                           │
    │  ├─ riskLevel: low/medium/high/critical            │
    │  ├─ score: 0-100                                   │
    │  ├─ findings: []                                   │
    │  ├─ strengths: []                                  │
    │  ├─ weaknesses: []                                 │
    │  └─ recommendations: []                            │
    └────────────┬─────────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────────────────┐
    │  Average scores and combine findings                │
    │  Determine: PASS or FAIL                            │
    └────────────┬─────────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────────────────┐
    │  Return ComplianceCheckResult                       │
    │  - passed: boolean                                  │
    │  - score: averaged number                           │
    │  - issues: string[]                                 │
    │  - recommendations: string[]                        │
    │  - geminiAnalysis: ComplianceAnalysisResult[]       │
    └────────────┬─────────────────────────────────────┘
                 │
                 ▼
                PASS?
                 │
        ┌────────┴────────┐
        │                 │
       YES               NO
        │                 │
        ▼                 ▼
   ACTIVATE USER    GENERATE AUDIT REPORT
```

## Audit Report Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Compliance Check Complete                           │
│              ComplianceCheckResult with geminiAnalysis           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────────────────┐
    │  AuditService.generateAuditReport()                  │
    │  - Receive compliance result                         │
    │  - Receive company name                              │
    └────────────┬─────────────────────────────────────────┘
                 │
                 ├─ Basic Actions:
                 │  • Create report structure
                 │  • Set status: passed/failed
                 │
                 └─ Gemini Summary:
                    │
                    ▼
    ┌──────────────────────────────────────────────────────┐
    │  GeminiService.generateAuditSummary()                │
    │  - Send all findings to Gemini                       │
    │  - Request JSON response                             │
    │                                                       │
    │  SENDS:                                               │
    │  ├─ Company name                                     │
    │  └─ All ComplianceAnalysisResult[]                   │
    │                                                       │
    │  RECEIVES:                                            │
    │  ├─ executiveSummary: string                         │
    │  ├─ keyFindings: string[]                            │
    │  ├─ riskAssessment: string                           │
    │  ├─ requiredActions: string[]                        │
    │  └─ timeline: string                                 │
    └────────────┬─────────────────────────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────────────────────────┐
    │  Store AuditReport in Firestore                      │
    │  ├─ userId                                            │
    │  ├─ timestamp                                         │
    │  ├─ status: passed/failed                             │
    │  ├─ complianceResult (full data)                      │
    │  ├─ recommendations                                   │
    │  ├─ requiredActions                                   │
    │  └─ geminiSummary                                     │
    │      ├─ executiveSummary                             │
    │      ├─ keyFindings                                   │
    │      ├─ riskAssessment                               │
    │      └─ timeline                                      │
    └────────────┬─────────────────────────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────────────────────────┐
    │  Report Complete                                      │
    │  User sees results on dashboard                       │
    └──────────────────────────────────────────────────────┘
```

## Data Structure

```
ComplianceCheckResult {
  passed: boolean
  score: number (0-100)
  issues: string[]
  recommendations?: string[]
  geminiAnalysis?: [
    {
      riskLevel: 'low' | 'medium' | 'high' | 'critical'
      score: number (0-100)
      findings: string[]
      strengths: string[]
      weaknesses: string[]
      recommendations: string[]
    }
  ]
}

AuditReport {
  userId: string
  timestamp: Timestamp
  status: 'passed' | 'failed'
  complianceResult: ComplianceCheckResult
  recommendations?: string[]
  requiredActions?: string[]
  geminiSummary?: {
    executiveSummary: string
    keyFindings: string[]
    riskAssessment: string
    timeline: string
  }
}
```

## Environment Setup

```
Vite App
    │
    ├─ reads: .env.local
    │         ├─ VITE_GEMINI_API_KEY
    │         └─ (import.meta.env)
    │
    └─ passes to GeminiService
       │
       ├─ Initializes GoogleGenerativeAI client
       ├─ Gets generative-ai model: gemini-2.0-flash
       │
       └─ Makes API calls
          └─ google.generativeai endpoint
```

## Error Handling

```
User Uploads
    │
    ├─ TRY:
    │  ├─ Store documents
    │  ├─ Analyze with Gemini (if available)
    │  ├─ Generate audit report
    │  └─ Store in Firestore
    │
    └─ CATCH:
       ├─ Gemini unavailable? → Continue with basic checks
       ├─ Firebase error? → Show detailed error message
       ├─ Network error? → Show network error
       └─ Invalid data? → Show validation error
```
