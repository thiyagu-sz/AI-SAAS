# Supabase Setup Guide

## Where to Find Your Supabase Credentials

### Step 1: Go to Supabase Dashboard
1. Visit: https://app.supabase.com
2. Sign in or create an account
3. Select your project (or create a new one)

### Step 2: Get Your Project URL
1. In your Supabase project dashboard, click on **Settings** (gear icon) in the left sidebar
2. Click on **API** in the settings menu
3. Under **Project URL**, you'll see something like:
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   This is your `NEXT_PUBLIC_SUPABASE_URL`

### Step 3: Get Your Anon/Public Key
1. Still in the **Settings > API** page
2. Under **Project API keys**, find the **anon** or **public** key
3. It will look like:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQxNzY5MzIwLCJleHAiOjE5NTczNDUzMjB9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 4: Update Your .env.local File

Create or edit `.env.local` in your project root with:

```env
# Supabase Configuration
# Get these from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQxNzY5MzIwLCJleHAiOjE5NTczNDUzMjB9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenRouter API Key (for AI chat)
# Get from: https://openrouter.ai/keys
OPENROUTER_API_KEY=your_openrouter_api_key_here

# OpenAI API Key (for embeddings)
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here
```

## Important Notes:

- **NEXT_PUBLIC_SUPABASE_URL** should start with `https://` and end with `.supabase.co`
- **NEXT_PUBLIC_SUPABASE_ANON_KEY** is a long JWT token (starts with `eyJ...`)
- Never commit `.env.local` to git (it's already in `.gitignore`)
- After updating `.env.local`, restart your dev server (`npm run dev`)

## Quick Links:

- **Supabase Dashboard**: https://app.supabase.com
- **API Settings**: https://app.supabase.com/project/_/settings/api
- **Create New Project**: https://app.supabase.com/project/new

