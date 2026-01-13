# QuickNotes - Complete Project Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Architecture](#3-project-architecture)
4. [Database Schema](#4-database-schema)
5. [Authentication Flow](#5-authentication-flow)
6. [Core Features & How They Work](#6-core-features--how-they-work)
7. [API Routes](#7-api-routes)
8. [Frontend Components](#8-frontend-components)
9. [File Structure](#9-file-structure)
10. [Environment Variables](#10-environment-variables)
11. [Deployment](#11-deployment)

---

## 1. Project Overview

**QuickNotes** is an AI-powered SaaS application that helps students convert dense PDFs, PowerPoint presentations, and Word documents into concise, exam-ready study notes. The app uses AI (via OpenRouter API with LLaMA models) to generate summaries, and allows users to chat with their documents to clarify concepts.

### Key Features:
- 📄 **Document Upload**: Upload PDFs, PPT, PPTX, and DOCX files
- 🤖 **AI Chat**: Chat with AI about your uploaded documents
- 📝 **Smart Notes Generation**: Generate study notes in various formats (key points, exam notes, summaries, etc.)
- 💾 **Save & Export**: Save conversations and export notes as PDF or Markdown
- 🔐 **Authentication**: Secure login with email/password or Google OAuth

---

## 2. Tech Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | React framework with App Router | 16.1.1 |
| **React** | UI library | 19.2.3 |
| **TypeScript** | Type-safe JavaScript | ^5 |
| **Tailwind CSS** | Utility-first CSS framework | ^4 |
| **Lucide React** | Icon library | ^0.562.0 |

### Backend
| Technology | Purpose |
|------------|---------|
| **Next.js API Routes** | Serverless API endpoints |
| **Supabase** | PostgreSQL database & authentication |
| **OpenRouter API** | AI model access (LLaMA 3.2) |

### Document Processing
| Library | Purpose |
|---------|---------|
| **pdfjs-dist** | PDF text extraction |
| **mammoth** | DOCX text extraction |
| **puppeteer** | PDF generation for exports |

### Deployment & Analytics
| Service | Purpose |
|---------|---------|
| **Vercel** | Hosting & deployment |
| **Vercel Speed Insights** | Performance monitoring |
| **Vercel Analytics** | Usage analytics |

---

## 3. Project Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Landing Page│  │  Chat Page  │  │ Upload Page │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP ROUTER                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    API ROUTES (/api/*)                      ││
│  │  /api/chat     - AI chat with streaming                     ││
│  │  /api/upload   - Document upload & processing               ││
│  │  /api/chat/save - Save conversations                        ││
│  │  /api/chat/history - Load chat history                      ││
│  │  /api/chat/pdf - Generate PDF exports                       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │   Supabase    │  │  OpenRouter   │  │    Vercel     │       │
│  │  (Database)   │  │  (AI/LLM)     │  │  (Hosting)    │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User uploads document
        │
        ▼
┌───────────────────┐
│  /api/upload      │ ──► Extract text from PDF/DOCX/PPT
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Text Chunking    │ ──► Split into ~1000 char chunks with overlap
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Generate         │ ──► Create embeddings (OpenAI or fallback)
│  Embeddings       │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Store in         │ ──► documents, document_chunks tables
│  Supabase         │
└───────────────────┘
        │
        ▼
User asks question in chat
        │
        ▼
┌───────────────────┐
│  Vector Search    │ ──► Find similar chunks using embeddings
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  OpenRouter AI    │ ──► Generate response with context
│  (LLaMA 3.2)      │
└───────────────────┘
        │
        ▼
Response streamed to user
```

---

## 4. Database Schema

QuickNotes uses **Supabase PostgreSQL** with the following tables:

### Core Tables

#### `collections`
Stores document collections (folders) created by users.
```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `documents`
Stores uploaded document metadata.
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  content TEXT,           -- Extracted text content
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `document_chunks`
Stores text chunks with embeddings for vector search.
```sql
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(384),  -- For similarity search
  chunk_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `document_collections`
Junction table linking documents to collections.
```sql
CREATE TABLE document_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  collection_id UUID REFERENCES collections(id),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `notes`
Stores generated AI notes for collections.
```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  format TEXT,            -- 'key-points', 'summary', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `chat_conversations`
Stores chat conversation metadata.
```sql
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `chat_messages`
Stores individual chat messages.
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,     -- 'user' or 'assistant'
  content TEXT NOT NULL,
  sources JSONB,          -- Document sources referenced
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Authentication Flow

QuickNotes uses **Supabase Auth** for authentication.

### Supported Auth Methods:
1. **Email/Password** - Traditional login
2. **Google OAuth** - Single sign-on with Google

### Authentication Flow Diagram:

```
┌─────────────────┐
│  Landing Page   │
│      (/)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Check Session  │────►│  Has Session?   │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
            ┌───────────┐             ┌───────────┐
            │   YES     │             │    NO     │
            │ Redirect  │             │   Show    │
            │ to /chat  │             │  Landing  │
            └───────────┘             └─────┬─────┘
                                            │
                                            ▼
                                    ┌───────────────┐
                                    │ Click Login/  │
                                    │   Signup      │
                                    └───────┬───────┘
                                            │
                        ┌───────────────────┴───────────────────┐
                        │                                       │
                        ▼                                       ▼
                ┌───────────────┐                       ┌───────────────┐
                │ Email/Password│                       │ Google OAuth  │
                │    Login      │                       │    Login      │
                └───────┬───────┘                       └───────┬───────┘
                        │                                       │
                        ▼                                       ▼
                ┌───────────────┐                       ┌───────────────┐
                │   Supabase    │                       │   Google      │
                │ signInWith    │                       │   Consent     │
                │   Password    │                       │    Screen     │
                └───────┬───────┘                       └───────┬───────┘
                        │                                       │
                        └───────────────┬───────────────────────┘
                                        │
                                        ▼
                                ┌───────────────┐
                                │  Session Set  │
                                │  Redirect to  │
                                │    /chat      │
                                └───────────────┘
```

### Code Implementation:

**Client-side auth check (page.tsx):**
```typescript
useEffect(() => {
  const checkAuth = async () => {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      router.push('/chat');  // Redirect authenticated users
    }
  };
  checkAuth();
}, [router]);
```

**Login with Google (login/page.tsx):**
```typescript
const handleGoogleLogin = async () => {
  const supabase = getSupabaseClient();
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/chat`,
    },
  });
};
```

---

## 6. Core Features & How They Work

### 6.1 Document Upload

**Location:** `app/upload/page.tsx` + `app/api/upload/route.ts`

**Process:**
1. User drags/drops or selects files (PDF, DOCX, PPT, PPTX)
2. Files are sent to `/api/upload` endpoint
3. Text is extracted using appropriate library:
   - PDF → `pdfjs-dist`
   - DOCX → `mammoth`
   - PPT/PPTX → Custom extraction
4. Text is chunked into ~1000 character segments with 200 char overlap
5. Embeddings are generated (OpenAI API or fallback hash-based)
6. Document metadata and chunks stored in Supabase

**Code snippet (text chunking):**
```typescript
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): Chunk[] {
  const chunks: Chunk[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push({
      content: text.substring(start, end),
      start,
      end,
    });
    start = end - overlap;
  }

  return chunks;
}
```

### 6.2 AI Chat

**Location:** `app/chat/page.tsx` + `app/api/chat/route.ts`

**Process:**
1. User types a question in the chat interface
2. Question is sent to `/api/chat` endpoint
3. Server generates embedding for the question
4. Vector similarity search finds relevant document chunks
5. Context (relevant chunks) + question sent to OpenRouter AI
6. AI response is streamed back to the client
7. Messages can be saved to `chat_conversations` table

**AI Model:** `meta-llama/llama-3.2-3b-instruct:free` (via OpenRouter)

**Streaming Implementation:**
```typescript
return new ReadableStream({
  async start(controller) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: [...],
        stream: true,
      }),
    });
    
    // Stream response chunks to client
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      controller.enqueue(value);
    }
    controller.close();
  }
});
```

### 6.3 Notes Generation Formats

Users can request notes in different formats:

| Format | Description |
|--------|-------------|
| `key-points` | Bullet points of main ideas |
| `main-concepts` | Core concepts explained |
| `exam-points` | Exam-focused summary |
| `short-notes` | Condensed notes |
| `speech-notes` | For presentations |
| `presentation-notes` | Slide-ready content |
| `summary` | Full summary |

### 6.4 Export System

**Location:** `app/exports/page.tsx` + `app/api/chat/pdf/route.ts`

**PDF Export Process:**
1. User clicks export button
2. Content is formatted with professional styling
3. Puppeteer generates PDF with:
   - Custom CSS styling
   - Page margins
   - Headers/footers (optional)
4. PDF returned as downloadable file

**Markdown Export:**
- Direct download of markdown-formatted content

---

## 7. API Routes

### `/api/chat` (POST)
Main chat endpoint for AI conversations.

**Request:**
```json
{
  "message": "Explain the key concepts",
  "model": "gpt-4",
  "format": "key-points",
  "wordCount": 200
}
```

**Response:** Server-Sent Events (SSE) stream

---

### `/api/upload` (POST)
Handle document uploads.

**Request:** FormData with files + collection info

**Response:**
```json
{
  "success": true,
  "documentIds": ["uuid1", "uuid2"],
  "collectionId": "uuid"
}
```

---

### `/api/chat/save` (POST)
Save a chat conversation.

**Request:**
```json
{
  "title": "Study Session 1",
  "messages": [...],
  "conversationId": "optional-uuid"
}
```

---

### `/api/chat/history` (GET)
Get user's chat history.

**Query params:** `?limit=3`

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "Study Session",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### `/api/chat/pdf` (POST)
Generate PDF export.

**Request:**
```json
{
  "content": "markdown content",
  "filename": "notes.pdf"
}
```

**Response:** PDF file (binary)

---

## 8. Frontend Components

### Page Components

| Component | Path | Purpose |
|-----------|------|---------|
| `Home` | `app/page.tsx` | Landing page with auth check |
| `ChatPage` | `app/chat/page.tsx` | Main AI chat interface |
| `UploadPage` | `app/upload/page.tsx` | Document upload interface |
| `ExportsPage` | `app/exports/page.tsx` | View/download exports |
| `SavedItemsPage` | `app/saved/page.tsx` | Saved/bookmarked items |
| `LoginPage` | `app/login/page.tsx` | User login |
| `SignupPage` | `app/signup/page.tsx` | User registration |
| `NotePage` | `app/notes/[id]/page.tsx` | View individual note |
| `DashboardPage` | `app/dashboard/page.tsx` | User dashboard |

### Shared Components

| Component | Path | Purpose |
|-----------|------|---------|
| `Sidebar` | `app/components/Sidebar.tsx` | Navigation sidebar with chat history |
| `LandingPage` | `app/components/LandingPage.tsx` | Marketing landing page |
| `FeedbackForm` | `app/components/FeedbackForm.tsx` | User feedback modal |

### Utility Libraries

| Library | Path | Purpose |
|---------|------|---------|
| `supabase.ts` | `app/lib/supabase.ts` | Supabase client factory |
| `markdown.tsx` | `app/lib/markdown.tsx` | Markdown → React renderer |
| `reportGenerator.ts` | `app/lib/reportGenerator.ts` | Professional report formatting |

---

## 9. File Structure

```
AI-SAAS/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (fonts, meta, SpeedInsights)
│   ├── page.tsx                 # Landing page entry
│   ├── globals.css              # Global Tailwind styles
│   │
│   ├── api/                     # API Routes
│   │   ├── chat/
│   │   │   ├── route.ts         # Main AI chat endpoint
│   │   │   ├── save/route.ts    # Save conversations
│   │   │   ├── history/route.ts # Load chat history
│   │   │   ├── load/route.ts    # Load specific conversation
│   │   │   ├── export/route.ts  # Export conversations
│   │   │   └── pdf/route.ts     # Generate PDF
│   │   ├── upload/route.ts      # Document upload
│   │   ├── notes/generate/route.ts
│   │   ├── feedback/route.ts
│   │   └── test-openrouter/route.ts
│   │
│   ├── components/              # Shared components
│   │   ├── Sidebar.tsx
│   │   ├── LandingPage.tsx
│   │   └── FeedbackForm.tsx
│   │
│   ├── lib/                     # Utilities
│   │   ├── supabase.ts          # Supabase client
│   │   ├── markdown.tsx         # Markdown renderer
│   │   └── reportGenerator.ts   # Report formatting
│   │
│   ├── chat/page.tsx            # Chat interface
│   ├── upload/page.tsx          # Upload interface
│   ├── login/page.tsx           # Login page
│   ├── signup/page.tsx          # Signup page
│   ├── dashboard/page.tsx       # Dashboard
│   ├── exports/page.tsx         # Exports list
│   ├── saved/page.tsx           # Saved items
│   └── notes/[id]/page.tsx      # Individual note view
│
├── public/                      # Static assets
│   ├── demo.png                 # Landing page hero image
│   └── *.svg                    # Icons
│
├── package.json                 # Dependencies
├── next.config.ts               # Next.js config
├── tsconfig.json                # TypeScript config
├── tailwind.config.ts           # Tailwind config
├── postcss.config.mjs           # PostCSS config
└── .env.local                   # Environment variables (not in git)
```

---

## 10. Environment Variables

Create a `.env.local` file with these variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenRouter API (for AI)
OPENROUTER_API_KEY=sk-or-v1-your-key

# OpenAI API (optional, for embeddings)
OPENAI_API_KEY=sk-your-key

# Site URL (for OAuth redirects)
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### Variable Explanations:

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `OPENROUTER_API_KEY` | ✅ | OpenRouter API for AI chat |
| `OPENAI_API_KEY` | ❌ | Better embeddings (has fallback) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Your deployed URL for OAuth |

---

## 11. Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository:**
   ```bash
   # Push to GitHub
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to vercel.com/new
   - Import your GitHub repository
   - Vercel auto-detects Next.js

