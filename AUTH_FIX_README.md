# Authentication Fix - User Data Isolation Issue

## Problem
Users are seeing other users' chat history after logging in. This is a critical security issue caused by:
1. Missing Row Level Security (RLS) policies in Supabase
2. Missing `user_id` in chat_messages inserts
3. Supabase client not properly isolated per session

## Solution Applied

### 1. Fixed Supabase Client (`app/lib/supabase.ts`)
- Added singleton pattern with proper auth configuration
- Session persistence with unique storage key
- Added `clearSupabaseClient()` function for clean logout

### 2. Fixed Chat Save Route (`app/api/chat/save/route.ts`)
- Added `user_id` to all message inserts for RLS compliance

### 3. Fixed Sidebar (`app/components/Sidebar.tsx`)
- Clear client instance and chat history on sign out

## CRITICAL: Run RLS Policies in Supabase

**You MUST run `SUPABASE_RLS_POLICIES.sql` in your Supabase SQL Editor!**

### Steps:
1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `SUPABASE_RLS_POLICIES.sql`
5. Paste it into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)

### What the SQL does:
- Enables Row Level Security on ALL tables
- Creates policies so users can ONLY see their own data
- This is the DATABASE-LEVEL security that prevents data leakage

## Verify RLS is Working

Run this query in Supabase SQL Editor:

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'collections',
  'documents', 
  'document_chunks',
  'document_collections',
  'notes',
  'chat_conversations',
  'chat_messages'
);
```

**Expected result:** All tables should show `rowsecurity = true`

## After Running the SQL

1. **Clear browser cache** or use incognito mode
2. **Log out** of the app completely
3. **Log in** with your account
4. Verify you only see YOUR chat history

## If Issues Persist

### Check chat_messages table has user_id column:
```sql
-- Add user_id column if missing
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing messages to have user_id from their conversation
UPDATE chat_messages cm
SET user_id = cc.user_id
FROM chat_conversations cc
WHERE cm.conversation_id = cc.id
AND cm.user_id IS NULL;
```

### Make user_id NOT NULL after backfill:
```sql
ALTER TABLE chat_messages 
ALTER COLUMN user_id SET NOT NULL;
```

## Security Best Practices

1. **Always enable RLS** on tables with user data
2. **Always include user_id** in INSERT statements
3. **Use singleton pattern** for Supabase client on client-side
4. **Clear session state** on logout
5. **Test with multiple accounts** before going to production
