# AI Agent Instructions for HackUTD-Nexus

## Project Overview
HackUTD-Nexus is a React + TypeScript application built with Vite that provides a vendor/client management system with document upload capabilities. The application focuses on security and compliance document management.

## Architecture

### Key Components
- **App.tsx**: Main entry point handling user signup and authentication
- **dashboard.tsx**: Dashboard view for document uploads and profile management
- **Firebase Integration**: Backend service (to be implemented)

### Data Flow
1. User signup via form (`App.tsx`)
2. Authentication state management using React state
3. Document upload handling in dashboard (`dashboard.tsx`)
4. Future integration with Firebase backend

## Development Workflow

### Setup
```bash
cd my-react-app
npm install
npm run dev
```

### Key Scripts
- `npm run dev`: Start development server
- `npm run build`: Build production version
- `npm run lint`: Run ESLint checks

## Project Conventions

### Component Structure
- Inline styling pattern using style objects
- State management with React hooks
- TypeScript types defined at component level
- Prop interfaces/types prefixed with component name (e.g., `DashboardProps`)

### Type Definitions
```typescript
type SignupPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
  accountType: "vendors" | "clients" | "admin";
};
```

### File Upload Pattern
Document upload handling in `dashboard.tsx`:
- Multiple file selection support
- File type restrictions (PDF, DOCX, TXT)
- Size tracking and display

## Integration Points

### Backend Integration (TODO)
Replace mock implementations in:
- `App.tsx`: Signup endpoint `/api/signup`
- `dashboard.tsx`: File upload endpoint (to be implemented)

### Firebase Configuration (Pending)
Firebase integration to be added for:
- User authentication
- Document storage
- Security rules

## Common Tasks

### Adding New Form Fields
1. Add type to `SignupPayload`
2. Update state in `form` useState
3. Add input element with consistent styling
4. Include in submit payload

### Styling Patterns
Follow existing style objects pattern:
- Border radius: 8px/16px
- Color scheme: #020617 (background), #4f46e5 (primary)
- Shadow: `box-shadow: "0 20px 50px rgba(15,23,42,0.4)"`