3. **Configure Environment Variables:**
   - Add all env variables in Vercel dashboard
   - Settings → Environment Variables

4. **Deploy:**
   - Vercel auto-deploys on push to main

### Supabase Setup

1. Create new Supabase project
2. Run database schema (create tables)
3. Enable Google OAuth in Authentication settings
4. Add site URL to Auth → URL Configuration
5. Copy credentials to env variables

### Post-Deployment Checklist

- [ ] Test login/signup flows
- [ ] Test Google OAuth
- [ ] Test document upload
- [ ] Test AI chat
- [ ] Test PDF export
- [ ] Check Vercel Speed Insights
- [ ] Monitor error logs

---

## Quick Reference Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)

# Build
npm run build            # Production build

# Start production
npm start                # Start production server

# Linting
npm run lint             # Run ESLint
```

---

## Summary

**QuickNotes** is a full-stack AI SaaS application built with:
- **Next.js 16** for the frontend and API routes
- **Supabase** for PostgreSQL database and authentication
- **OpenRouter** for AI chat capabilities (LLaMA 3.2)
- **Tailwind CSS** for styling
- **Vercel** for deployment

The application allows users to upload documents, have AI-powered conversations about them, generate study notes in various formats, and export their work as PDF or Markdown files.

---

*Documentation generated for QuickNotes v0.1.0*
