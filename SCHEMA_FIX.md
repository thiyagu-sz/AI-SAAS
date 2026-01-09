# Schema Fix Instructions

## Current Schema Issue

Your `document_collections` table stores file data directly, but the code expects it to be a junction table linking `documents` to `collections`.

## Option 1: Update Code to Match Your Schema (Recommended)

The code will be updated to work with your existing schema where:
- `document_collections` stores files directly (file_name, file_type, file_size, content, embedding)
- No need for a separate `documents` table for this purpose

## Option 2: Fix Schema to Match Code

If you want to use the junction table approach, run this SQL:

```sql
-- Add missing columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'processing',
ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT;

-- Recreate document_collections as junction table
DROP TABLE IF EXISTS document_collections;

CREATE TABLE document_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, document_id)
);

CREATE INDEX idx_document_collections_collection_id ON document_collections(collection_id);
CREATE INDEX idx_document_collections_document_id ON document_collections(document_id);
```

**Note:** Option 1 is recommended since you already have the schema set up. The code will be updated to work with your current structure.

