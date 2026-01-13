-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR QUICKNOTES
-- =====================================================
-- CRITICAL: Run this in your Supabase SQL Editor to ensure
-- each user can only see their own data!
-- =====================================================

-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. DROP EXISTING POLICIES (if any) TO AVOID CONFLICTS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own collections" ON collections;
DROP POLICY IF EXISTS "Users can insert own collections" ON collections;
DROP POLICY IF EXISTS "Users can update own collections" ON collections;
DROP POLICY IF EXISTS "Users can delete own collections" ON collections;

DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

DROP POLICY IF EXISTS "Users can view own document_chunks" ON document_chunks;
DROP POLICY IF EXISTS "Users can insert own document_chunks" ON document_chunks;
DROP POLICY IF EXISTS "Users can delete own document_chunks" ON document_chunks;

DROP POLICY IF EXISTS "Users can view own document_collections" ON document_collections;
DROP POLICY IF EXISTS "Users can insert own document_collections" ON document_collections;
DROP POLICY IF EXISTS "Users can delete own document_collections" ON document_collections;

DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;

DROP POLICY IF EXISTS "Users can view own chat_conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can insert own chat_conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can update own chat_conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can delete own chat_conversations" ON chat_conversations;

DROP POLICY IF EXISTS "Users can view own chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own chat_messages" ON chat_messages;

-- 3. CREATE RLS POLICIES FOR COLLECTIONS
-- =====================================================

CREATE POLICY "Users can view own collections"
ON collections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections"
ON collections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
ON collections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
ON collections FOR DELETE
USING (auth.uid() = user_id);

-- 4. CREATE RLS POLICIES FOR DOCUMENTS
-- =====================================================

CREATE POLICY "Users can view own documents"
ON documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
ON documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
ON documents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
ON documents FOR DELETE
USING (auth.uid() = user_id);

-- 5. CREATE RLS POLICIES FOR DOCUMENT_CHUNKS
-- =====================================================

CREATE POLICY "Users can view own document_chunks"
ON document_chunks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own document_chunks"
ON document_chunks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own document_chunks"
ON document_chunks FOR DELETE
USING (auth.uid() = user_id);

-- 6. CREATE RLS POLICIES FOR DOCUMENT_COLLECTIONS
-- =====================================================

CREATE POLICY "Users can view own document_collections"
ON document_collections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own document_collections"
ON document_collections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own document_collections"
ON document_collections FOR DELETE
USING (auth.uid() = user_id);

-- 7. CREATE RLS POLICIES FOR NOTES
-- =====================================================

CREATE POLICY "Users can view own notes"
ON notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
ON notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
ON notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
ON notes FOR DELETE
USING (auth.uid() = user_id);

-- 8. CREATE RLS POLICIES FOR CHAT_CONVERSATIONS (MOST IMPORTANT!)
-- =====================================================

CREATE POLICY "Users can view own chat_conversations"
ON chat_conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat_conversations"
ON chat_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat_conversations"
ON chat_conversations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat_conversations"
ON chat_conversations FOR DELETE
USING (auth.uid() = user_id);

-- 9. CREATE RLS POLICIES FOR CHAT_MESSAGES (MOST IMPORTANT!)
-- =====================================================

CREATE POLICY "Users can view own chat_messages"
ON chat_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat_messages"
ON chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat_messages"
ON chat_messages FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION QUERY
-- Run this to verify RLS is enabled on all tables
-- =====================================================

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

-- Expected result: All tables should show rowsecurity = true
