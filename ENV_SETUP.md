# Environment Variables Setup

## Quick Fix for 401 Unauthorized Error

Your OpenRouter API key needs to be in `.env.local` file.

### Step 1: Create/Edit `.env.local`

Create or edit the file: `ai-study-notes/.env.local`

### Step 2: Add Your API Key

Make sure your `.env.local` file contains:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenRouter API Key (REQUIRED for chat)
OPENROUTER_API_KEY=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

# OpenAI API Key (Optional - for better embeddings)
OPENAI_API_KEY=your_openai_key_here
```

### Step 3: Important Notes

- **NO spaces** around the `=` sign
- **NO quotes** around the key value
- **NO trailing spaces** at the end of the line
- The key should be on a single line

### Step 4: Restart Server

**CRITICAL**: After adding/updating `.env.local`, you MUST restart your dev server:

1. Stop the server (press `Ctrl+C` in the terminal)
2. Start it again: `npm run dev`

### Step 5: Verify

Check the server console - you should see logs like:
- "API Key check: Key exists (length: XX)"
- "Making request to OpenRouter with model: nvidia/nemotron-3-nano-30b-a3b:free"

If you still see errors, check:
1. The `.env.local` file is in the `ai-study-notes` folder (not in `app` folder)
2. The file is named exactly `.env.local` (not `.env` or `env.local`)
3. The server was restarted after adding the key

