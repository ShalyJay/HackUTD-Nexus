# Quick Start: Gemini Integration

## 5-Minute Setup

### 1. Get Gemini API Key (2 min)
- Go to https://ai.google.dev/
- Click "Get API Key"
- Copy the generated key

### 2. Add to Project (1 min)
Create a file named `.env.local` in the `my-react-app` folder:

```
VITE_GEMINI_API_KEY=AIzaSy[your-key-here]
```

**Don't commit this file!** It contains your secret key.

### 3. Install Dependencies (1 min)
```bash
cd my-react-app
npm install
```

### 4. Run the App (1 min)
```bash
npm run dev
```

## What You Get

✅ Intelligent document analysis with Gemini  
✅ Compliance risk scoring  
✅ Detailed audit reports  
✅ Automatic recommendations  

## Testing It

1. Open http://localhost:5173
2. Sign up for an account
3. Upload test documents (.txt files work best)
4. Watch as Gemini analyzes them
5. Get detailed compliance reports

## Troubleshooting

**"API key not found"**
- Check `.env.local` file exists
- Verify spelling: `VITE_GEMINI_API_KEY`
- Restart dev server after adding key

**"Invalid API key"**
- Get a new key from https://ai.google.dev/
- Make sure you copied the entire key

**Still having issues?**
- Check browser console for detailed error messages
- See `GEMINI_SETUP.md` for detailed documentation

## Next Steps

- Customize compliance rules in `geminiService.ts`
- Add PDF support with `pdf-parse` library
- Create admin dashboard to view audit reports
- Set up email notifications for compliance failures
