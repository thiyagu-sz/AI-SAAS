-- =====================================================
-- COMPLETE DATABASE SETUP FOR QUICKNOTES
-- =====================================================
-- Run this ENTIRE script in Supabase SQL Editor
-- It will create missing tables AND apply RLS policies
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector extension for embeddings (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- 1. CREATE TABLES (IF NOT EXISTS)
-- =====================================================

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document chunks table (for vector search)
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(384),
  chunk_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document-Collection junction table
CREATE TABLE IF NOT EXISTS document_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  format TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  sources JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback table (optional)
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  feedback_type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat exports table
CREATE TABLE IF NOT EXISTS chat_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'doc')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_user_id ON document_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_collections_user_id ON document_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_exports_user_id ON chat_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_exports_conversation_id ON chat_exports(conversation_id);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_exports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. DROP EXISTING POLICIES (to avoid conflicts)
-- =====================================================

-- Collections
DROP POLICY IF EXISTS "Users can view own collections" ON collections;
DROP POLICY IF EXISTS "Users can insert own collections" ON collections;
DROP POLICY IF EXISTS "Users can update own collections" ON collections;
DROP POLICY IF EXISTS "Users can delete own collections" ON collections;

-- Documents
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

-- Document chunks
DROP POLICY IF EXISTS "Users can view own document_chunks" ON document_chunks;
DROP POLICY IF EXISTS "Users can insert own document_chunks" ON document_chunks;
DROP POLICY IF EXISTS "Users can delete own document_chunks" ON document_chunks;

-- Document collections
DROP POLICY IF EXISTS "Users can view own document_collections" ON document_collections;
DROP POLICY IF EXISTS "Users can insert own document_collections" ON document_collections;
DROP POLICY IF EXISTS "Users can delete own document_collections" ON document_collections;

-- Notes
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;

-- Chat conversations
DROP POLICY IF EXISTS "Users can view own chat_conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can insert own chat_conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can update own chat_conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can delete own chat_conversations" ON chat_conversations;

-- Chat messages
DROP POLICY IF EXISTS "Users can view own chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own chat_messages" ON chat_messages;

-- Feedback
DROP POLICY IF EXISTS "Users can insert feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;

-- Chat exports
DROP POLICY IF EXISTS "Users can view own chat_exports" ON chat_exports;
DROP POLICY IF EXISTS "Users can insert own chat_exports" ON chat_exports;
DROP POLICY IF EXISTS "Users can delete own chat_exports" ON chat_exports;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

-- COLLECTIONS POLICIES
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

-- DOCUMENTS POLICIES
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

-- DOCUMENT_CHUNKS POLICIES
CREATE POLICY "Users can view own document_chunks"
ON document_chunks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own document_chunks"
ON document_chunks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own document_chunks"
ON document_chunks FOR DELETE
USING (auth.uid() = user_id);

-- DOCUMENT_COLLECTIONS POLICIES
CREATE POLICY "Users can view own document_collections"
ON document_collections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own document_collections"
ON document_collections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own document_collections"
ON document_collections FOR DELETE
USING (auth.uid() = user_id);

-- NOTES POLICIES
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

-- CHAT_CONVERSATIONS POLICIES (CRITICAL FOR YOUR ISSUE!)
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

-- CHAT_MESSAGES POLICIES (CRITICAL FOR YOUR ISSUE!)
CREATE POLICY "Users can view own chat_messages"
ON chat_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat_messages"
ON chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat_messages"
ON chat_messages FOR DELETE
USING (auth.uid() = user_id);

-- FEEDBACK POLICIES
CREATE POLICY "Users can insert feedback"
ON feedback FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view own feedback"
ON feedback FOR SELECT
USING (auth.uid() = user_id);

-- CHAT_EXPORTS POLICIES
CREATE POLICY "Users can view own chat_exports"
ON chat_exports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat_exports"
ON chat_exports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat_exports"
ON chat_exports FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- 6. VERIFY SETUP
-- =====================================================

-- Run these queries to verify everything is set up:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- SELECT * FROM pg_policies;

-- =====================================================
-- DONE! Your database is now secure.
-- Each user can only see their own data.
-- =====================================================
