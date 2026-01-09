# Chat Feature Troubleshooting Guide

## Issue: Conversations Not Showing

### Step 1: Verify Database Schema is Created

The `chat_conversations` table must exist in your Supabase database.

1. Open Supabase Dashboard: https://app.supabase.com
2. Go to your project
3. Click **SQL Editor** in the left sidebar
4. Copy the entire contents of `CHAT_SCHEMA.sql`
5. Paste and click **Run**
6. Verify tables were created by checking **Table Editor**

You should see these tables:
- `chat_conversations`
- `chat_messages`
- `chat_exports`

### Step 2: Enable Chat Saving

Conversations are only saved when you enable the toggle:

1. Go to `/chat` page
2. **Before sending any messages**, check the checkbox:
   - ✅ "Save this chat for future reference"
3. Send a message and wait for AI response
4. After the AI responds, the conversation will be saved automatically
5. Check the sidebar - it should appear under "Previous Conversations"

### Step 3: Check Browser Console

Open browser console (F12) and look for:
- `Chat history loaded: X conversations` (if successful)
- Any error messages (401, 500, etc.)

### Step 4: Check Server Logs

In your terminal where `npm run dev` is running, look for:
- `Found X conversations for user ...` (if successful)
- Any database errors

## Issue: Chat UI/Design Not Showing

### Verify the Chat Page is Rendering

1. Navigate to `/chat` in your browser
2. You should see:
   - Sidebar on the left
   - "AI Assistant" header at the top
   - Empty state message: "How can I help you today?"
   - Input box at the bottom with "Save this chat" checkbox

### Format Options Panel

The format options panel appears automatically when:
- You type more than 200 characters in the input box
- It shows below the input area with format options (Key Points, Summary, etc.)

If it's not showing:
1. Type a long message (200+ characters)
2. The panel should appear automatically
3. If not, check browser console for errors

## Quick Test Checklist

- [ ] Database schema is created (run CHAT_SCHEMA.sql)
- [ ] You're logged in
- [ ] "Save this chat" checkbox is enabled
- [ ] You've sent at least one message with AI response
- [ ] Browser console shows no errors
- [ ] Server logs show no errors

## Common Errors

### Error 401 (Unauthorized)
- You're not logged in
- Session expired - refresh the page
- Auth token invalid - log out and log back in

### Error 500 (Server Error)
- Database tables don't exist - run CHAT_SCHEMA.sql
- Database connection issue - check Supabase project status
- Check server logs for detailed error messages

### No Conversations Showing
- You haven't enabled "Save this chat" toggle
- No messages have been sent yet
- Conversations exist but not loading - check browser console

## Still Not Working?

1. **Check Server Logs**: Look for detailed error messages
2. **Check Browser Console**: Look for JavaScript errors
3. **Verify Database**: Use Supabase Table Editor to check if tables exist
4. **Test API Directly**: 
   - Open browser console
   - Run: `fetch('/api/chat/history?limit=10').then(r => r.json()).then(console.log)`
   - Check the response
