# WHERE TO PUT YOUR GEMINI API KEY

## Quick Answer
Create a file at this exact path:

```
/Users/Shalya/Desktop/Hackathons 2025/HackUTD-Nexus/my-react-app/.env.local
```

With this content:
```
VITE_GEMINI_API_KEY=your-actual-gemini-api-key-here
```

## Step-by-Step

### 1. Open Terminal
```bash
cd "/Users/Shalya/Desktop/Hackathons 2025/HackUTD-Nexus/my-react-app"
```

### 2. Create .env.local file
```bash
# Using a text editor (VS Code)
code .env.local

# Or create with echo
echo "VITE_GEMINI_API_KEY=your-key-here" > .env.local
```

### 3. Get Your API Key
- Go to: https://ai.google.dev/
- Click "Get API Key"
- Copy the generated key

### 4. Edit .env.local
Paste your key so it looks like:
```
VITE_GEMINI_API_KEY=AIzaSyDjd2XvF5NLnEHpdOw4zGdxOp6wQgrUfsQ
```

### 5. Save and Restart
- Save the file
- Stop the dev server (Ctrl+C)
- Restart: `npm run dev`

## Full Directory Structure
```
HackUTD-Nexus/
└── my-react-app/
    ├── .env.local          ← CREATE THIS FILE HERE
    ├── .env.local.example  ← Reference template
    ├── package.json
    ├── src/
    ├── index.html
    └── ...
```

## File Content Example

```
# .env.local (ACTUAL FILE)
VITE_GEMINI_API_KEY=AIzaSy1234567890abc123def456ghi789jkl
```

## Important Security Notes

⚠️ **NEVER commit .env.local to Git!**

1. Add to `.gitignore`:
```bash
# In my-react-app folder, add this line to .gitignore:
.env.local
```

2. Use `.env.local.example` as template for other developers:
```
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

## Verification

After adding the key, you should see this in console when running:
```
✓ Gemini service will be initialized when first used
```

And when uploading documents:
```
Analyzing cybersecurity document with Gemini...
Compliance analysis result: { ... }
```

## Troubleshooting

### "Gemini API key not found"
- Check file is named `.env.local` (with dot)
- Check file is in `my-react-app` folder
- Verify spelling: `VITE_GEMINI_API_KEY`
- Restart dev server

### "Invalid API key"
- Make sure you copied entire key
- Try generating new key at https://ai.google.dev/
- Check no extra spaces before/after key

### Files Won't Process
- Check browser console (F12)
- Look for error messages
- Verify API key is valid
- Try a simple text file first

## Environment Variable Name
**Exact name required:** `VITE_GEMINI_API_KEY`

This is a Vite environment variable pattern, so it needs:
- Prefix: `VITE_`
- Underscore after prefix
- All caps
