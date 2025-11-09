# Gemini API Integration Setup

## Overview

The compliance and auditing services are now integrated with Google's Gemini AI API for intelligent document analysis and audit report generation.

## What Gemini Does

1. **Document Analysis**: Analyzes uploaded compliance documents and identifies risks, findings, strengths, and weaknesses
2. **Compliance Scoring**: Provides intelligent compliance scores based on document content
3. **Audit Report Generation**: Creates comprehensive audit reports with executive summaries and required actions
4. **Risk Assessment**: Categorizes risk levels as low, medium, high, or critical

## Setup Instructions

### Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Click "Get API Key" button
3. Create a new API key in Google Cloud Console or use the quick access link
4. Copy your API key

### Step 2: Add API Key to Your Project

1. In the `my-react-app` folder, locate or create a `.env.local` file
2. Add the following line (replacing with your actual key):

```
VITE_GEMINI_API_KEY=your-actual-gemini-api-key-here
```

3. **Important**: Add `.env.local` to your `.gitignore` file to prevent accidentally committing your API key

### Step 3: Verify the Setup

The `.env.local` file should look like:
```
VITE_GEMINI_API_KEY=AIzaSy...abc123xyz...
```

## File Locations

- **Gemini Service**: `/src/services/geminiService.ts`
- **Compliance Service**: `/src/services/complianceService.ts` (updated with Gemini)
- **Audit Service**: `/src/services/auditService.ts` (updated with Gemini)
- **Dashboard**: `/src/dashboard.tsx` (passes files to services)
- **Config Template**: `/.env.local.example`

## How It Works

### Compliance Checking Flow

1. User uploads documents on the dashboard
2. Documents are stored temporarily in Firebase Storage
3. File content is extracted and sent to Gemini for analysis
4. Gemini returns:
   - Risk level (low/medium/high/critical)
   - Compliance score (0-100)
   - Key findings
   - Strengths and weaknesses
   - Recommendations

5. Results are combined with basic compliance checks
6. Average score is calculated from both checks

### Audit Report Flow

1. Compliance check completes
2. If Gemini analysis was performed, its results are used for audit summary
3. Gemini generates:
   - Executive summary
   - Key findings list
   - Risk assessment paragraph
   - Required actions
   - Timeline for fixes

4. Report is stored in Firestore database
5. Report is available for the user to download/view

## Supported Document Types

The system recognizes these document types:

- **Cybersecurity**: Files containing "cyber" or "security"
- **Criminal**: Files containing "criminal" or "investigation"
- **Financial**: Files containing "financial" or "finance"
- **Risk**: Files containing "risk"
- **Other**: Any other file type

## API Limitations

- **Rate Limit**: Check [Google's documentation](https://ai.google.dev/) for current rate limits
- **Token Limits**: Gemini has token limits per request (handles most documents fine)
- **Cost**: Free tier available, check pricing for production use
- **File Types**: Currently supports plain text extraction. For PDF/Word documents, consider using:
  - `pdf-parse` for PDFs
  - `mammoth` for Word documents

## Error Handling

If Gemini API calls fail:
1. Basic compliance checks still run
2. An error message is logged to console
3. A warning indicates manual review is recommended
4. The system continues without AI analysis

### Common Errors

**"Gemini API key not found"**
- Solution: Check `.env.local` file exists and has the correct key format

**"Network error connecting to Gemini"**
- Solution: Verify internet connection and API key is valid

**"Invalid API key"**
- Solution: Regenerate your API key from [Google AI Studio](https://ai.google.dev/)

## Testing the Integration

1. Start the app: `npm run dev`
2. Create an account and sign up
3. Upload test documents (text files work best for testing)
4. Check browser console (F12) for Gemini logs
5. Monitor the compliance and audit reports generated

## Environment Variables

All Gemini configuration uses environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Your Gemini API key | Yes |

## Security Notes

- Never commit `.env.local` to version control
- Use `.env.local.example` as a template for other developers
- Rotate API keys regularly in production
- Monitor API usage in Google Cloud Console

## Production Considerations

1. **Rate Limiting**: Implement request queuing for high traffic
2. **Caching**: Cache Gemini responses for identical documents
3. **Fallback**: Have manual review process if Gemini is unavailable
4. **Monitoring**: Set up alerts for API errors
5. **Cost**: Monitor Gemini API usage and costs

## Troubleshooting

### Gemini Analysis Not Running

Check browser console for errors:
```javascript
// Open DevTools (F12 or Cmd+Option+I)
// Look for logs starting with "Analyzing" or "Error analyzing"
```

### Compliance Check Failing

Verify:
1. Firebase is configured correctly
2. All required document types are uploaded
3. Documents are valid text/JSON files

### API Key Issues

1. Verify key is in `.env.local` (not `.env`)
2. Check key format: should start with `AIzaSy...`
3. Regenerate key if unsure

## Support

For issues with:
- **Gemini API**: Visit [Google AI Studio](https://ai.google.dev/)
- **Firebase**: Check [Firebase Documentation](https://firebase.google.com/docs)
- **This App**: Check browser console for detailed error messages
