# HackUTD-Nexus AI Agent Instructions

## Project Overview
Fintech compliance and auditing platform built with React + TypeScript + Vite, integrating Firebase services and Google's Gemini AI for document analysis.

## Architecture

### Core Services
- **Firebase Integration** (`firebase.ts`)
  - Authentication
  - Firestore for data
  - Storage for documents

- **Service Layer** (`src/services/`)
  - `geminiService.ts` - AI document analysis
  - `complianceService.ts` - Compliance checks
  - `auditService.ts` - Report generation
  - `userService.ts` - User management

### Key Data Flows
1. User uploads documents → ComplianceService
2. ComplianceService → Firebase Storage + GeminiService
3. AuditService → Generated reports stored in Firestore
4. Results displayed in Dashboard

## Development Patterns

### State Management
- React's useState for component-level state
- User session state in App.tsx flows down through props
- Example in `App.tsx`:
```typescript
const [view, setView] = useState<"signup" | "dashboard" | "audit-waiting">("signup");
const [currentUser, setCurrentUser] = useState<any>(null);
```

### Component Structure
1. **Smart Container Components** (`App.tsx`, `dashboard.tsx`)
   - Handle data fetching and state
   - Pass data down as props
2. **Presentation Components** (`AuditWaiting.tsx`, `Chatbot.tsx`)
   - Receive data via props
   - Focus on UI rendering

### Service Pattern
- Services are static classes
- Each service focuses on one domain
- Firebase operations centralized in services
- Example pattern:
```typescript
export class ServiceName {
  private static readonly COLLECTION = 'collectionName';
  static async methodName() {
    // Implementation
  }
}
```

## Environment Setup
1. Create `.env.local` from `.env.local.example`
2. Required variables:
   - `VITE_GEMINI_API_KEY`

## Common Tasks

### Adding New Features
1. Determine service layer impact
2. Update/create relevant service methods
3. Add UI components
4. Wire up through props/state

### Debugging Firebase
- Use `firebaseDebugService.ts` for debugging
- Check Firebase console for logs
- Verify environment variables

## Key Files for Context
1. `FINAL_STATUS.md` - Latest architecture
2. `GEMINI_INTEGRATION_SUMMARY.md` - AI integration details
3. `src/services/geminiService.ts` - AI implementation
4. `src/dashboard.tsx` - Main UI flows